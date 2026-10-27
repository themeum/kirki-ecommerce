## 1. Gate the admin API

- [x] 1.1 In `routes/api.php`, change the admin group's `'middleware' => AuthMiddleware::class` to `'middleware' => [AuthMiddleware::class, AdminMiddleware::class]` and import `Kirki\Ecommerce\Framework\Middlewares\AdminMiddleware`. Leave the `/account` group, the public cart/checkout/shop routes, the webhook routes and the mock `/online-payments/download/{id}` route unchanged.
- [x] 1.2 Remove the `/test` route (admin group) and the `/test-public` closure route, then remove imports in `routes/api.php` that are now unused (`TestController`, `Post`, `Request`, `DB`, `response`) - grep each one first and keep it if anything else in the file still uses it.
- [x] 1.3 Delete `app/Http/Controllers/Api/TestController.php` after confirming nothing else references it (`grep -rn TestController app routes tests`).
- [x] 1.4 Verify: `npm run typecheck && npm test` (from `resources/app/`) pass, and `php -l routes/api.php` reports no syntax errors.

## 2. Move shopper order tests to the checkout endpoint

- [x] 2.1 In `tests/Integration/OrderApiTest.php`, find every test that calls `POST orders` while the current user is a non-admin (`create_shopper_user()` / `subscriber`) and switch it to `POST checkout`. Also switch any follow-up call such a test makes to an admin endpoint as that shopper (e.g. `GET orders/{id}`) to either the admin user or the matching `/account/*` endpoint, keeping the test's intent.
- [x] 2.2 Do the same in `tests/Integration/OrderActivityApiTest.php` (`test_customer_can_view_own_order_activities`, `test_customer_cannot_view_other_customers_order_activities`).
- [x] 2.3 Search the rest of `tests/Integration/` for admin-group endpoints called while logged in as a non-admin or `wp_set_current_user()` to a non-admin user; fix any found the same way. If any moved test asserts behaviour `/checkout` does not reproduce, add a "Correction during implementation" note to `design.md` instead of reintroducing a shopper path on `POST /orders`.
- [x] 2.4 Verify: `npm run typecheck && npm test` (from `resources/app/`) pass, and `composer test:integration` (or `composer test:docker:integration`) passes for `OrderApiTest`, `OrderActivityApiTest`, `CartApiTest`, `AddressApiTest` and `AddressFieldRulesApiTest`.

## 3. Cover the access rules with tests

- [x] 3.1 Add `tests/Integration/AdminApiAccessTest.php` (extending `RestTestCase`) with a data provider of representative admin endpoints - at least `GET orders`, `GET customers`, `PUT settings`, `POST orders`, `POST orders/{id}/refunds`, `POST online-payments/install`, `POST products`, `GET app-config` - asserting `403` for a logged-in `subscriber`, `403` for a logged-in `kirki_customer`, and `401` when logged out. *(Changed during implementation: `kirki_customer` is never registered as a role and plugin-created customers get `subscriber` (`CreateCustomerAction`), so the second forbidden case uses `editor` - a staff role with many capabilities but no `manage_options` - instead.)*
- [x] 3.2 In the same test, assert that an administrator gets a non-`401`/`403` response on `GET orders` and `GET customers`.
- [x] 3.3 Assert customer-facing access is unchanged: a logged-in `subscriber` gets success on `GET account/orders` and `GET account/addresses`; a logged-out visitor gets `401` on `GET account/addresses` and success on `GET cart` and `GET shop/products`.
- [x] 3.4 Assert `GET test` and `GET test-public` return `404` (no route) for both an administrator and a logged-out visitor.
- [x] 3.5 Verify: `npm run typecheck && npm test` (from `resources/app/`) pass, and the full `composer test` (Unit + Integration) passes - in particular the existing "unauthenticated request returns 401" tests still pass unchanged.

## 4. One admin gate: drop duplicate checks, align the shared ones

