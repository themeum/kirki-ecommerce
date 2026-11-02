## 1. Cart customer email (schema → API)

- [x] 1.1 Add `database/migrations/AlterCartsAddCustomerEmailColumn.php`: `up()` adds nullable `string('customer_email', 255)` after `user_id` with a comment, and `down()` drops it. Follow `AlterOrdersAddIsTaxInclusiveColumn`.
- [x] 1.2 Register the migration at the end of the `// Since v1.0.0-beta.1` group in `config/migrations.php`.
- [x] 1.3 Add `customer_email` to `Cart::$fillable`.
- [x] 1.4 Add `'customer_email' => 'email|nullable'` and `Sanitizer::EMAIL` to `CartUpdateRequest`.
- [x] 1.5 Return `customer_email` from `CartResource::to_array()`, next to `user_id` / `cart_token`.
- [x] 1.6 Confirm `CartService::partial_update` leaves an omitted `customer_email` untouched and clears it on explicit `null` / `''`. Annotate here if the premise is wrong. _Confirmed: the sanitizer only emits keys present in the request; `null` passes through and clears._
- [x] 1.7 Integration test in `tests/Integration/CartApiTest.php`. Cover:
  - a valid email round-trips through update → get
  - an invalid email returns a `customer_email` validation error
  - an omitted field keeps the stored value
- [x] 1.8 Add `customer_email` to `docs/ecommerce/carts/update-cart.yml` (request) and `get-cart.yml` (response example).
- [x] 1.9 Verify: `composer test:unit`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`. _Unit, phpcs and typecheck are green. `npm test` has 3 failures in `coupon-form.test.ts` that already fail at `HEAD` 87f6e0a8 (fixture `last_name: null` versus `CustomerInfoSchema`), so they're unrelated to this change._

## 2. Buyer-scoped order counts (one definition each)

- [x] 2.1 Check whether the framework query builder supports a nested `where(fn ($query) => ...)` group and `join`. If it doesn't, plan the fallbacks from design D3/D3b: a `where_raw` with bound parameters, and a `where_in` subquery. _Nested `where(Closure)` and `join` both exist. Joins aren't used anywhere in the app and would need table-prefixed column names, so `count_coupon_usages` uses `or_where_in('order_id', Order::query()->select('id')->where('customer_email', ...))`, the D3b fallback, which the model prefixes itself._
- [x] 2.2 Add `OrderService::count_prior_orders($customer_id, $email, $exclude_order_id = null)`:
  - Match on `customer_id = ? OR customer_email = ?`, adding each clause only when its value is non-empty.
  - Count only orders where `order_status NOT IN (FAILED_CANCELLED, REFUNDED)`.
  - Exclude `$exclude_order_id` when given.
  - Return `0` without querying when both identifiers are empty.
  - Full docblock with `@since 1.0.0`.
- [x] 2.3 Integration test covering (`tests/Integration/OrderBuyerCountsTest.php`):
  - matches by customer ID only
  - matches by email only
  - email case is ignored
  - cancelled and refunded orders are not counted
  - the excluded order is not counted
  - both identifiers empty returns `0`
- [x] 2.4 Add `OrderService::count_coupon_usages($coupon_id, $customer_id, $email, $exclude_order_id = null)` per design D3b:
  - Count `order_coupons` rows for the coupon with `usage_reversed_at IS NULL`.
  - Match on `order_coupons.customer_id = ? OR orders.customer_email = ?`, adding each clause only when its value is non-empty.
  - Exclude the given order.
  - Return `0` without querying when both identifiers are empty.
  - Full docblock with `@since 1.0.0`.
- [x] 2.5 Integration test covering (`tests/Integration/OrderBuyerCountsTest.php`):
  - matches by customer ID only
  - matches a guest's use by order email only
  - email case is ignored
  - reversed usage is not counted
  - another coupon's usage is not counted
  - the excluded order is not counted
- [x] 2.6 Verify: `composer test:unit`, `composer test:integration`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`. _Integration was run through `kirki-test` (Docker). `npm test` still has only the 3 failures already present at `HEAD`._

