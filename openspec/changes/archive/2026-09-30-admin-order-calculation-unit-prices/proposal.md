## Why

The admin order-detail payload (`OrderResource`) now exposes a per-unit price and a per-unit strikethrough price for each item, but the manual order create/recalculate payload (`OrderCalculationResource`) does not. The order creation screen therefore can't show the same per-unit figures the merchant sees once the order exists.

## What Changes

- Each item in the manual order calculation payload (`app/Resources/Order/OrderCalculationResource.php`) gets 4 new base-currency money-object keys:
  - `base_unit_price_exclusive_money_object`, `base_unit_price_inclusive_money_object`
  - `base_unit_strikethrough_price_exclusive_money_object`, `base_unit_strikethrough_price_inclusive_money_object`
- Each unit figure is the matching line figure the item already exposes, divided by the item's quantity and rounded up to the currency's minor unit, the same rule `OrderResource` uses. The unit price is net of the item's product-coupon discount, the same as the line subtotal.
- A unit strikethrough price is null exactly when the matching line strikethrough price is null.
- No invoiced/display-currency variants: this payload is base-currency only.
- Existing keys are unchanged. This change only adds keys.
- The helpers are copied into `OrderCalculationResource` rather than shared with `OrderResource`. Extracting a shared trait is deliberately left for a later change.
- The frontend order creation screen is out of scope; it doesn't read any `unit_*` keys yet.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `admin-order-calculation-breakdown`: each calculated line item also exposes a per-unit price and a per-unit strikethrough price, both tax-exclusive and tax-inclusive, in the base currency, derived from the item's line figures.

## Impact

- **Code:** `app/Resources/Order/OrderCalculationResource.php` only (`prepare_items()`, splitting the strikethrough amounts out of `prepare_strikethrough_price()`, and a small per-unit helper). Tests in `tests/Unit/Resources/OrderCalculationResourceCouponFormattingTest.php`.
- **API:** additive fields on each item in the order calculation response. Existing consumers are unaffected.
- **Data:** no migration, model, DTO or calculation changes.
- **Accepted tradeoff:** because the unit figure is rounded up, unit × quantity can exceed the line figure by up to `quantity − 1` minor units. The line subtotal remains the authoritative amount.
- **Accepted tradeoff:** the per-unit and inclusive-amount helpers now exist in both order resources.