- [x] 4.1 Remove the `authorize()` overrides from `OrderUpdateRequest` and `OrderActionRequest` - their routes are admin-only, so the route gate already enforces `manage_options` (the framework default `authorize()` returns `true`). Remove the `customer` function import from each file only if nothing else in it uses it.
- [x] 4.2 In `OrderController::store()` (admin-only), set `$dto->is_manual = $request->bool('is_manual');` and drop "Only administrators can flag the order as manual." from its docblock - the route gate already guarantees an admin.
- [x] 4.3 In `app/Wordpress/User.php`, change `is_admin()` to return `user_can($this->get_id(), Capabilities::MANAGE_OPTIONS)` (framework `Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities`) and update its docblock; drop the `UserRoles` import only if nothing else in the file still uses it. This keeps the checks shared with public `/checkout` (`OrderCreateRequest::authorize()`, `CheckoutController` manual flag) on the gate's capability.
- [x] 4.4 In `tests/Integration/OrderApiTest.php`, add tests for an `editor` granted `manage_options`: `POST orders` with the default (manual) payload returns `201` with `is_manual` true; `PUT orders/{id}` on an existing order is not rejected with `403`. Add a test that a signed-in `subscriber` with a cart item sending `POST checkout` with `is_manual` true is rejected with `403` (pins the checkout-side check). *(Changed during implementation: it is rejected with `401`, not `403` - the framework reports a failed `FormRequest::authorize()` as `401`; the test also asserts no order is created. See design.md.)*
- [x] 4.5 Add a test that `(new User($id))->is_admin()` is false for an `administrator` whose `manage_options` was removed and true for an `editor` granted it. *(An administrator gets `manage_options` from their role, so the test denies it per user with `add_cap('manage_options', false)` - `remove_cap()` only removes a user-level grant.)*
- [x] 4.6 Verify: `npm run typecheck && npm test` (from `resources/app/`) pass, and `bash kirki-test integration` passes.

## 5. Coupon eligibility for signed-in shoppers without a customer record

- [x] 5.1 In `app/DTO/Calculation/CalculationContextDTO.php`, add a documented `public $user_id;` and set it in `from_cart()` from `$cart->user_id` (null when the cart has no owner).
- [x] 5.2 In `DiscountService::validate_customers_eligibility()`, compute `$is_registered_customer` as `!empty($context->customer_id) || !empty($context->user_id)`. Leave the customer-limit and first-time-buyer checks unchanged.
- [x] 5.3 In `tests/Integration/CartApiTest.php`, add tests for a signed-in `subscriber` with no customer record and an item in the cart: a `CustomerIncludeEligibility::CUSTOMERS` coupon applies via `POST cart/coupon`; a `CustomerIncludeEligibility::GUESTS` coupon is rejected; a `CustomerExcludeEligibility::CUSTOMERS` coupon is rejected. Add one for a logged-out visitor: the `CUSTOMERS`-only coupon is rejected with "Please login to use this coupon.". Confirm the first test fails without 5.2.
- [x] 5.4 Verify: `npm run typecheck && npm test` (from `resources/app/`) pass, and `bash kirki-test integration` passes.

## 6. Cleanup

- [x] 6.1 Delete `test_checkout_reuses_existing_customer_without_duplicating` from `OrderApiTest` - after group 2 it duplicates `test_checkout_reuses_existing_customer`.
- [x] 6.2 Delete `resources/site/ts/api/customer.ts` and remove `ENDPOINTS.customer` from `resources/site/ts/api/endpoints.ts` (confirm no other references), then run `npm run typecheck && npm run lint && npm test` in `resources/site/`. *(Run: the storefront bundle's typecheck (2 `vitest` type errors in test files) and lint (31 problems, incl. a missing trailing comma in `endpoints.ts` after `wishlist`) fail identically before and after this change, and `npm test` cannot run because `vitest` is not installed in `resources/site/node_modules` - all pre-existing, none from the removed files.)*
- [x] 6.3 Remove the unused `use Kirki\Ecommerce\App\Models\Order;` from `tests/Integration/OrderActivityApiTest.php`.
- [x] 6.4 Verify: `npm run typecheck && npm test` (from `resources/app/`) pass, and the full `bash kirki-test all` passes.
