# Tasks

## 1. Stored tax destination (spec: an edit takes the tax destination from the order)

- [x] 1.1 Make `RecalculateCartAction::resolve_tax_strategy` and `resolve_tax_destination` use `$context->stored->tax_destination` when set, with the live setting as fallback. Verify with `RecalculateCartActionTest` cases: setting changed to billing while the order stored shipping, and an order with no stored value.
- [x] 1.2 Check that `RecalculateCartAction` is the only reader of the live destination for an edit (`grep get_tax_destination app`). Verify the grep shows no other edit path.
- [x] 1.3 Run `composer test:unit`, `composer phpcs:wporg`, `composer phpcs:docblocks`, then `npm run typecheck && npm test` in `resources/app/`. All pass.

## 2. Preview checks what the save checks (spec: an edit preview refuses what the save refuses)

- [x] 2.1 Add `currency_code` to `OrderCalculationInputDTO` and pass it in `UpdateOrderPayloadDTO::to_calculation_input`. Verify the DTO test reads it from the payload.
- [x] 2.2 Add `validate_edit` to `OrderCalculationContextService` (currency check, then shipping-method check when the charge is quoted again), inject `ShippingService` in the constructor (the controller takes the context service as a `get()` argument, not in its constructor), call it from `OrderCalculationController::get` for an edit and from `UpdateOrderAction::execute`; remove the two duplicated `throw_if` lines from the action. Verify with `OrderEditApiTest` cases: preview with another currency gives 422, preview with an unserved method gives 422, preview with same address and a removed method succeeds, and the save still gives the same 422s.
- [x] 2.3 Add `OrderCalculationContextServiceTest` cases for `validate_edit` (another currency, same currency, unavailable method quoted again, stored charge kept). Verify `composer test:unit` passes.
- [x] 2.4 Run `composer test:unit`, `composer test:integration`, `composer phpcs:wporg`, `composer phpcs:docblocks`, then `npm run typecheck && npm test` in `resources/app/`. All pass.

## 3. Coupons (specs: case-insensitive keep, fixed product coupon fallback, coupon pass order)

- [x] 3.1 Compare coupon codes without regard to case in `StoredOrderTermsService::get_kept_coupons` and in the `array_diff` of `RecalculateCartAction::get_discount_result`. Verify with a test: stored `SPRING10`, sent `spring10`, coupon expired; the coupon stays with stored terms and the use count does not change.
- [x] 3.2 In `PersistsOrderCoupons::sync_order_coupons`, keep a null `base_max_discount_amount` null for a kept fixed product coupon; in `DiscountService::make_stored_coupon`, do not use the order total for a product coupon. Verify with a `DiscountServiceTest` case: two lines stored at 3.00 and 4.00 give 3.00 and 4.00, and the column is not written as 7.00 after an edit.
- [x] 3.3 Change `OrderSeeder` to write the coupon's fixed amount (per line for a product coupon, in total for an order-wide coupon) in `base_max_discount_amount`. Verify by reseeding in a test database and reading a fixed product coupon row, or with a seeder unit test if one exists. (checked with `php -l` and the SeedCatalog values: KICKS50 5000, KIDS10 1000; a reseed would overwrite dev data, so it was not run)
- [x] 3.4 Add a `DiscountServiceTest` case for the new product coupon on a stored 10% order-wide coupon (100.00 subtotal: 20.00 and 8.00).
- [x] 3.5 Run `composer test:unit`, `composer test:integration`, `composer phpcs:wporg`, `composer phpcs:docblocks`, then `npm run typecheck && npm test` in `resources/app/`. All pass.

## 4. Stock failure gives 422 (spec: a stock shortage in the save gives a 422 error)

- [x] 4.1 Pass `ValidationException::class` and `Response::UNPROCESSABLE_ENTITY` to the stock `throw_if` in `UpdateOrderAction::add_order_item` and `update_order_item`. Verify with a test that forces `has_stock` to fail in the save's own step: the response is 422 and the order, stock and coupons are unchanged.
- [x] 4.2 Run `composer test:integration`, `composer phpcs:wporg`, `composer phpcs:docblocks`, then `npm run typecheck && npm test` in `resources/app/`. All pass.

## 5. Docs (`docs/order-editing.md`)

- [x] 5.1 Section 6: replace the "never shrinks" text with the pass order (product coupons, order-wide coupons, free shipping; stored before new inside a pass) and add the 100.00 example (20.00 product coupon makes the stored 10% coupon give 8.00, total 28.00). Add a line that a code matches without regard to case.
- [x] 5.2 Section 7: say that the tax destination comes from the order, also when tax is calculated again. Add the limit: when tax follows billing, billing moves and the shipping charge is kept, shipping tax uses the current shipping method.
- [x] 5.3 Sections 9, 10 and 11: say that the preview refuses a different `currency_code` and an unavailable shipping method (422); remove the 500 row and the 500 sentence; replace "exactly the same way" with the exact list of shared checks. Add the "fixed coupon on an old row" limit to section 6 or 11 if still true after 3.2.
- [x] 5.4 Verify every statement in sections 6, 7, 9, 10 and 11 against the tests of groups 1 to 4, and run `npm run typecheck && npm test` in `resources/app/`.

## Workflow follow-up

- The user runs `/opsx:apply` for this change.
- Archive the change after review, then sync the delta into `openspec/specs/order-editing/spec.md`.
