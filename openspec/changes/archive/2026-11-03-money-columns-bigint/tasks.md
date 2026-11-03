# Tasks

## 1. Schema test (write first, see it fail)

- [x] 1.1 Add `tests/Integration/MoneyColumnStorageTest.php` with an explicit list of the 49 money columns (table and column) from proposal.md, and assert from `information_schema.COLUMNS` that each has `DATA_TYPE` = `bigint`. Verify: `composer test:integration -- --filter MoneyColumnStorageTest` fails on all 49 columns before group 2.
- [x] 1.1a In the same test, assert that the `COLUMN_COMMENT` of each of the 49 columns contains "minor units". Verify: the test fails before group 2 on exactly the 9 columns named in design.md D5, and on no other column.
- [x] 1.2 In the same test, assert that `quantity`, `items_count`, `usage_limit`, `customer_limit`, `max_per_order` and `coupons.reward_value` are still `int`. Verify: these assertions pass before and after group 2.
- [x] 1.3 Add a round-trip test in the same file: save an order with `invoiced_total` 5,000,000,000, an order item with `invoiced_price` 3,000,000,000 and `invoiced_discount_amount` 1,000,000,000, a variant with `base_price` 3,000,000,000, and one negative amount of -2,500,000,000 on a column that allows it. Read each back and assert exact equality. Verify: the test fails before group 2 (clipped to 2,147,483,647) and passes after.

## 2. Change the column types

- [x] 2.1 `CreateOrdersTable.php`: change the 14 `invoiced_*` and `base_*` money columns from `integer` to `big_integer`. Keep `default`, `nullable` and `comment`. Do not touch `items_count`. Verify: `git diff` shows only the type call changed on those 14 lines.
- [x] 2.2 `CreateOrderItemsTable.php`: change the 22 money columns (price, regular price, catalog prices, discount, discount tax, tax, subtotal, total, in both currencies). Do not touch `quantity`. On the 6 `*_catalog_*` columns and the 2 `*_discount_tax_total` columns, also add ", minor units" to the comment (after the currency phrase). Verify: `git diff` shows 22 changed lines and only those 8 comments differ.
- [x] 2.3 `CreateOrderTaxesTable.php` (2 columns), `CreateOrderCouponsTable.php` (3), `CreateOrderItemCouponsTable.php` (2), `CreateRefundsTable.php` (1). In the refunds comment, change "in cents, in the order currency" to "in the order currency, minor units". Verify: `git diff` shows 8 changed lines and only the refunds comment differs.
- [x] 2.4 `CreateCouponsTable.php` (`base_discount_amount_fixed`, `spend_condition_value`) and `CreateVariantsTable.php` (`base_price`, `base_sale_price`, `base_cost_of_goods`). Leave `reward_value`, `reward_quantity`, limits and stock columns as `integer`. Verify: `git diff` shows 5 changed lines.
- [x] 2.5 Search for any other money column that was missed: `grep -nE "integer\(" database/migrations/*.php` and check each remaining hit is a count, limit, ordering or percentage. Verify: every remaining hit is explained in the PR description.
- [x] 2.5a Change `coupons.reward_value` to `big_integer` as a precaution (buy-x-get-y may store an amount), and guard it with `test_reward_value_is_bigint`. Verify: the test passes and `git diff` shows one more changed line in `CreateCouponsTable.php`.
- [x] 2.6 Run `composer test:integration -- --filter MoneyColumnStorageTest`. Verify: all assertions from 1.1 to 1.3, including 1.1a, pass.

## 3. Regression check and docs

- [x] 3.1 Run the full PHP suite with `composer test`. Verify: it passes with no new failure (money math, order totals, refunds and coupon tests included).
- [x] 3.2 Check `docs/order-data-and-calculations.md` for any statement that names the money column type or a 32-bit limit. Update it if found; add one sentence that money is stored as signed 64-bit minor units. Verify: the doc and the schema agree.
- [x] 3.3 Run `npm run typecheck && npm test` in `resources/app/`. Verify: both pass (no frontend file is changed, so this confirms nothing broke).
- [x] 3.4 On a local site, deactivate the plugin, drop the plugin tables and activate it again; then run `SHOW COLUMNS` on `kirki_ecommerce_orders` and check `invoiced_total` is `bigint`. Verify: the output shows `bigint` and the plugin loads with no error.

## Workflow follow-up

- Add a line to the next alpha release notes: this build changes column types; alpha installs must reinstall.
- Archive the change after review.
