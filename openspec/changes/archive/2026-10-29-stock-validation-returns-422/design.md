# Design

## Context

- `throw_if($cond, $message, $exception_class = Exception::class, ...$params)` builds `new $exception_class($message, ...$params)`. With no class, the exception code is 0.
- `ApiExceptionHandler::get_response()` maps `ValidationException` to 422, `HttpException` to its own status, `ModelNotFoundException` to 404. Anything else goes to `fallback_response()`, which uses the exception code as the status when it is 100-599, and 500 otherwise. So `Exception::class, Response::BAD_REQUEST` already gives 400, and no class gives 500. `SiteExceptionHandler` follows the same rule for non-REST pages.
- A `ValidationException` thrown with a message and a code has `errors = null`, so the body is `{"message": "...", "errors": null}`.
- Frontends do not branch on status. Storefront `api/client.ts` copies `message` and (when set) `errors` onto an `Error`; `checkout.ts`, `cart.ts` and `add-to-cart.ts` toast `message`. Admin `libs/api.ts` maps `errors` to `{}` when null and `toastMutationError` toasts `message`. A status change from 500 to 422 does not change what the user sees, except that the 500 path is no longer logged as a server error.
- Audit of `app/` (280 `throw_*` calls): most already pass a class. The calls with no class that a user can trigger are listed below.

## Goals / Non-Goals

**Goals:**
- Every user-correctable failure on a request path returns the right 4xx.
- Server faults stay 5xx and keep their log entry.
- A guard stops the same omission from returning.

**Non-Goals:**
- No new exception classes and no change to the framework package (`vendor/libraries/framework/` is generated; edits are lost).
- No change to the 400 responses from `Exception::class, Response::BAD_REQUEST` ("could not be updated/deleted"). They are correct enough and are not DEF-020.
- No new `errors` map for these failures; a message-only 422 is what the other stock checks do.
- No change to message text, except none are planned.

## Decisions

### 1. Classification of the call sites

| Site | Today | New |
|---|---|---|
| `CreateOrderAction` stock (194) | 500 | `ValidationException`, 422 |
| `CreateOrderAction` invalid shipping method (176) | 500 | 422 |
| `CreateOrderAction` cart missing or empty (336, 347) | 500 | 422 |
| `AddToCartAction` stock and limit (78, 81) | 500 | 422 |
| `UpdateCartItemAction` stock and limit (64, 67) | 500 | 422 |
| `CartService` item or cart not found (322, 392, 396) | 500 | `NotFoundException`, 404 |
| `CouponService` already activated / deactivated (387, 389) | 500 | `HttpException`-style 409 (see 2) |
| `CustomerService::create` customer exists (210) | 500 | 409 |
| `OnlinePaymentService::install` already installed (68) | `Exception` with code 404 | 409 |
| `UserService::resend_verification_email` (102, 104, 116) | 500 in the service | unchanged: its only caller, `AccountController::resend_verification_email()`, catches every `Exception` and answers 422 with the message |
| `throw_if(..., NotFoundException::class)` with no status code (cart, refund, order, variant, payment gateway) | 500 | `Response::NOT_FOUND`, 404 |
| `TaxStrategyFactory` country empty / no region / no strategy (38, 44, 48) | 500 | unchanged: its only caller, `Tax::get_tax_strategy()`, catches `Throwable` and returns null, so it never reaches HTTP |
| Reconciliation checks (`PersistsOrderTaxes`, `PersistsOrderCoupons`) | 500 | unchanged, server fault |
| `PayPal`, `ExchangeRatesApiProvider`, `CurrencyApiProvider`, `Currency`, `SettingsFactory`, `DecisionEngine`, `OrderStatus`, `Condition` | 500 | unchanged, server fault or programming error |
| `*Service` "could not be updated/deleted" with `Exception::class, 400` | 400 | unchanged |

Rationale: the rule is "can the person who sent the request fix it?" Yes → 4xx. No → 5xx.

### 2. Which exception class gives 409 and 429

