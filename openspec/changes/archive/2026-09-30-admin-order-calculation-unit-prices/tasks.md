## 1. Split the strikethrough minor amounts out of the formatting

- [x] 1.1 In `app/Resources/Order/OrderCalculationResource.php`, extract the amount logic of `prepare_strikethrough_price()` into a new protected `get_strikethrough_amounts($calculated_item, $product_coupon_discount, $subtotal_exclusive)` returning `['exclusive' => int|null, 'inclusive' => int|null]` in minor units. Give it a full docblock (`@since 1.0.0`, matching `OrderResource`).
- [x] 1.2 Make `prepare_strikethrough_price()` call `get_strikethrough_amounts()` and format non-null amounts with `Money::prepare_amount_object_from_minor()`. Keep its signature and return shape unchanged.
- [x] 1.3 Verify: `composer test:unit` passes, including the existing `test_strikethrough_*` cases in `tests/Unit/Resources/OrderCalculationResourceCouponFormattingTest.php`. Run `npm run typecheck && npm test` from `resources/app/`.

## 2. Add the per-unit keys

- [x] 2.1 Add a protected `prepare_unit_amount_object($line_amount, $quantity)`: null for a null amount, otherwise `intdiv($line_amount + $quantity - 1, $quantity)` with quantity clamped to at least 1, returned as a base-currency `MoneyDTO`. Full docblock.
- [x] 2.2 In `prepare_items()`, call `get_strikethrough_amounts()` alongside the existing `prepare_strikethrough_price()` call.
- [x] 2.3 Add `base_unit_price_exclusive_money_object` and `base_unit_price_inclusive_money_object`, derived from the line subtotal exclusive and inclusive minor amounts and `$item->quantity`.
- [x] 2.4 Add `base_unit_strikethrough_price_exclusive_money_object` and `base_unit_strikethrough_price_inclusive_money_object`, derived from the strikethrough amounts; null when the line figure is null.
- [x] 2.5 Verify: `composer phpcs:wporg` passes for the file, then `composer test:unit`, then `npm run typecheck && npm test` from `resources/app/`.

## 3. Tests

- [x] 3.1 In `OrderCalculationResourceCouponFormattingTest`, add a test for a unit price that divides evenly (qty 2, exclusive 70.00, inclusive 77.00 → 35.00 and 38.50).
- [x] 3.2 Add a test for a unit price that doesn't divide evenly (qty 3, 10.00 → 3.34, rounded up).
- [x] 3.3 Add a test that the unit price is net of a product-scoped coupon (pre-coupon 80.00, −10.00, qty 2 → 35.00).
- [x] 3.4 Add a test that the unit strikethrough price for an on-sale item is the regular-price total ÷ qty.
- [x] 3.5 Add a test that both unit-strikethrough keys are null when the line strikethrough is null.
- [x] 3.6 Verify: `composer test:unit` passes, and `npm run typecheck && npm test` from `resources/app/`.
