# Tasks

## 1. Checkout (DEF-020)

- [x] 1.1 In `app/Actions/Order/CreateOrderAction.php`, add `ValidationException::class, Response::UNPROCESSABLE_ENTITY` to the stock `throw_if()` (line 194) and the invalid shipping method `throw_if()` (line 176). Both classes are already imported.
- [x] 1.2 In the same file, change the "Cart not found." and "Cart is empty." checks (lines 336, 347) to the same 422 form. Keep both messages: `OrderApiTest` expects "Cart not found.".
- [x] 1.3 Update the `@throws` lines in the docblocks of the changed methods to name `ValidationException`.
- [x] 1.4 Add integration tests in `tests/Integration` (next to `CartApiTest` / `ConcurrencySafetyTest`): a checkout that passes the first stock check but fails the in-transaction check returns 422 with the stock message, leaves no order, and keeps `available_quantity` and `committed_quantity` unchanged for the loser. Simulate the race by changing stock between the two checks; do not use real parallel requests.
- [x] 1.5 Add tests for checkout with an empty cart and with an invalid shipping method: both return 422 and create no order.
- [x] 1.6 Verify: run `composer test:integration`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`.

## 2. Cart

- [x] 2.1 In `app/Actions/Cart/AddToCartAction.php` (lines 78, 81) and `app/Actions/Cart/UpdateCartItemAction.php` (lines 64, 67), add `ValidationException::class, Response::UNPROCESSABLE_ENTITY` to the stock and max-per-order checks. Add the imports if they are missing.
- [x] 2.2 In `app/Services/CartService.php`, change the "Cart item not found." and "Cart not found." checks (lines 322, 392, 396) to `NotFoundException::class, Response::NOT_FOUND`. Leave the existing 403 checks as they are. Also add `Response::NOT_FOUND` to every other `throw_if(..., NotFoundException::class)` that passes no status code (see design.md, Corrections during implementation): `CartController`, `UpdateCartAction`, `UpdateCartItemAction`, `DeleteRefundAction`, `UpdateRefundAction`, `OrderService`, `VariantService`, `WebhookController`.
- [x] 2.3 Update `@throws` docblock lines for the changed methods.
- [x] 2.4 Change the four `CartApiTest` cases that assert 500 for stock and limit failures to assert 422. Add integration tests in `CartApiTest`: update-item above stock returns 422; update-item above `max_per_order` returns 422; update or remove a missing item returns 404. Each asserts the message and that the cart is unchanged.
- [x] 2.5 Verify: run `composer test:integration`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`.

## 3. Other user-correctable failures

- [x] 3.1 Use `HttpException::class, Response::CONFLICT` for every 409 below. `HttpException` sets its status from the code, and `ApiExceptionHandler` already answers with that status.
- [x] 3.2 `app/Services/CouponService.php` (lines 387, 389): "already activated / deactivated" → 409. Before changing, check how the admin coupon activation call in `resources/app` handles the error, and confirm it only toasts `message`.
- [x] 3.3 `app/Services/CustomerService.php` (line 210): "Customer already exists" → 409. Check the callers in `CreateCustomerAction` and checkout customer provisioning, so a caller that catches this error still works.
- [x] 3.4 `app/Services/OnlinePaymentService.php` (line 68): "already installed" currently sends 404 through a plain `Exception`; change to 409.
- [x] 3.5 `app/Services/UserService.php` (lines 102, 104, 116): no change. `AccountController::resend_verification_email()` already answers every failure with 422 and the message, so the client result does not change. Add a test that proves this for the cool-down case.
- [x] 3.6 Update `@throws` docblock lines for the changed methods.
- [x] 3.7 Add one test per changed site that asserts the status and message (service-level where no route exists, API-level where one does).
- [x] 3.8 Verify: run `composer test`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`.

## 4. Guard test

- [x] 4.1 Add a unit test under `tests/Unit` that scans `app/Actions` and `app/Services` with `token_get_all()`, finds `throw_if`, `throw_unless` and `throw_anyway` calls, counts top-level arguments, and fails for any call with no exception class that is not in the allowlist. The failure message names the file and line.
- [x] 4.2 Fill the allowlist with the server-fault sites the scan finds after sections 1-3 (for example the `PersistsOrderTaxes` and `PersistsOrderCoupons` reconciliation checks). Give each entry a one-line reason. The scan covers `app/Actions`, `app/Services`, `app/Concerns` and `app/Http`. A call is also flagged when it names a class the API handler does not map (for example `NotFoundException`) and passes no status code.
- [x] 4.3 Prove the guard works: temporarily remove the class from one fixed call, confirm the test fails with the right file and line, then restore it.
- [x] 4.4 Verify: run `composer test:unit`, `composer phpcs:wporg`, then `npm run typecheck && npm test` in `resources/app/`.

## 5. Frontend: confirm the message is shown

- [x] 5.1 Add Vitest cases in `resources/site/ts/components/error-status.test.ts` (covers `cart`, `add-to-cart` and `checkout`, with status 422 and 500): a rejected request with `message` and no `errors` ends in `toastManager.error(message)`, and the button or form returns to its normal state.
- [x] 5.2 Add a test in `resources/app` for `libs/api.ts` and `toastMutationError`: a 422 body with `errors: null` gives a toast that holds the server message.
- [x] 5.3 Change frontend code only if a test shows a message is dropped. Record any such change in design.md as a "Correction during implementation" note. Result: no message is dropped, so no frontend code changed.
- [x] 5.4 Verify: run `npm run typecheck && npm test` in `resources/app/` and the Vitest suite in `resources/site/`.

## 6. Documentation

- [x] 6.1 Add `docs/error-status-codes.md`, structured like `docs/emails.md`: a table of contents, then numbered sections (quick start, status table, which exception class to use, how the frontends show errors, the guard test and its allowlist) and a "Where this differs from Laravel" section that is honest about the gaps (for example: no per-field `errors` for these failures, no global `abort()` helper).
- [x] 6.2 Verify: run `npm run typecheck && npm test` in `resources/app/`.