Check `HttpException`, `ThrottleRequestsException` and `Response::CONFLICT` / `TOO_MANY_REQUESTS` (both constants exist) before choosing. Preferred order:
1. An existing framework exception that maps to the status (`ThrottleRequestsException` for 429, `NotFoundException` for 404).
2. `HttpException` with the status, since `get_response()` already serialises it to `{message, code}` with that status.
3. Only if neither fits: pass the status as the code with `Exception::class`, the same way `CategoryService` does with 400. This works because `fallback_response()` uses the code.

Alternative considered: use 422 for every case. Rejected because 404/409/429 let clients and monitoring tell "missing", "duplicate" and "slow down" apart, and the codebase already uses `AuthorizationException` (403) and `NotFoundException` (404) the same way.

### 3. Message text stays as it is

The stock message names the variant ID, not the product. That is a UX gap but not part of this change, and the existing `OrderCalculationContextService` check has the same text.

### 4. Guard test

A unit test reads the PHP files under `app/Actions` and `app/Services`, finds `throw_if(`, `throw_unless(` and `throw_anyway(` calls, and fails when a call passes fewer than three arguments and is not in an allowlist inside the test (file plus a short reason, e.g. `Currency.php` reconciliation).

- Parse with `token_get_all()` and count top-level commas inside the call parentheses, not with a regex, so nested `sprintf(__(...))` arguments do not confuse the count.
- Scope is limited to `Actions` and `Services` because those are the request layers. `Payment`, `Currency` providers, `Tax`, `Decisions` and `Constants` throw server-fault errors on purpose.

Alternative: a PHPCS sniff. Rejected because the project PHPCS rules are for WordPress.org standards, and a custom sniff adds a second place to maintain. A unit test with an allowlist is easier to read and review.

Trade-off: the allowlist needs a small edit when a real server-fault throw is added. That is the point; the author must say it is a server fault.

### 5. Frontend: verify, do not change

Add or confirm Vitest cases that a 422 with message and `errors: null` produces a toast in `cart.ts`, `add-to-cart.ts` and `checkout.ts` (storefront), and in `toastMutationError` (admin). Change code only if a test shows a message is dropped. One thing to check: `checkout.ts` `handleApiErrors` shows the message when `errors` is missing, but would show only the fallback "Checkout failed" if the client ever sent `errors: {}`. Storefront `client.ts` does not do that today, so no change is planned.

## Risks / Trade-offs

- [A client or monitor treats 500 as retryable and now sees 422] → Intended. Note it in the docs section.
- [Changing a status for "already activated" coupons breaks an admin UI that expects another code] → Search `resources/app` for the coupon activation call and check how it handles errors before changing; the admin only toasts `message`.
- [Wrong classification of a site as user-correctable] → Table above is reviewed in the proposal; reconciliation and gateway errors are explicitly kept at 500.
- [Guard test false positives] → Allowlist with a reason per entry.
- [Race test is flaky] → Do not use real parallel requests in PHPUnit. Simulate the lost race by letting the first stock check pass and making the in-transaction check fail (stub or reduce stock between the two checks), as `ConcurrencySafetyTest` can show.

## Migration Plan

No data or schema change. Ship with the code. Rollback is a revert.

## Corrections during implementation

- **`NotFoundException::class` alone gives 500.** The audit looked for calls with no class. Calls that name `NotFoundException::class` but no status code were missed. The framework maps only `ValidationException`, `HttpException` and `ModelNotFoundException`; `NotFoundException` extends plain `Exception` and has code 0, so these return 500 as well. Found 13 sites (`CartController`, `UpdateCartAction`, `UpdateCartItemAction`, `DeleteRefundAction`, `UpdateRefundAction`, `OrderService`, `VariantService`, `WebhookController`). All now pass `Response::NOT_FOUND`. The guard test (section 4) must therefore also require a status code for any class other than `ValidationException`, `HttpException` and `ModelNotFoundException`.
- **The verification-email errors are already 422.** `AccountController::resend_verification_email()` catches every `Exception` from `UserService` and returns 422 with the message. Changing the service's exception classes would not change what the client sees, and a 429 would need a controller change as well. The three sites are left as they are, and the 429 scenario is removed from the spec.
