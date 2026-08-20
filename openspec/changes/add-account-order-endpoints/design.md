## Context

`app/Http/Controllers/Api/OrderController.php` already implements list (`get`) and details (`show`) against `app/Services/OrderService.php`, which already supports a `customer_id` filter in `OrderListFilterDTO`/`list_query()` — it's just never forced today, because the admin endpoint is meant to see every customer's orders.

`app/Http/Controllers/Site/AccountController.php` already establishes the pattern this change follows: resolve `Customer` via `CustomerService::find_by_user_id(user()->get_id())`, act only on that customer's record, and mount under `/account/*` behind the `AuthMiddleware` group at the bottom of `routes/api.php`. `AuthMiddleware` only checks `is_user_logged_in()` — it does not gate by admin capability — so every account endpoint (existing and new) is responsible for its own ownership scoping; none of it comes from middleware.

A customer-facing order resource variant already exists as precedent: `app/Resources/Site/Order/OrderResource.php` extends the admin `app/Resources/Order/OrderResource.php` and adds `payment_next_step`, used by checkout confirmation. This change follows the same extension pattern for the account details endpoint, but also needs to *remove* two fields, which that existing resource does not do.

## Goals / Non-Goals

**Goals:**
- Reuse `OrderService`'s existing filter/sort/search/pagination logic unchanged for the account list endpoint — only the customer scoping is new.
- Guarantee an order beloning to another customer is indistinguishable from a non-existent order, at both the list and details endpoints.
- Keep `admin_notes`/`flags` out of the customer-facing response.

**Non-Goals:**
- No changes to the admin `/orders` endpoints, admin `OrderResource`, or admin UI.
- No frontend work — this change is the backend endpoints only, matching how profile/password/addresses shipped backend-first.
- No new write capability — both new endpoints are read-only (`GET`).

## Decisions

### Controller: extend `AccountController`
Add `orders()` and `show_order()` to the existing `Site\AccountController`, injecting `OrderService` via the method (matching how `change_password` injects `UserService` directly rather than the constructor). Rejected: a separate `AccountOrderController` — with only two read methods, splitting it out mirrors the admin controller split without a matching size justification, and would fragment the "resolve customer, act on own record" pattern across two files instead of one.

### Ownership-checked lookup: `OrderService::find_order_for_customer_or_fail()`
Add one method alongside the existing `find_order_or_fail($id)`:
```php
public function find_order_for_customer_or_fail($id, $customer_id)
{
    $order = $this->find_order($id);

    if (!$order || empty($customer_id) || (int) $order->customer_id !== (int) $customer_id) {
        throw new NotFoundException(__('Order not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
    }

    return $order;
}
```
Same `NotFoundException`/message as the unscoped lookup, so a foreign order and a nonexistent order produce identical responses (see spec scenario "Order belongs to another customer"). Rejected: adding a `customer_id` parameter to `find_order_or_fail` itself — that method is also used by the admin `show()` path, which must keep seeing every order.

**Correction during implementation**: the original version of this method omitted the `Response::NOT_FOUND` code, matching `find_order_or_fail`'s own no-code form — which this codebase's `ApiExceptionHandler` falls back to HTTP 500 for (any `NotFoundException` without an explicit code < 100 hits the generic 500 fallback, not the 404 path, which only triggers for `ModelNotFoundException`). That was only noticed while writing the Bruno API docs and tracing the actual response status. Fixed to pass `Response::NOT_FOUND` explicitly, matching the sibling `UpdateAccountProfileAction`'s "Customer could not be found" 404 within this same `account-self-service` capability — a "not found" response returning 404 is what every other endpoint in this capability already does, and what the docs need to describe. `find_order_or_fail` (the admin, unscoped lookup) is untouched and still returns 500 on a nonexistent order — that's pre-existing behavior outside this change's scope.

