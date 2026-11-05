# Proposal

## Why

DEF-020: when two shoppers buy the last units at the same time, the losing checkout returns HTTP 500 instead of 422. `CreateOrderAction` calls `throw_if()` without an exception class, so the framework throws a plain `Exception` (code 0) and the REST handler falls back to 500. Stock is not oversold, but the shopper sees a server-failure response for a problem they can fix.

The same mistake exists in other places. An audit of `app/` found about 20 `throw_if()`/`throw_anyway()` calls for user-correctable failures (stock, per-order limits, empty cart, invalid shipping method, duplicate records) with no exception class. Each one returns 500, which also logs the failure as a server error and hides the real cause from monitoring.

## What Changes

- Make user-correctable failures throw `ValidationException` with `Response::UNPROCESSABLE_ENTITY` (422), as `OrderCalculationContextService` and `UpdateOrderAction` already do:
  - `CreateOrderAction`: not enough stock (DEF-020), invalid shipping method, empty cart.
  - `AddToCartAction` and `UpdateCartItemAction`: not enough stock, max-per-order limit.
  - Other cases found by the audit (see design.md for the full classified list).
- Use the matching status where 422 is not right: 404 for "not found" cases, 409 for "already exists / already installed" cases. This includes the "not found" throws that name `NotFoundException` but pass no status code; they return 500 today because the framework does not map that class.
- Leave genuine server faults at 500: payment gateway and exchange-rate API failures, reconciliation mismatches, missing settings keys, programming errors.
- Add integration tests that assert the status code and message for every changed call site.
- Add one guard test that fails when a new `throw_if()`/`throw_anyway()` in `app/Actions` or `app/Services` omits the exception class, unless it is on an explicit allowlist of server-fault sites. This stops the bug from coming back.
- No frontend code change is expected. The storefront (`resources/site/ts/api/client.ts`, `checkout.ts`, `cart.ts`, `add-to-cart.ts`) and admin (`resources/app/libs/api.ts`, `toastMutationError`) read `message` from the error body and show a toast, and neither branches on status. The tasks include checking this so no message is silently dropped.
- Add a short section to `docs/` on error status conventions, with a "Where this differs from Laravel" part, per the project documentation rule.

## Capabilities

### New Capabilities
- `user-facing-error-status`: failures a shopper or admin can correct return the right 4xx status with a readable message, server faults stay 5xx, and both frontends show the message.

### Modified Capabilities
- `inventory-stock-atomicity`: the request that loses a stock race fails with a 422 validation error, not a 500.

## Impact

- PHP: `app/Actions/Order/CreateOrderAction.php`, `app/Actions/Cart/AddToCartAction.php`, `app/Actions/Cart/UpdateCartItemAction.php`, `app/Services/CartService.php`, `app/Services/CouponService.php`, `app/Services/CustomerService.php`, `app/Services/UserService.php`, `app/Services/OnlinePaymentService.php`.
- Tests: new cases in `tests/Integration` (cart, checkout, concurrency) and one new unit guard test.
- API: status codes change from 500 to 422/404/409/429 for the listed cases. Clients that retry on 5xx will stop retrying these, which is the intended result. Response bodies keep the same `message`.
- Frontend: none expected; verified by existing and added Vitest tests.
