## Why

The admin order payload shows each item's line subtotal and its line strikethrough ("was") price, but not the price of a single unit. The merchant order-detail view needs a per-unit price and a per-unit strikethrough price, with the same tax and currency variants the line figures already have.

## What Changes

- Each item in the admin order payload (`app/Resources/Order/OrderResource.php`) gets 8 new money-object keys:
  - `invoiced_unit_price_exclusive_money_object`, `invoiced_unit_price_inclusive_money_object`
  - `base_unit_price_exclusive_money_object`, `base_unit_price_inclusive_money_object`
  - `invoiced_unit_strikethrough_price_exclusive_money_object`, `invoiced_unit_strikethrough_price_inclusive_money_object`
  - `base_unit_strikethrough_price_exclusive_money_object`, `base_unit_strikethrough_price_inclusive_money_object`
- Each unit figure is the matching line figure the item already exposes divided by the item's quantity and rounded up to the currency's minor unit. The unit price is net of the item's product-coupon discount, the same as the line subtotal.
- A unit strikethrough price is null exactly when the matching line strikethrough price is null.
- Existing keys are unchanged. This change only adds keys; nothing is removed or renamed.
- The storefront order resource (`app/Resources/Site/Order/OrderResource.php`) is out of scope.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `admin-order-pricing-breakdown`: each order item also exposes a per-unit price and a per-unit strikethrough price, both tax-exclusive and tax-inclusive, in both the invoiced and base currency, derived from the item's line figures.

## Impact

- **Code:** `app/Resources/Order/OrderResource.php` only (`prepare_items()` and a small helper to divide an amount by quantity).
- **API:** additive fields on each item in the admin order-detail response. Existing consumers are unaffected.
- **Data:** no migration, model, DTO or calculation changes. Existing orders get the new fields automatically, because the fields are derived from data already stored.
- **Accepted tradeoff:** because the unit figure is rounded up, unit × quantity can exceed the line figure by up to `quantity − 1` minor units. The line subtotal remains the authoritative amount.