### List scoping: force `customer_id` after building the DTO, not before
`orders()` builds `OrderListFilterDTO::from_array($request->all())` exactly like the admin `get()`, then overwrites `$params->customer_id` with the resolved customer's id as the last step before calling the service — so a client-supplied `customer_id` is always discarded, never merged or validated. No new filter DTO needed; `OrderListFilterDTO` is reused as-is.

### Customer record resolution and the empty-list vs not-found split
Both new endpoints resolve `Customer` via `CustomerService::find_by_user_id(user()->get_id())`, same as `update_profile`/`update_addresses`. They diverge from those two on what happens when no `Customer` record exists:
- **List**: return an empty, successfully-paginated list. A `Customer` record is provisioned during checkout (`checkout-customer-provisioning`), so a user with no `Customer` record has never placed an order — "zero orders" is the *correct* answer, not an error.
- **Details**: return not-found (`find_order_for_customer_or_fail` naturally does this once `customer_id` is `null`/absent — no order can match a null customer id).

This differs from `update_profile`/`update_addresses`, which fail with not-found on a missing `Customer` record — those are write endpoints where "no record to update" is genuinely an error, not the case here for a read/list.

### Response shape: `Resources\Site\Account\OrderResource` is a standalone allowlist resource
New class, new namespace (`app/Resources/Site/Account/OrderResource.php`), extending `Framework\Resource` directly (not `Site\Order\OrderResource` or the admin `Order\OrderResource`) and listing every field explicitly in its own `to_array()`: the full admin field set minus `admin_notes`/`flags`, plus `payment_next_step` (`Payment::pay($this->resource)`, same call `Site\Order\OrderResource` uses).

**Correction during implementation**: the original decision below (extend `Site\Order\OrderResource`, subtract two fields via `array_diff_key`) was reversed per explicit user direction while implementing task 2.1 — copy the fields this resource needs rather than inherit and subtract. This removes the denylist-drift risk entirely (a new field added upstream to either admin resource no longer reaches the customer response automatically) at the cost of the two field lists now being able to drift apart silently in the other direction — a field could be added to the admin resource that *should* also be customer-visible and get missed here. No structural guard against that either; same "flag it, don't over-build for two lists" posture, just inverted.

~~Rejected~~ (superseded by the correction above): extending `Site\Order\OrderResource` and overriding `to_array()` with `array_diff_key(parent::to_array(), array_flip(['admin_notes', 'flags']))`. Kept here for the record of what was tried first and why it was reversed.

List endpoint reuses `app/Resources/Order/OrderListResource.php` unchanged — it already contains no admin-only fields.

### Routes
```php
Route::group(['middleware' => AuthMiddleware::class], function () {
    Route::put('/account/profile', [AccountController::class, 'update_profile']);
    Route::put('/account/password-change', [AccountController::class, 'change_password']);
    Route::put('/account/addresses', [AccountController::class, 'update_addresses']);
    Route::get('/account/orders', [AccountController::class, 'orders']);
    Route::get('/account/orders/{id}', [AccountController::class, 'show_order']);
});
```
Both added to the existing bottom group in `routes/api.php`, not the top admin group.

## Risks / Trade-offs

- **Allowlist drift** → `Site\Account\OrderResource` copies the admin field set rather than inheriting it, so a field added to the admin `OrderResource` later (customer-safe or not) does not automatically reach the account response — silent omission instead of silent leakage. Deliberately the safer direction to drift in for a customer-facing endpoint; not solved structurally in this change.
- **`sort_by` whitelist reuse** → `OrderController::get()`'s column whitelist (`id`, `uuid`, `order_number`, `customer_id`, `sub_total`, `payment_provider`, `created_by`, `updated_by`, ...) includes admin-oriented columns like `created_by`/`updated_by`. These are column names, not data — sorting by them reveals nothing about other customers. Reused as-is rather than trimmed, to keep the two endpoints' filter/sort surface identical, as the proposal asks.
