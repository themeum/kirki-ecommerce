## Context

See proposal.md - Why. Current state relevant to the approach:

- `routes/api.php` has one large admin group and one `/account` group, both using the framework's `AuthMiddleware` (`is_user_logged_in()` only; logged-out → `401`).
- The framework (`vendor/libraries/framework/src/Middlewares/AdminMiddleware.php`) already ships `AdminMiddleware`: passes when `is_user_logged_in() && current_user_can('manage_options')`, otherwise throws `AuthorizationException` with `403` - for logged-out callers too. No route uses it today.
- Route middleware runs inside the WordPress REST `permission_callback` (`Route::compute_permission_result()`), in declaration order, so a rejection happens before request validation and before the controller runs.
- Every admin menu (`app/Menu/*`) already requires `manage_options`, so the admin SPA is only ever loaded for those users.
- The only API consumers in the repo are the admin SPA (`resources/app/`) and the storefront bundle (`resources/site/`). The storefront calls only cart, checkout, `/shop/products` and `/account/*`.
- `POST /orders` (`OrderController::store`) and `POST /checkout` (`CheckoutController::store`) share `OrderCreateRequest`, whose `authorize()` lets a non-admin create a non-manual order for themselves. The storefront only uses `/checkout`; the non-admin branch of `POST /orders` is exercised only by integration tests.
- Integration tests (`tests/Integration/*ApiTest.php`) assert `401` for logged-out calls to several admin endpoints (coupons, tax profiles, shipping boxes/profiles, attribute values, …), and ~13 order tests (`OrderApiTest`, `OrderActivityApiTest`) place orders as a `subscriber` via `POST /orders`.

## Goals / Non-Goals

**Goals:**
- Close the admin API to everyone without `manage_options`, in the smallest reviewable diff, without editing the framework.
- Keep the admin API gate, the admin menu gate and in-endpoint admin checks on the same capability.
- Keep `401` (not logged in) and `403` (logged in, not allowed) distinct.
- Remove debug endpoints that leak data or mutate settings.

**Non-Goals:**
- Per-resource capabilities, custom roles (shop manager), capability registry, or exposing capabilities to the SPA - follow-up change.
- Removing `OrderCreateRequest::authorize()` - it still guards `/checkout`.
- Hardening the public cart/checkout endpoints (rate limiting etc.).
- Changing the mock `/online-payments/download/{id}` route - temporary until the live cloud download URL replaces it.

## Decisions

### Chain `AuthMiddleware` then `AdminMiddleware` on the existing admin group

Change the admin `Route::group` middleware from `AuthMiddleware::class` to `[AuthMiddleware::class, AdminMiddleware::class]`. `AuthMiddleware` rejects logged-out callers with `401`; `AdminMiddleware` then rejects logged-in callers without `manage_options` with `403`. Every current and future route inside the group is covered by default.

- *Alternative: `AdminMiddleware` alone* - rejected. It returns `403` for logged-out callers too, which is wrong REST semantics (`401` means "authenticate", `403` means "you can't") and would break every existing "unauthenticated returns 401" test for no benefit.
- *Alternative: an app-level middleware checking `UserRoles::ADMIN` (`administrator` role)* - rejected. Checking a role rather than a capability breaks on multisite and with role editors, and would diverge from the menus' `manage_options`. The follow-up moves to capabilities anyway; `manage_options` is the closest existing capability to "store administrator".
- *Alternative: per-controller `authorize()` calls* - rejected; 60+ call sites, and a forgotten call silently leaves an endpoint open. The group gate is deny-by-default.

### `POST /orders` becomes admin-only; shoppers place orders through `/checkout`

`POST /orders` is the admin "create order" endpoint and moves with the rest of the group. Shoppers already have `POST /checkout`, which uses the same `OrderCreateRequest` and `CreateOrderAction` and additionally attaches the cart token and the shopper's customer. Integration tests that place an order as a non-admin through `POST /orders` are moved to `POST /checkout`; they were testing shopper behaviour through the wrong endpoint. If a moved test asserts behaviour that `/checkout` does not reproduce, record it here as a correction rather than keeping a shopper path on the admin endpoint.

**Correction during implementation:** "`/checkout` uses the same request and action, so the tests just switch endpoint" was only half true. For a signed-in shopper, `CreateOrderAction::resolve_checkout_cart()` replaces the request's `items` and `coupon_codes` with the shopper's cart (`POST /orders` never set `user_id`, so it skipped this), and the cart validates a coupon when it is applied (`ApplyCouponAction`). The moved tests were therefore split by intent:

