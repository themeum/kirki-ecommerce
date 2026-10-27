## 1. Baseline snapshot (before any migration edits)

- [x] 1.1 Write the schema snapshot script in the scratchpad (design D7). It dumps, for every `{prefix}kirki_ecommerce_%` table: the columns sorted by name (`COLUMN_TYPE`, `IS_NULLABLE`, `COLUMN_DEFAULT`, `EXTRA`, `COLUMN_COMMENT`), the primary key columns, the non-primary indexes as `(unique, columns)` without names, the FKs as `(column, ref table, ref column, DELETE_RULE, UPDATE_RULE)` without names, plus `ENGINE` and `TABLE_COLLATION`. A second mode dumps the key names only.
- [x] 1.2 On the untouched tree, in the docker stack: drop every plugin table, clear the migration-history option, run `wpcli kirki migrate`, then save `before.json`
  - _Deviation: the snapshot runs as a temporary PHPUnit test (`tests/Integration/Database/SchemaSnapshotTmpTest.php`, deleted in 4.7) against the `kirki_ecommerce_test` DB using `migrator()->fresh()` + `run()`, so the dev site's data is never wiped._
- [x] 1.3 Verify: `before.json` lists 43 tables, with no `coupon_usage` and no `scheduler_jobs`, and the run of `composer test:docker` on the untouched tree is recorded as the baseline result
  - _43 tables, 202 key entries, all `*_kirki_ecommerce_*`. Baseline: Unit OK (408 tests), Integration OK (638 tests incl. the snapshot test)._
- [x] 1.4 Verify: `npm run typecheck && npm test` (from `resources/app/`) passes on the untouched tree
  - _Typecheck passes. `npm test` has 3 failures that predate this change, in `features/coupons/tests/schemas/forms/coupon-form.test.ts` (customer-eligibility payload). They are unrelated to this PHP-only change and serve as the baseline for later checks._

## 2. Fold alters into the Create* migrations

Name every non-primary key per design D2 (`{fk|uq|idx}_kecom_{table}_{columns}`). Move each `->unique()` column modifier to a table-level `$table->unique('col', 'uq_kecom_…')`. Pass no name to `primary()`.

- [x] 2.1 `CreateAddressesTable`: fold `AlterAddressesTypeColumnToString` + `AlterAddressesTableForAddressBook` (`type` string(50), default `home`, comment `Supported values: home, office, others`; add `label`, `is_default_shipping`, `is_default_billing` after `type`)
- [x] 2.2 `CreateAttributesTable`: fold `AlterAttributesTypeColumnToString`; name the slug unique and both user FKs
- [x] 2.3 `CreateCartsTable`: fold `ReplaceCartsCustomerIdWithUserId` (nullable `user_id` after `id` with its comment, index `(user_id, created_at)`, FK → `users.ID` cascade) and `AlterCartsDropDiscountDetails`
- [x] 2.4 `CreateCartItemsTable`: make the `variant_id` FK `cascade_on_delete` (from `AlterCartItemsVariantForeignKeyToCascade`)
- [x] 2.5 `CreateCouponsTable`: fold `AlterCouponsEligibilityColumns` + `AlterCouponsEnumColumnsToString`, and rename `idx_active_coupons` to `idx_kecom_coupons_active_window`
- [x] 2.6 `CreateCouponCustomersTable`: primary key `(coupon_id, customer_id, is_excluded)`, and drop the `is_excluded` index (from `AlterCouponCustomersCompositePrimaryKey`)
- [x] 2.7 `CreateCustomersTable`: remove `is_billing_same_as_shipping`
- [x] 2.8 `CreateOrdersTable`: keep `is_billing_same_as_shipping` as `boolean default false` after `shipping_company`; add `invoice_number` string(50), nullable, after `order_number`, with an index; remove `coupon_code` and `discount_details`; add `invoiced_shipping_tax_amount` / `base_shipping_tax_amount` after `base_tax_total`; add `is_tax_inclusive` with its comment after `base_shipping_tax_amount`; rename every ad-hoc index name to the scheme
- [x] 2.9 `CreateOrderItemsTable`: remove `tax_rate` and `tax_breakdown`; add the four regular-price columns after `base_price`
- [x] 2.10 `CreateProductsTable`: add `published_at` and `trashed_at` after `has_variants`, `scheduled_at` after `trashed_at`, and `ribbon_color` string(20) with its comment after `ribbon`; drop the duplicate `index('slug')` (D4); keep `currency_id`
- [x] 2.11 `CreateRefundsTable`: fold `AlterRefundsEnumColumnsToString`
- [x] 2.12 `CreateShippingProfilesTable` / `CreateTaxProfilesTable`: add `is_default` boolean default 0 after `name`
- [x] 2.13 `CreateVariantsTable`: add nullable `low_stock_threshold` integer after `committed_quantity`
- [x] 2.14 `CreateBrandsTable`, `CreateCategoriesTable`, `CreateCollectionsTable`, `CreateLanguagesTable`: drop the duplicate plain `slug`/`code` index (D4)
- [x] 2.15 Name every remaining key in the Create* files that the steps above did not touch (tags, currencies, wishlist, translations, pivots, coupon pivots, order_* tables, jobs, failed_jobs, product_schemas, shipping_boxes, media_product, order_activities). Confirm `grep` finds no `->unique()` modifier and no `index(`/`unique(`/`foreign(` call without a `kecom` name in `database/migrations/`.
  - _Renames were applied mechanically with a scratchpad script (derived name per call, `->unique()` modifiers moved to table level, primary names dropped). The folds were then done by hand. The grep is clean._
