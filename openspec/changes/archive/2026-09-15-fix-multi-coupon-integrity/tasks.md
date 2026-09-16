## 1. Coupon usage-count and reversal sync

- [x] 1.1 In `PersistsOrderCoupons::sync_order_coupons()`, read the order's existing `order_coupons` (keyed by `coupon_id`) before calling `delete_order_coupons()`.
- [x] 1.2 After rebuilding the new coupon set, diff old vs. new `coupon_id`s: carry forward `usage_reversed_at` for coupons present in both; for newly-added coupons, increment `current_usage_count` (or mark `usage_reversed_at = now()` without incrementing, if the order's current status is cancelled/refunded); for removed coupons, decrement `current_usage_count` unless the old row was already reversed.
- [x] 1.3 Remove `CreateOrderAction`'s separate `increment('current_usage_count')` loop after `sync_order_coupons()` — creation is now just the "everything is added" case of the same diff.
- [x] 1.4 Add/update `Integration` tests for order creation and edit covering: editing an order to add a coupon, editing an order to remove a coupon, editing an order with no coupon changes (counts untouched), and editing an already-cancelled order (usage stays reversed, count not incremented). **Course correction**: written as `OrderApiTest` integration tests (real HTTP + DB), not `Unit` — the sync logic reads/writes real `order_coupons`/`coupons` rows and there's no existing unit-level harness for it; the existing multi-coupon creation/cancellation tests in the same file are also integration tests.
- [x] 1.5 Ran `bash kirki-test integration --filter OrderApiTest` and `phpcs --standard=phpcs-wporg.xml.dist` on changed files — all pass.

## 2. Reconciliation hardening

- [x] 2.1 Add an invoiced-currency sum check to `assert_order_coupons_reconcile()`. **Course correction**: implemented as a bounded-tolerance check (`abs(diff) <= count($order_coupons)`), not exact equality. Each order-coupon's `invoiced_discount_amount` is converted independently, so summing several already-rounded amounts can legitimately land a few minor units away from converting the pre-summed base total in one shot — asserting exact equality would throw on legitimate multi-coupon, non-1:1-rate orders. See design.md's Decisions section for the full reasoning. Corresponding spec scenario updated from "equals exactly" to "within tolerance."
- [x] 2.2 Replace `sync_order_coupons()`'s silent `continue` when a variant isn't in `$order_items_by_variant_id` with a `throw_if`, matching the fail-loud pattern already used for tax reconciliation.
- [x] 2.3 Add tests: a multi-coupon order in a foreign currency reconciles within tolerance (`test_multi_coupon_order_reconciles_invoiced_totals_within_tolerance_in_foreign_currency`); a coupon result referencing an unmatched variant throws (`test_sync_order_coupons_throws_when_item_discount_references_unmatched_variant`, via reflection on `sync_order_coupons()` with a hand-built `CalculationResultDTO`, since this state isn't reachable through the public API — the calculation engine and both order actions are variant-keyed throughout, so a coupon result can't reference a variant absent from the order in normal operation).
- [x] 2.4 Ran `bash kirki-test integration --filter OrderApiTest` and phpcs — all pass.

## 3. Dead eager-load fix

- [x] 3.1 In `OrderService.php`, changed both `Order::with(...)` call sites from `coupons.item_attributions` to `order_coupons.order_item_coupons` (relation name fix combined with the 5.1 rename).
- [x] 3.2 **Course correction**: skipped the query-count assertion as originally scoped — this codebase has no query-counting test infrastructure (no `DB::listen`/query-counter helper anywhere in `tests/`), and building one just for this would be disproportionate to the fix. Verified correctness instead: the full `OrderApiTest` suite (including `test_checkout_with_multiple_coupons_persists_order_coupons_and_item_attributions`, which asserts on `order_coupons`/`order_item_coupons` data) passes, confirming the eager-load path resolves correctly end-to-end.
- [x] 3.3 Ran `bash kirki-test integration --filter OrderApiTest` and phpcs — all pass.

## 4. CartResource money object

- [x] 4.1 Added `display_discount_amount_fixed_money_object` to `format_coupon_results()` and `get_applied_product_coupons_for_item()`, guarded with `!empty($coupon->base_discount_amount_fixed)` (percentage-type coupons have no fixed amount — an earlier unguarded version broke `CartApiTest`'s coupon-apply tests with a 500; fixed and re-verified).
- [x] 4.2 Updated `tests/Unit/Resources/CartResourceCouponFormattingTest.php` with an assertion for the new money object.
- [x] 4.3 Ran `bash bin/phpunit --testsuite Unit --filter CartResource` (15/15 pass) and phpcs (clean).

## 5. Minor cleanup

- [x] 5.1 Renamed `OrderCoupon::item_attributions()` to `order_item_coupons()`; updated all call sites (`OrderService`, `OrderResource`, `CreateOrderAction`, `UpdateOrderAction`, `CreateRefundAction`, `UpdateRefundAction`, `PerformOrderAction`, `DeleteRefundAction`). The API response key `item_attributions` in `OrderResource` is unchanged (public contract) — only the internal relation accessor was renamed.
- [x] 5.2 **Course correction, not removed**: investigated callers first as the task required — `ApplyCouponAction` calls `validate_coupon()` without `$already_applied_coupon_codes`, so it doesn't benefit from `calculate()`'s in-memory `$has_free_shipping_applied` guard and genuinely needs the DB lookup in `validate_against_other_applied_coupons()`. Removing it would silently break that single-coupon-apply path's free-shipping-conflict detection. Left as-is; noted here rather than force a change that trades a real regression for saving one query in the batch path.
- [x] 5.3 Changed the three `esc_html__()` calls in `DiscountService` to `__()` per `throw_if(...)`, matching the file's dominant convention (mid-session correction: also converted the surrounding `if { throw new ValidationException(...) }` blocks to `throw_if()`/`throw_anyway()` calls, matching this codebase's established exception-raising convention rather than leaving raw `throw new` statements).
- [x] 5.4 In `OrderService`'s order-detail queries (`find_order`, `find_order_by_uuid`), eager-load `items.taxes` and `shipping_taxes` alongside the existing `items`/`refunds`/`order_coupons.order_item_coupons`.
- [x] 5.5 Ran `bash kirki-test integration --filter OrderApiTest`, `bash bin/phpunit --testsuite Unit --filter DiscountService`, and phpcs — all pass.

## 6. Docs

- [x] 6.1 Updated `docs/ecommerce/carts/remove-coupon.yml`'s request body (top-level and both examples) to include `code`; also updated its response shape to match current `CartResource` output (was already stale beyond just the request body).
- [x] 6.2 Updated `docs/ecommerce/carts/apply-coupon.yml`, `get-cart.yml`, and `update-cart.yml` example responses to the current shape (`coupons`, `display_items_subtotal_money_object`, `display_order_discount_money_object`, `display_order_total_money_object`, `display_shipping_amount_money_object`, `tax_lines`, `display_discount_amount_fixed_money_object`; dropped `discount_details`, `tax_rate`, `tax_breakdown`, `display_shipping_subtotal*`, and the flattened `available_shipping_methods`/`product` fields that no longer exist).

## 7. Fix stale design.md in the pending multi-coupon-stacking change

- [x] 7.1 Corrected `openspec/changes/multi-coupon-stacking/design.md`'s Risks section to describe `clamp_item_discounts()`'s actual first-come-first-served behavior instead of the never-built proportional-scaling description.

## 8. Final verification

- [x] 8.1 Ran the full backend suite: `bash bin/phpunit --testsuite Unit --testdox` (259/259 pass) and `bash kirki-test integration` (367/367 pass, includes `CartApiTest` and `OrderApiTest`). `phpcs --standard=phpcs-wporg.xml.dist` clean on every changed file (one unrelated pre-existing finding noted in `OrderApiTest.php:187`, outside this change's diff).
- [x] 8.2 Ran `npm run typecheck` (clean) and `npm test` (111/111 files, 848/848 tests) from `resources/app/` — confirmed via grep that nothing in `resources/app/` references `item_attributions`/`order_item_coupons`/`display_discount_amount_fixed_money_object`, so the admin app is unaffected by the rename or the new field.
- [x] 8.3 Re-read `proposal.md`'s Impact list against the final diff — matches, with one addition not originally listed: `app/DTO/Order/CreateOrderCouponDTO.php` (new `usage_reversed_at` property, needed to carry it through `OrderService::create_order_coupon()`).