## 3. Calculation context and DiscountService

- [x] 3.1 In `CalculationContextDTO`:
  - remove `$customer_order_count`
  - add `$customer_email` (`string|null`) and `$order_id` (`int|null`) with `@var` docblocks
  - in `from_cart()`, set `customer_email` to the resolved buyer email (`CustomerService::resolve_buyer_email()`) and drop the order-count query
  - update the `from_cart()` docblock
- [x] 3.2 Inject `OrderService` into `DiscountService` through a documented constructor with a `protected` property. _A `CustomerService` dependency was added at first, then dropped when email resolution moved to the context builders (see design.md corrections)._
- [x] 3.3 Add `CustomerService::resolve_buyer_email($customer_id, $user_id, $entered_email)` _(first built on `DiscountService`, then moved here and called by every context builder; covered by `tests/Integration/CustomerBuyerEmailTest.php`)_:
  - Use the customer record's email (from `customer_id`) first, then the WordPress user's email (from `user_id`), then `$context->customer_email`.
  - Trim and lowercase the result; return `null` when empty.
- [x] 3.4 Add `DiscountService::ensure_buyer_identity($context)`. When the context has no customer ID and no `customer_email`, it throws a `ValidationException` with "Please enter your email address to use this coupon.".
- [x] 3.5 Rewrite the first-time-buyer branch of `validate_customers_eligibility()` as in design D5: call `ensure_buyer_identity()`, then `count_prior_orders(customer_id, email, order_id)`. No `user()` call.
- [x] 3.6 Rewrite the per-customer-limit branch of `validate_conditions()` as in design D5: call `ensure_buyer_identity()`, then `count_coupon_usages(coupon_id, customer_id, email, order_id)`. Replace the inline `order_coupons()` query and drop the `user()` call. Remove the `user` function import if nothing else in the file uses it. _The import was removed: `DiscountService` no longer calls `user()`._
- [x] 3.7 Update `tests/Unit/Services/DiscountServiceTest.php` and `tests/Unit/Actions/Cart/RecalculateCartActionTest.php` to build `DiscountService` with a mocked `OrderService`.
- [x] 3.8 Add unit tests for the first-time-buyer rule:
  - a guest with no email is rejected with the email message
  - a guest whose email has prior orders is rejected
  - a guest with a new email passes
  - the context's customer ID and email are passed through to the count _(the precedence check moved to `CustomerBuyerEmailTest`)_
  - `order_id` is passed through as the exclusion
- [x] 3.9 Add unit tests for the per-customer limit:
  - a guest with no email is rejected with the email message
  - a guest below the limit passes
  - a guest at the limit is rejected
  - `coupon_id`, the resolved email and `order_id` are passed through to `count_coupon_usages`
- [x] 3.10 Verify: `composer test:unit`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`. _416 unit tests pass and phpcs is clean. No TypeScript changed in this group._

## 4. Context builders (admin and checkout)

- [x] 4.1 `OrderCalculationController::prepare_context_dto()`:
  - set `customer_email` via `CustomerService::resolve_buyer_email()` (selected customer, then the request `customer_email`), with `CustomerService` injected into the controller
  - remove `customer_order_count` and the `get_order_count()` call
  - delete `get_order_count()`, which this change leaves unused
  - _The now-unused `OrderStatus` and `customer()` imports were removed. `FulfillmentStatus` was already unused before this change and is left alone._
- [x] 4.2 `CreateOrderAction::prepare_calculation_context_dto()`:
  - set `customer_email` via `CustomerService::resolve_buyer_email()` (resolved customer, then the payload's `customer_email`) _(no `billing_email` fallback: guests must send `customer_email`, and registered buyers are identified by their customer or account email)_
  - remove the `fulfillment_status`-based count
  - drop any import this leaves unused _(none: `FulfillmentStatus` is still used for new orders)_
- [x] 4.3 `UpdateOrderAction::prepare_calculation_context_dto()`: set `customer_email` via `CustomerService::resolve_buyer_email()` (the order's customer, then the payload's `customer_email`, with no billing fallback; `CustomerService` injected) and `order_id` to the edited order's ID.
- [x] 4.4 Grep `customer_order_count` across `app/`, `tests/` and `database/` and confirm nothing references it.
- [x] 4.5 Integration tests in `OrderApiTest`:
  - an admin creates a guest order with a new email plus a first-time coupon → the discount applies
  - an admin creates an order for a customer with a prior order → the coupon is dropped
  - a guest storefront checkout using an email that has a prior order → the coupon is dropped
  - editing the buyer's only order keeps the coupon
  - editing an order that used a once-per-customer coupon keeps the coupon
  - a guest checkout whose email already used a once-per-customer coupon → the coupon is dropped
- [x] 4.6 Integration tests in `CartApiTest`:
  - a guest cart with `customer_email` set can apply a first-time coupon and a per-customer-limited coupon
  - a guest cart without an email is rejected with the email message for both
- [x] 4.7 Verify: `composer test:unit`, `composer test:integration`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`. _416 unit and 596 integration tests pass (Docker). phpcs is clean on the changed files. `npm test` has only the 3 failures already present at `HEAD`._

