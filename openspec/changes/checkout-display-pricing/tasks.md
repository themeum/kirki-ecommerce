## 1. Calculation layer: carry shipping tax breakdown through

- [x] 1.1 Add `public $shipping_tax_breakdown = [];` to `app/DTO/Calculation/CalculationResultDTO.php` (array of `TaxItemResultDTO`, same style as the existing `coupon_results` property)
- [x] 1.2 In `app/Actions/Cart/RecalculateCartAction.php::execute()`, after `$shipping_tax_result = $tax_strategy->calculate_shipping_tax(...)`, assign `$result->shipping_tax_breakdown = $shipping_tax_result->breakdown;` — no other logic in that method changes
- [x] 1.3 Verify: `./kirki-test integration` passes (existing cart/coupon integration tests unaffected by an additive DTO property) — 256/256 pass

## 2. Shared helper for per-item product-coupon discount

- [x] 2.1 In `app/Resources/Concerns/FormatsCouponResults.php`, add a protected helper (e.g. `get_product_coupon_discount_for_item($coupon_results, $variant_id)`) that sums `item_discounts[$variant_id]` across `coupon_results` entries where `coupon->discount_target === DiscountTarget::PRODUCTS`
- [x] 2.2 Add a second helper (e.g. `get_applied_product_coupons_for_item($coupon_results, $variant_id, $base_currency_code, $display_currency)`) that returns the `applied_product_coupons` array for one item: one entry per `discount_target === PRODUCTS` coupon whose `item_discounts[$variant_id]` is set and > 0, shaped as `{ code, title, discount_value_type, discount_amount_percentage, base_discount_amount_fixed, display_discount_amount_money_object }`
- [x] 2.3 Add a helper that aggregates a `TaxItemResultDTO[]` (or array of such arrays, for multi-item aggregation) into the `tax_breakdown` output shape: array of `{ name, rate, display_amount_money_object }`, summed by `name`

## 3. CartResource: per-item display pricing

- [x] 3.1 In `app/Resources/Cart/CartResource.php::prepare_items()`, compute `product_coupon_discount` for the item via the new helper (2.1), using `$result->coupon_results`
- [x] 3.2 Add `display_line_price_money_object` = `Money::prepare_amount_object_from_minor($calculated_item->base_subtotal - product_coupon_discount, ...)`
- [x] 3.3 Add `display_strikethrough_price_money_object` (nullable): `base_subtotal` if `product_coupon_discount > 0`; else `base_product_total` if `base_subtotal < base_product_total`; else `null`
- [x] 3.4 Add `applied_product_coupons` via the helper from 2.2
- [x] 3.5 Verify: manually trace the six pricing scenarios from `specs/cart-pricing-display/spec.md` (no sale/no coupon, sale only, sale+product coupon, product coupon only, order-coupon-only, stacked item coupons) against the formula and confirm each matches its scenario — traced algebraically, all six hold (see also the integration tests added in group 3a below)

## 4. CartResource: cart-level totals and tax breakdown

- [x] 4.1 In `app/Resources/Cart/CartResource.php::to_array()`, add `pricing.display_total_after_discount_money_object` = `base_subtotal - (base_discount_total - base_shipping_discount)`
- [x] 4.2 Add `pricing.tax_breakdown` by aggregating every item's `calculated_item->tax_breakdown` via the helper from 2.3
- [x] 4.3 Add `pricing.shipping_tax_breakdown` by formatting `$result->shipping_tax_breakdown` (from task 1.2) via the same helper
- [x] 4.4 Verify: with a free-shipping coupon plus a product coupon applied in a test cart, confirm `display_total_after_discount + shipping + tax` still equals `display_total` (the existing grand total) exactly — proved algebraically: `base_discount_total - base_shipping_discount` cancels the shipping-discount term exactly, and confirmed with an integration test

## 3a. Tests: per-item pricing and cart totals (added during implementation, per user request for thorough edge-case coverage)

- [x] 3a.1 Unit tests for the three new `FormatsCouponResults` helpers (`get_product_coupon_discount_for_item`, `get_applied_product_coupons_for_item`, `format_tax_breakdown`) in `tests/Unit/Resources/FormatsCouponResultsTest.php`, covering: product-only summation, order-coupon exclusion, multiple stacked product coupons, zero-discount exclusion, zero-amount tax-line exclusion, multi-name tax aggregation, empty inputs — 15/15 pass
- [x] 3a.2 Integration tests in `tests/Integration/CartApiTest.php` covering the six spec scenarios end-to-end via the real `/cart` and `/cart/coupon` endpoints: no sale/no coupon, sale only, sale + product coupon, product coupon without sale, order-coupon-only (item unaffected), stacked item-scoped coupons
- [x] 3a.3 Integration test for `display_total_after_discount` staying correct when a free-shipping coupon is combined with an amount-off coupon, and that the grand total still reconciles exactly

## 5. OrderCalculationResource: mirror the same additions

- [x] 5.1 Apply the same per-item changes (3.1-3.4) to `app/Resources/Order/OrderCalculationResource.php::prepare_items()`
- [x] 5.2 Apply the same cart-level changes (4.1-4.3) to `OrderCalculationResource::to_array()` (plus a correction: `OrderCalculationController::prepare_items()` was not populating `base_product_total`, needed for the strikethrough formula - see design.md's "Correction during implementation")
- [x] 5.3 Verify: `./kirki-test integration` passes — no dedicated `OrderCalculationController` test file exists in this repo yet, so this is covered by the full suite passing (no regression) plus the shared per-item/tax logic being unit-tested directly; a follow-up could add an `OrderCalculationApiTest.php` but that's a pre-existing gap, not introduced by this change

## 6. Final verification

- [x] 6.1 Ran `composer test:unit` (188/188 pass) and `./kirki-test integration` (256/256 pass) — no local WP test lib, so the two suites were run via their respective working commands rather than one combined `composer test`; no regressions
- [x] 6.2 Confirmed no `base_*` twin was added for any new field (display-only, per design.md) — verified by grep across both resources
- [x] 6.3 Confirmed existing fields are unchanged in value and shape — every pre-existing CartApiTest/CouponApiTest/OrderApiTest assertion on `base_discount_total`, `base_tax_total`, `base_shipping_tax`, etc. still passes unmodified
