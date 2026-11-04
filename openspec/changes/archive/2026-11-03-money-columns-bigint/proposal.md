# Proposal

## Why

Every stored money amount is a 32-bit `INT`. Its maximum is 2,147,483,647 minor units. For a two-decimal currency such as IDR, that is about 21.4 million IDR, or about US$1,300 per amount. WordPress removes strict SQL mode, so MySQL does not reject a bigger value. It clips the value to the maximum and reports no error. The real amount is lost for good, and an order, invoice or refund shows a wrong total.

The plugin is still in alpha and has no stable release. The `squash-migrations-into-create-tables` change already says that alpha installs must reinstall. This is the last cheap time to fix the column type. After release, the same fix needs an alter migration on live order tables.

## What Changes

- Change every money column from `INT` to `BIGINT` in the `Create*Table` migration files. This covers 49 columns in 8 tables:
  - `orders` (14): all `invoiced_*` and `base_*` subtotal, shipping, discount, tax, shipping-tax, total and payment-provider-fee columns.
  - `order_items` (22): all price, regular price, catalog price, discount, discount-tax, tax, subtotal and total columns, in both currencies.
  - `order_taxes` (2): `invoiced_amount`, `base_amount`.
  - `order_coupons` (3): `base_max_discount_amount`, `invoiced_discount_amount`, `base_discount_amount`.
  - `order_item_coupons` (2): `invoiced_discount_amount`, `base_discount_amount`.
  - `refunds` (1): `invoiced_amount`.
  - `coupons` (2): `base_discount_amount_fixed`, `spend_condition_value`.
  - `variants` (3): `base_price`, `base_sale_price`, `base_cost_of_goods`.
- Keep the column name, default and nullability of each column. The type changes, and so does the comment of the 9 columns that break the existing `money-column-comments` spec:
  - `order_items`: the 4 `*_catalog_*_price` columns and the 2 `*_catalog_product_coupon_discounted_subtotal` columns have no "minor units". The 2 `*_discount_tax_total` columns have no "minor units" either.
  - `refunds.invoiced_amount` says "cents". That is wrong for currencies with 0 or 3 decimals. It becomes "minor units".
  - Only the unit words are added or changed. No other comment text changes.
- Also change `coupons.reward_value` to `BIGINT` as a precaution. It is reserved for buy-x-get-y, which is not built yet, and it may hold a reward amount. It is not one of the 49 money columns and has no unit comment yet.
- Do not change quantity, stock, count, limit, ordering or percentage columns. They stay `INT`.
- Add an integration test that fails if a money column is not `BIGINT` or its comment does not say "minor units", and a test that stores and reads back an amount above 2^31.
- Update the schema notes in `docs/order-data-and-calculations.md` if they state the column type.
- **BREAKING**: an existing alpha install cannot upgrade. This matches the policy in `schema-upgrade-migrations`, so no alter migration is written.

Out of scope, to follow later: `TIMESTAMP` to `DATETIME` in UTC, and unique indexes on `uuid`, `order_number` and `invoice_number`.

## Capabilities

### New Capabilities
- `money-column-storage`: Every stored money amount uses a 64-bit integer column, so no supported currency and amount is clipped by the database.

### Modified Capabilities

None. The 9 comment fixes bring the schema in line with the existing `money-column-comments` requirements. Those requirements do not change.

## Impact

- `database/migrations/`: eight `Create*Table.php` files (orders, order items, order taxes, order coupons, order item coupons, refunds, coupons, variants).
- `tests/Integration/`: a new schema test and an amount-round-trip test.
- `docs/order-data-and-calculations.md`: a note on the column type, if needed.
- PHP code and the React app: no change is expected. PHP integers are 64-bit, and the model casts are `integer`. The design checks this.
- Existing alpha installs: must reinstall (already the policy).
