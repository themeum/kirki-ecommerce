# Proposal

## Why

Order, coupon and variant money columns have no comments, so a reader cannot tell the currency, the unit, or whether a value includes tax. The tax rules differ by column (for example `order_items.subtotal` is always net, `order_items.total` depends on `orders.is_tax_inclusive`), and the names do not show this.

Also, the base-currency payment provider fee is converted back with the float `1 / exchange_rate`. This is off by one minor unit at exact half-cent values (rate `2.896`, fee `256115` gives `88437`; exact division gives `88438`).

## What Changes

- Add `->comment()` text to the money columns in the existing `Create*Table` migrations (no new migration). Scope: `orders`, `order_items`, `order_taxes`, `order_coupons`, `order_item_coupons`, `variants`, `coupons`. Refunds are out of scope.
- Each comment states the currency (`invoiced_*` or `base_*`), that the value is in minor units, and the tax treatment where it applies.
- Change the invoiced-to-base fee conversion to exact decimal division by the order's stored rate, rounded half-up to the base currency's minor unit.
- Add the exact-conversion rule to the payment-provider fee requirement.

## Capabilities

### New Capabilities
- `money-column-comments`: Every stored money column carries a comment that states currency, unit and tax treatment.

### Modified Capabilities
- `order-payment-provider`: The base fee derivation must be exact, not float-approximated.

## Impact

- `database/migrations/` (seven table files, comments only; no schema change).
- `app/Managers/OrderManager.php` (`convert_fee_to_base_currency`).
- `tests/Integration/OrderApiTest.php` (fee tests).
- Existing installs do not get the comments. `Create*` migrations do not re-run, and the schema-upgrade alter migrations are not used for this. New installs get them. This is accepted.