## 5. Storefront checkout sync

- [x] 5.1 Add `customer_email?: string | null` to the `Cart` type in `resources/site/ts/types.ts`. _Also added to `config.checkout_cart`'s type, which is what `cartData` is actually typed by, and to `PageInlineScript::set_checkout_page_data()`. Without the latter, the initial checkout config never carried the email, so 5.6 could not pre-fill on reload._
- [x] 5.2 Add a helper in `checkout.ts` that reads the contact form's email and returns it only when valid. `placeOrder()` reuses it where it already reads the contact email. _`getValidContactEmail()` checks against `EMAIL_PATTERN`, which is now exported from `form.ts` so it can't drift from the field's own validation._
- [x] 5.3 `updateCart()` includes `customer_email` only when that helper returns a value.
- [x] 5.4 Trigger the debounced `updateCart` when the contact email changes. Use the `form()` helper's existing change hook or event, and check its API first. _`form()` exposes no change hook, so checkout listens for the native `input` event bubbling from `#contact-form`, and only calls `updateCart()` when `hasUnsyncedContactEmail()` is true._
- [x] 5.5 `applyCoupon()` awaits `updateCart()` first when the valid contact email differs from `cartData.customer_email`.
- [x] 5.6 On init, pre-fill the contact form from `cartData.customer_email` when the field is empty.
- [x] 5.7 Verify: `npm run typecheck && npm test` in `resources/site/`, then `npm run typecheck && npm test` in `resources/app/`. _`resources/site` typecheck is clean except the existing "Cannot find module 'vitest'" errors. `npm test` there can't run because `vitest` isn't installed in `resources/site/node_modules` (also true at `HEAD`). The `simple-import-sort` lint error in `checkout.ts` was already there too. `resources/app` has only its 3 existing failures._

## 6. Admin coupon form

- [x] 6.1 In `resources/app/features/coupons/pages/edit-coupon/tabs/targeting-tab.tsx`, render the "First time buyer only" checkbox for every `customer_include_eligibility` value.
- [x] 6.2 Add a payload test to `resources/app/features/coupons/tests/schemas/forms/coupon-form.test.ts` asserting that `customer_include_eligibility: 'guests'` with `first_time_buyer_only: true` produces `first_time_buyer_only: true` in the payload.
- [x] 6.3 Verify: `npm run typecheck && npm test` in `resources/app/`. _Typecheck and lint are clean. The new test passes. Only the 3 failures already present at `HEAD` remain._

## 7. Wrap-up

- [x] 7.1 Grep `DiscountService.php` for `user()` and confirm neither buyer-scoped rule reads the acting user. _The only call is `user($context->user_id)`, the cart owner set by `from_cart()`._
- [x] 7.2 Run `openspec validate guest-first-time-buyer-coupons --strict`.
- [x] 7.3 Verify: `composer test:unit`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`. _416 unit tests pass, phpcs is clean, and 137 cart/order integration tests pass after the final edits (the full 596-test integration run was green earlier). `resources/app` has only the 3 failures already present at `HEAD`._
