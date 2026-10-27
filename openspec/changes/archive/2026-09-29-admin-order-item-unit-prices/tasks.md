## 1. Split the strikethrough minor amounts out of the formatting

- [x] 1.1 In `app/Resources/Order/OrderResource.php`, extract the amount logic of `prepare_strikethrough_price()` into a new protected method `get_strikethrough_amounts()`. It takes the same parameters minus `$currency_code` and returns `['exclusive' => int|null, 'inclusive' => int|null]` in minor units. Give it a full docblock with `@since` set to the next release version.
- [x] 1.2 Make `prepare_strikethrough_price()` call `get_strikethrough_amounts()` and format the non-null amounts with `Money::prepare_amount_object_from_minor()`. Keep its signature and return shape unchanged.
- [x] 1.3 Verify: `composer test:unit` passes, including the existing `test_strikethrough_*` cases in `tests/Unit/Resources/AdminOrderResourceCouponFormattingTest.php`. Run `npm run typecheck && npm test` from `resources/app/`.

## 2. Add the per-unit keys

- [x] 2.1 Add a protected helper, e.g. `prepare_unit_amount_object($amount, $quantity, $currency_code)`. It returns null for a null amount; otherwise it ceiling-divides the amount by `max(1, $quantity)` using `intdiv($amount + $quantity - 1, $quantity)` and returns the `MoneyDTO`. Give it a full docblock.
- [x] 2.2 In `prepare_items()`, compute the invoiced and base strikethrough amounts once via `get_strikethrough_amounts()`. Use them for the existing line strikethrough keys, so `prepare_strikethrough_price()` is no longer called twice per item. _Deviation: the line keys still come from `prepare_strikethrough_price()`, and `get_strikethrough_amounts()` is called separately for the unit keys. Routing the line keys through the raw amounts would leave `prepare_strikethrough_price()` used only by tests, or would change its signature, which contradicts 1.2. Both paths run the same deterministic logic, so the line and unit figures still agree. See design.md "Correction during implementation"._
- [x] 2.3 Add the 4 unit-price keys (`{invoiced|base}_unit_price_{exclusive|inclusive}_money_object`), derived from the item's line subtotal exclusive and inclusive minor amounts.
- [x] 2.4 Add the 4 unit-strikethrough keys (`{invoiced|base}_unit_strikethrough_price_{exclusive|inclusive}_money_object`), derived from the strikethrough amounts; they are null when the line figure is null.
- [x] 2.5 Verify: `composer phpcs:wporg` passes for the file, then `composer test:unit`, then `npm run typecheck && npm test` from `resources/app/`.

## 3. Tests

- [x] 3.1 In `AdminOrderResourceCouponFormattingTest`, add a test for a unit price that divides evenly (qty 2, exclusive 70.00, inclusive 77.00 → 35.00 and 38.50).
- [x] 3.2 Add a test for a unit price that doesn't divide evenly (qty 3, 10.00 → 3.34, rounded up).
- [x] 3.3 Add a test that the unit price is net of a product-scoped coupon (pre-coupon 80.00, −10.00, qty 2 → 35.00).
- [x] 3.4 Add a test that the unit strikethrough price for an on-sale item is the regular-price total ÷ qty.
- [x] 3.5 Add a test that all four unit-strikethrough keys are null when the line strikethrough is null.
- [x] 3.6 Add a test that the invoiced and base unit figures are derived from their own currency's line figures when the order currency differs from the base currency.
- [x] 3.7 Verify: `composer test:unit` passes, and `npm run typecheck && npm test` from `resources/app/`.
