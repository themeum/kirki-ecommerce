## 1. Test groundwork

- [x] 1.1 Add a shared test helper (trait under `tests/Support/`) with small builders for a tracked variant with a given available/committed quantity, a coupon with a limit, and a paid delivered order, reusing `CreatesTestProducts`, `SeedsTestCurrency` and `SeedsTestShipping`
- [x] 1.2 Write the failing stale-read tests first (design D8.1) for: reserve oversell, direct decrement oversell, coupon limit, refund over-refund, double cancel. Run them and confirm each one fails on the current code
- [x] 1.3 Verify: `composer test:unit`, `composer test:integration` (new tests fail for the right reason, old tests pass), then `cd resources/app && npm run typecheck && npm test` shows no regression (done: 10 of 14 new tests fail on old code, 4 rule-set tests pass; baseline has 1 older failure, `OnboardingApiTest` expects `owner@example.com`; frontend 1455 tests pass). Task 1.1 shipped as `tests/Support/Racing/*` doubles plus helpers inside `ConcurrencySafetyTest`, not a shared trait

## 2. Atomic stock (inventory-stock-atomicity)

- [x] 2.1 Add `VariantService` methods for the guarded reserve (available >= q, moves available and committed in one `UPDATE`), the back-order reserve (same without the condition), the guarded available decrement, the clamped release (`LEAST`, `available_quantity` assigned before `committed_quantity`) and the clamped confirm; each returns the affected-rows result as `bool`; docblocks per the PHP standard
- [x] 2.2 Change `InventoryService::reserve_stock()` and `decrement_stock()` to choose the method from `track_inventory` / `allow_back_order`, keep the early PHP check as a fast path, and throw the existing `ValidationException` messages when 0 rows change; run `record_stock_level_crossing()` only after a successful change
- [x] 2.3 Change `InventoryService::release_reserved_stock()` and `confirm_reserved_stock()` to use the clamped methods and stop computing `min()` from a value read earlier
- [x] 2.4 Update existing unit and integration tests and mocks that depend on the old call sequence (`AddToCartActionTest`, `InventoryAlertEmailsTest`, `VariantApiTest`, `MailJobsTest`); none needed a change, all passed unchanged
- [x] 2.5 Add tests for every scenario in `specs/inventory-stock-atomicity/spec.md`: last unit, stale read, failed reserve changes nothing, back order, untracked, direct decrement, release over-ask, two releases, confirm over-ask, no alert on failure; include a test that pins the `SET` order of the release statement
- [x] 2.6 Verify: `composer test`, `composer phpcs:wporg`, `composer phpcs`, then `cd resources/app && npm run typecheck && npm test`

## 3. Atomic coupon usage (coupon-usage-limit-atomicity)

- [x] 3.1 Add a `CouponService` method for the guarded increment (`WHERE id = ? AND (has_usage_limit = 0 OR current_usage_count < usage_limit)`) and make the usage decrement clamp at zero (`GREATEST`)
- [x] 3.2 Change `PersistsOrderCoupons::sync_order_coupons()` to use the guarded increment and throw "Coupon usage limit reached." when 0 rows change; after the increment, re-count the customer's uses for a coupon with a per-customer limit and throw the existing per-customer error when over
- [x] 3.3 Keep `DiscountService::validate_conditions()` as the early friendly check; confirm both create and update order paths use the new increment
- [x] 3.4 Add tests for every scenario in `specs/coupon-usage-limit-atomicity/spec.md`: last use with a stale count, losing order fully rolled back, no-limit coupon, per-customer double submit, reversal never below zero
- [x] 3.5 Verify: `composer test`, `composer phpcs:wporg`, `composer phpcs`, then `cd resources/app && npm run typecheck && npm test`

## 4. Atomic order state and edits (order-state-transition-atomicity)

- [x] 4.1 Add an `OrderService` helper that locks one order row (`SELECT id FROM <orders> WHERE id = %d FOR UPDATE` through `DB::select`) and works inside an open transaction
- [x] 4.2 Change `OrderService::apply_order_action()` to update with `WHERE id = ? AND order_status = <expected>` and return `false` when 0 rows change; check that `OrderManager::mark_as_cancel()` and `mark_payment_as_paid()` skip all side effects (stock, coupons, events, activity log) on `false`
- [x] 4.3 Change `UpdateOrderAction::execute()` to lock the order row right after `begin_transaction()` and reload the order with its items before `sync_order_items()`
- [x] 4.4 Add tests for every scenario in `specs/order-state-transition-atomicity/spec.md`: double cancel releases stock and coupon once, paid race confirms stock at most once, transition from a state already left, racing cancel leaves other orders' committed stock alone, stale-items edit reserves only the real difference
- [x] 4.5 Verify: `composer test`, `composer phpcs:wporg`, `composer phpcs`, then `cd resources/app && npm run typecheck && npm test`

## 5. Atomic refunds (refund-amount-atomicity)

- [x] 5.1 Change `CreateRefundAction::execute()` to start the transaction first, lock the order row, reload the order with its refunds, and only then run the status check and the refundable calculation
- [x] 5.2 Add tests for every scenario in `specs/refund-amount-atomicity/spec.md`: second full refund fails, two partial refunds that fit, two that do not fit, gateway failure leaves no refund (use the existing payment provider fakes)
- [x] 5.3 Verify: `composer test`, `composer phpcs:wporg`, `composer phpcs`, then `cd resources/app && npm run typecheck && npm test`

## 6. Invoice number hardening (order-state-transition-atomicity)

- [x] 6.1 Change `OrderNumberGenerator::increment_last_invoice_number()` to seed and increment the counter with one atomic upsert, and make the yearly reset a conditional update keyed on the stored reset year
- [x] 6.2 Add tests for the invoice scenarios: first order with no counter row, sequential uniqueness, first orders after a year change, rollback leaves no gap
- [x] 6.3 Verify: `composer test`, `composer phpcs:wporg`, `composer phpcs`, then `cd resources/app && npm run typecheck && npm test`

## 7. Real concurrency check and docs

- [x] 7.1 (extended: also covers edit, checkout, invoice_first and invoice_year, and found a deadlock in the first invoice change, see design.md) Write a manual stress script (parallel PHP processes against the Docker MySQL setup) that hits reserve, coupon use, refund and cancel on the same rows and asserts the invariants: stock >= 0, usage <= limit, refunded <= total, release once. Run it before and after the fix and record both results in design.md
- [x] 7.2 Add `docs/concurrency.md` in the `docs/emails.md` layout: table of contents, numbered sections, quick start first, then the guarded operations, errors returned, and the section "Where this differs from WooCommerce" (stock reservation model, back orders, first-time-buyer coupon gap, SKU and slug unique-index behaviour)
- [x] 7.3 If implementation shows any premise in design.md was wrong, add a "Correction during implementation" note to design.md
- [x] 7.4 Final verify: `composer test`, `composer phpcs:wporg`, `composer phpcs`, `openspec validate fix-concurrency-race-conditions --strict`, then `cd resources/app && npm run typecheck && npm test`