- [x] 2.16 Verify: `npm run typecheck && npm test` (from `resources/app/`) passes
  - _Typecheck OK. The same 3 coupon-form failures as the baseline (1.4) remain, and nothing new fails._

## 3. Remove obsolete migrations, support code, and tests

- [x] 3.1 Delete the 30 non-Create migrations (every `Add*`, `Alter*`, `Drop*`, `Replace*`, `Rename*` file, including `AlterSchemaKeysToExplicitNames` and `RenameFailedOrderEmailSettingsToPaymentFailed`) plus `CreateCouponUsageTable` and `CreateSchedulerJobsTable`
- [x] 3.2 Rewrite `config/migrations.php` as a flat list of the 43 Create* classes in FK dependency order (D5): the coupon/tax child tables sit next to their parents, jobs/failed_jobs go last, and the release and ordering-invariant comments are removed
- [x] 3.3 Inline the plugin-table listing query into `tests/Support/TestMigrator.php` (D6), then delete `app/Supports/SchemaKeys.php`, `tests/Unit/Supports/SchemaKeysTest.php`, `tests/Integration/Database/SchemaKeyInventoryTest.php`, and `tests/Integration/Database/RenameFailedOrderEmailSettingsToPaymentFailedTest.php`
- [x] 3.4 Grep `app/`, `database/`, `config/`, `tests/`, and `routes/` for any remaining reference to a deleted class, the `kirki_ecommerce_coupon_usage` / `scheduler_jobs` tables, or an old `*_kirki_ecommerce_*` key name, and fix whatever turns up
  - _Clean, apart from three docblock mentions of the old `coupon_usage` table in `tests/Integration/OrderApiTest.php`. Those describe past behaviour and were left alone._
- [x] 3.5 Verify: `npm run typecheck && npm test` (from `resources/app/`) passes
  - _Typecheck OK. Same 3 baseline coupon-form failures._

## 4. Prove equivalence

- [x] 4.1 Drop all plugin tables, clear the migration option, run `wpcli kirki migrate` on the squashed tree, save `after.json`
  - _Ran through the same temporary snapshot test on the test DB (see 1.2)._
- [x] 4.2 Diff `before.json` against `after.json`. The only allowed difference is the five plain `slug`/`code` indexes on brands, categories, collections, products, and languages. Fix any other difference in the relevant Create* and re-run.
  - _Same 43 tables. Columns, primary keys, FKs (targets plus delete/update rules), engine, and collation are identical. The only differences are the 5 planned `index slug`/`index code` removals._
- [x] 4.3 Run the name-only dump. Every non-primary key must match `^(fk|uq|idx)_kecom_[a-z0-9_]+$` and be ≤ 64 characters, and no name may contain `kirki_ecommerce`.
  - _197 entries (202 − 5), all matching the scheme and its derived name; the longest is 60 characters. FK backing indexes carry their constraint's `fk_kecom_…` name._
- [x] 4.4 Run `composer test:docker` and confirm it matches the baseline from 1.3, apart from the deleted test classes
  - _Unit OK (400, previously 408: −8 = `SchemaKeysTest`). Integration OK (628, previously 637: −5 `SchemaKeyInventoryTest`, −4 `RenameFailed…Test`; both runs also had the temporary snapshot test, excluded from these counts)._
- [x] 4.5 Run `composer phpcs:docblocks` on `database/` and `app/`
  - _Clean. Full `phpcs` on `database/migrations`, `config/migrations.php`, and `TestMigrator.php` is also clean._
- [x] 4.6 Verify: `npm run typecheck && npm test` (from `resources/app/`) passes
  - _Typecheck OK. Same 3 baseline coupon-form failures._
- [x] 4.7 Delete `tests/Integration/Database/SchemaSnapshotTmpTest.php` and the `.schema-snapshot/` output directory

## 5. Docs and the related change

- [x] 5.1 `docs/emails.md`: remove the sentence saying an upgrade migration moved saved `failed_order` settings
- [x] 5.2 Amend `openspec/changes/remove-product-currency-id` (proposal, design, tasks) so it removes `currency_id`, its `idx_kecom_products_currency_id` index, and its `fk_kecom_products_currency_id` FK from `CreateProductsTable` directly instead of adding `AlterProductsDropCurrencyId`
- [x] 5.3 Run `openspec validate squash-migrations-into-create-tables --strict` and `openspec validate remove-product-currency-id --strict`
- [x] 5.4 Verify: `npm run typecheck && npm test` (from `resources/app/`) passes
  - _Typecheck OK. Same 3 baseline coupon-form failures._

## 6. Seeders

- [x] 6.1 Run `OnBoardingSeeder` and `DatabaseSeeder` against a fresh squashed schema (temporary integration tests, one process each, then deleted)
  - _OnBoarding: OK as is. Demo: failed on `fk_kecom_coupon_customers_customer_id` because `CouponSeeder` ran before `CustomerSeeder`; that FK predates the squash._
- [x] 6.2 `DatabaseSeeder`: run `CustomerSeeder` before `CouponSeeder`
- [x] 6.3 `OrderSeeder`: pass `coupon_codes => ['WINTER20']` instead of the legacy `coupon_code`, which the order payload ignored, so the sample order gets its `order_coupons` row
