# Design

## Context

See proposal.md, "Why". Facts found in the code:

- Every money column is written as `$table->integer('<name>')` in a `Create*Table` file. The framework compiles that to `int` (32-bit signed). `$table->big_integer('<name>')` compiles to `bigint` (signed). `unsigned_big_integer` also exists but is for ids.
- WordPress removes strict SQL mode, so an out-of-range write is clipped to 2,147,483,647 with no error.
- Model casts for money columns are `'integer'`. PHP integers are 64-bit on every normal host, so reading and writing a 64-bit value needs no PHP change.
- The React admin app works with money as plain numbers. A search of `resources/app` found no bitwise operation on a price, amount or total. A JavaScript number stays exact up to 2^53 (about 9 x 10^15), which is far above any real order.
- `squash-migrations-into-create-tables` made the `Create*` files the single source of the schema and set the rule that alpha installs reinstall. So editing the `Create*` files in place is correct and no alter migration is needed.
- The 49 money columns are listed by table in proposal.md. They are the columns whose comment says "minor units" plus `orders.*_payment_provider_fee`, `order_items.*_discount_tax_total` and `order_items.*_catalog_*`. The last two groups have comments that do not say "minor units". They are still money.

## Goals / Non-Goals

**Goals:**
- Each money column is `bigint` after a fresh install, with the same name, default and nullability, and a comment that states "minor units".
- A test fails if a money column goes back to a smaller type, or if a new money column is added with a smaller type.
- A test shows that a value above 2^31 round-trips.

**Non-Goals:**
- An upgrade path for existing alpha installs. The reinstall policy applies.
- Changing money to a decimal or string type. Minor units in an integer stay.
- Rewording comments beyond the unit. Only the 9 comments that break `money-column-comments` get a unit fix (D5).
- `TIMESTAMP` to `DATETIME`, and unique indexes. They are separate changes.
- 32-bit PHP builds. See Risks.

## Decisions

### D1. Edit the `Create*` files; write no alter migration

Replace `integer` with `big_integer` on each of the 49 columns. Keep every modifier (`default`, `nullable`, `comment`) exactly as it is.

- **Alternative: a new `AlterMoneyColumnsToBigint` migration.** This would also upgrade alpha installs. It was rejected because the squash change removed the alter chain and set the reinstall policy. A new alter would restart a chain that was just deleted, and it would be dead code at the first stable release.

### D2. Use signed `big_integer`, not `unsigned_big_integer`

Money columns keep their sign. A discount, a tax adjustment or a correction can be negative, and the old `int` columns were signed. An unsigned column would make a negative write fail or wrap in non-strict mode.

### D3. Keep `quantity`, `items_count`, limits and ordering as `int`

These hold counts, not money, and a count above 2^31 is not realistic. `coupons.reward_value` is the exception: it becomes `bigint` as a precaution (see the correction below). `coupons.spend_condition_value` changes, because it holds a money amount when `spend_condition_type` is `min-cart-amount`. For `min-items` it holds a count and fits in `bigint` too.

**Correction during implementation:** the first draft said `reward_value` holds a count or percentage. The code does not show that. The column has no comment. The admin app and the API only pass it through, and no calculation reads it. Its meaning is undefined today: buy-x-get-y is a coupon type, but `DiscountService` treats it as a no-op. The owner expects it may hold a reward amount. `bigint` is harmless if it holds a percent, and a later type change would need a data migration after release. So the column becomes `bigint` now. It is not added to the money column list and gets no "minor units" comment, because its unit is not decided. A separate test (`test_reward_value_is_bigint`) guards the type. When the feature stores an amount, add the comment and move the column to the money list in `MoneyColumnStorageTest`.

### D4. Test the schema from `information_schema`

Add one integration test that reads `information_schema.COLUMNS` for the eight tables and asserts the `DATA_TYPE` is `bigint` for every money column in an explicit list. A second test writes an order, an order item and a variant with amounts above 2^31 and reads them back.

- **Alternative: assert from the `Create*` source text.** Rejected: it tests the code, not the database.
- **Alternative: a list-free rule, such as "every column whose name starts with `base_` or `invoiced_`".** Rejected for the first version. It would also catch `base_currency_code` and `invoiced_*` text columns. An explicit list is clearer, and the test file says to add new money columns to it.

### D5. Fix the 9 non-compliant unit comments in the same edit

The `money-column-comments` spec says every money comment states the currency and "minor units". A scan of the `Create*` files found 9 that do not: `order_items.invoiced_catalog_regular_price`, `base_catalog_regular_price`, `invoiced_catalog_sale_price`, `base_catalog_sale_price`, `invoiced_catalog_product_coupon_discounted_subtotal`, `base_catalog_product_coupon_discounted_subtotal`, `invoiced_discount_tax_total`, `base_discount_tax_total`, and `refunds.invoiced_amount` (it says "cents").

These lines are edited for the type change anyway, so the fix adds no extra diff lines and no extra review pass. The schema test also asserts that each comment contains "minor units", so the spec is checked by a test from now on.

- **Alternative: a separate change.** Rejected: it would touch the same 9 lines again for no gain.
- **Alternative: also reword the other comments.** Rejected: all other money comments already comply.

The test harness (`tests/Support/TestMigrator.php`) drops and recreates plugin tables, so the test sees the new types without extra setup.

## Risks / Trade-offs

- **[A money column is missed]** → The explicit list in the schema test comes from the grep in this design, and the test fails on any listed column that is not `bigint`. Review also checks the other `integer(` calls in `Create*` files once.
- **[Index size and speed]** → `bigint` is 8 bytes instead of 4. Money columns are not indexed in the plugin (checked in the `Create*` files), so there is no index growth. Row size grows by about 4 bytes per column, which is small next to the text columns.
- **[Wrong total from float math]** → PHP money math that uses floats (for example, exchange-rate multiplication) is exact only to 2^53. This is far above the old limit and above any real amount, so it does not block this change.
- **[32-bit PHP]** → On a 32-bit PHP build, `PHP_INT_MAX` is 2^31-1, so a big value would become a float when it is cast. WordPress 6.8 and PHP 7.4 or newer on 32-bit are rare. This is accepted and not handled.
- **[Existing alpha installs break]** → Accepted by the reinstall policy. The release notes of the next alpha should say it.

## Migration Plan

1. Edit the eight `Create*Table.php` files.
2. Run the new tests on a fresh database.
3. Reinstall the plugin on any alpha test site (deactivate, drop the plugin tables, activate).

Rollback is a revert of the commit, because no data migration runs.