- Provisioning, address, contact-snapshot, activity and stock-failure tests go through the real flow: `POST cart/items`, then `POST checkout`. The stock-failure test can no longer ask for more than is in stock (the cart refuses it), so it adds one unit and then sets the variant's stock to 0 before checkout - still failing after the customer is provisioned.
- The four checkout-time coupon tests (first-time-buyer and per-customer-limit) call `CreateOrderAction` directly with the shopper as `created_by`, the same way the file's existing multi-coupon checkout tests do. Through the cart, the coupons they expect checkout to drop silently would be rejected at apply time instead, and the tests would stop covering the checkout-time logic.

### Leave `/account/*` on `AuthMiddleware`

Customer self-service is correctly "any logged-in user"; controllers already scope by `user()->get_id()` / `customer()->get_customer_id()`. Restricting it to the `kirki_customer` role would lock out administrators testing their own storefront account and is not needed for this fix.

### Delete `/test`, `/test-public` and `TestController` rather than gating them

`/test` mutates `general.industry` on every call and `/test-public` returns a query log to anonymous visitors. There is no production use; gating them would keep dead, risky code around. Imports that become unused (`TestController`, `Post`, `Request`, `DB`, `response`) are removed with them - check each is otherwise unused in `routes/api.php` before removing.

### Keep the mock download route public

`OnlinePaymentService` builds the add-on zip URL with `Route::url('online-payments/download/' . $id)` and the server downloads it without the user's cookie, so any auth gate would break add-on install. It is temporary - replaced by the live cloud download URL - so it is left as is. Its `[^/]+` route param pattern already stops `../` traversal out of `payments/`.

### One admin gate: drop duplicate checks, align the shared ones

`OrderUpdateRequest::authorize()`, `OrderActionRequest::authorize()` and the manual-order check in `OrderController::store()` only run on admin-only routes, where the route gate has already required `manage_options`. They are removed, leaving the gate as the single check. They were also wrong: they test the `administrator` role, so a custom role granted `manage_options` (or a multisite super admin) passed the gate and was then rejected.

`OrderCreateRequest::authorize()` and the manual-order check in `CheckoutController` also serve the public `/checkout`, where they stop a shopper ordering for another customer or flagging a manual order - they stay. They call `is_admin()`, which changes to `user_can($this->get_id(), Capabilities::MANAGE_OPTIONS)` so "admin" means the same thing as the gate everywhere. `BrandPolicy` also calls it, but is registered and never invoked.

- *Alternative: keep all checks and only change `is_admin()`* - rejected; it leaves three checks that repeat the gate and must be kept in sync with it.
- *Alternative: switch call sites to `user()->can(...)`* - rejected; the framework's `User::can()` checks `current_user_can()`, the logged-in user, not the `User` instance it is called on.
- `get_active_role()` still returns the `administrator` role constant for such users; it has no callers outside `User`.

**Correction during implementation:** a `FormRequest` whose `authorize()` returns false is reported as `401`, not `403` - the framework's `Request::authorize_request()` throws `AuthorizationException` without a status code, which defaults to `401`. So a shopper sending `is_manual` to `/checkout` gets `401`. The spec scenario asserts "rejected, no order created" rather than a status; changing the framework's status is out of scope.

### Coupon customer eligibility knows the cart owner

`DiscountService::validate_customers_eligibility()` decides "registered" by `$context->customer_id` alone. A signed-in shopper has no customer record until their first checkout provisions one, so at cart time they count as a guest: "registered customers only" coupons ask them to log in, and guest-only coupons are accepted. `CalculationContextDTO::from_cart()` already reads `$cart->user_id`; it now also stores it as `$context->user_id`, and the rule becomes `!empty($context->customer_id) || !empty($context->user_id)`.

- *Alternative: fall back to `user()->get_id()` like the customer-limit and first-time-buyer checks do* - rejected; for an admin-created manual order the current user is the admin, which would make every guest manual order count as registered. The context's own owner is the right source.
- Checkout needs no change: a signed-in shopper's customer is resolved before coupon validation, so `customer_id` is already set there. The existing `user()->get_id()` fallbacks in the customer-limit and first-time-buyer checks are left alone (out of scope).

## Risks / Trade-offs

- [Non-`manage_options` users who currently rely on the admin API (e.g. an Editor using an Application Password in an integration) start receiving `403`] → Intended; this is the security fix. Called out as **BREAKING** in the proposal and restored properly by per-resource capabilities.
- [An admin endpoint that the storefront secretly depends on would break for customers] → Mitigated by the consumer audit above; the only storefront reference to an admin route (`customerApi.updateCustomer` → `PUT /customers/{id}`) is never imported. Verification re-runs the cart/checkout/account integration tests.
- [Moving shopper order tests from `/orders` to `/checkout` changes what they exercise (cart token, customer attachment)] → That is the real shopper path, so the tests become more accurate; any divergence is logged as a correction here.
- [`manage_options` is coarser than "store staff"] → Accepted until the capabilities change; today nobody without `manage_options` can open the admin app anyway.

## Migration Plan

No data migration. Deploy is the route file change. Rollback is reverting the middleware line in `routes/api.php`.
