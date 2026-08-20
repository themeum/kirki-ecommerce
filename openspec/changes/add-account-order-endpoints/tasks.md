## 1. Service layer

- [x] 1.1 Add `OrderService::find_order_for_customer_or_fail($id, $customer_id)` in `app/Services/OrderService.php`, returning the order only when `customer_id` matches, else throwing the same `NotFoundException` as `find_order_or_fail()`.

## 2. Response resource

- [x] 2.1 Create `app/Resources/Site/Account/OrderResource.php` as a standalone resource extending `Framework\Resource` directly, with its own explicit `to_array()` (the admin field set minus `admin_notes`/`flags`, plus `payment_next_step`) rather than inheriting from `Site\Order\OrderResource` — see design.md's "Correction during implementation" note.

## 3. Controller

- [x] 3.1 Add `AccountController::orders(Request $request, OrderService $service)`: resolve `Customer` via `CustomerService::find_by_user_id(user()->get_id())`; if none exists, return an empty paginated `OrderListResource` response without calling the service; otherwise build `OrderListFilterDTO::from_array($request->all())` (with the same `sort_by` whitelist as `Api\OrderController::get()`), force `customer_id` to the resolved customer's id, and return `OrderListResource::paginated(...)`.
- [x] 3.2 Add `AccountController::show_order(Request $request, OrderService $service)`: resolve `Customer` via `CustomerService::find_by_user_id(user()->get_id())` (may be `null`), call `OrderService::find_order_for_customer_or_fail($request->int('id'), $customer->id ?? null)`, and return `Resources\Site\Account\OrderResource::make($order)`.

## 4. Routes

- [x] 4.1 In `routes/api.php`, add `Route::get('/account/orders', [AccountController::class, 'orders']);` and `Route::get('/account/orders/{id}', [AccountController::class, 'show_order']);` inside the existing bottom `AuthMiddleware` group alongside `/account/profile`, `/account/password-change`, `/account/addresses`.

## 5. Tests

- [x] 5.1 Add `tests/Integration/AccountOrderApiTest.php` (following `tests/Integration/OrderApiTest.php`'s `RestTestCase`/`create_customer`/`provision_customer_for_user` conventions), covering: a customer sees only their own orders in `GET /account/orders`; a `customer_id` query param is ignored; existing filters (status/date/search) still narrow within the customer's own orders; `GET /account/orders/{id}` returns the order for its owner; the same id returns not-found for a different logged-in customer; a nonexistent id returns not-found; a logged-in user with no `Customer` record gets an empty list from `GET /account/orders` and not-found from `GET /account/orders/{id}`; both endpoints return 401 when unauthenticated; the details response omits `admin_notes`/`flags` and includes `payment_next_step`.
- [x] 5.2 Run `composer test:integration` (or `composer test:docker:integration` if the local DB isn't running) and confirm the new tests pass alongside the existing suite, including `tests/Integration/OrderApiTest.php`.
