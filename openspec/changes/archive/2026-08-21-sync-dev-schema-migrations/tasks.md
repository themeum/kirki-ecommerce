## 1. Revert edited `Create*Table` files to `main`'s content

- [x] 1.1 Revert `database/migrations/CreateCartsTable.php` to its `main`-branch content (`git show main:database/migrations/CreateCartsTable.php`).
- [x] 1.2 Revert `database/migrations/CreateCouponCustomersTable.php` to its `main`-branch content.
- [x] 1.3 Revert `database/migrations/CreateCouponsTable.php` to its `main`-branch content.
- [x] 1.4 Revert `database/migrations/CreateShippingProfilesTable.php` to its `main`-branch content.
- [x] 1.5 Revert `database/migrations/CreateTaxProfilesTable.php` to its `main`-branch content.
- [x] 1.6 Verify: `git diff main -- database/migrations/CreateCartsTable.php database/migrations/CreateCouponCustomersTable.php database/migrations/CreateCouponsTable.php database/migrations/CreateShippingProfilesTable.php database/migrations/CreateTaxProfilesTable.php` is empty.

## 2. Carts: `customer_id` → `user_id`

- [x] 2.1 Create `database/migrations/ReplaceCartsCustomerIdWithUserId.php` implementing `Migration` (scoped `Kirki\Ecommerce\Framework\Contracts\Migration` import, matching existing `Create*Table` files): `up()` drops the old FK on `customer_id`, drops `idx_customer_carts`, `drop_column('customer_id')` (NOT `rename_column` — `customer_id` and `user_id` reference different ID spaces, so no value should carry forward), adds a fresh `unsigned_big_integer('user_id')->nullable()->comment('WordPress user ID for owned carts')` column, adds `idx_user_carts` on `(user_id, created_at)`, adds the new FK `user_id` → `users.ID` with cascade on delete; `down()` reverses each step in opposite order (drops `user_id` and its FK/index, re-adds `customer_id` and its original FK/index — does not restore data). Note: the old FK on `customer_id` was created without an explicit constraint name, so dropping it required `drop_foreign(['customer_id'])` (array form) rather than `drop_foreign('customer_id')` — a bare string is treated as a literal constraint name, not a column to derive the auto-generated `{table}_{column}_foreign` name from.
- [x] 2.2 Append the new class to `config/migrations.php` directly after `CreateCartsTable::class`.
- [x] 2.3 Verify: `php -l database/migrations/ReplaceCartsCustomerIdWithUserId.php`.

## 3. Coupon customers: composite primary key includes `is_excluded`

- [x] 3.1 Create `database/migrations/AlterCouponCustomersCompositePrimaryKey.php`: `up()` drops the existing primary key `pk_kirki_ecommerce_coupon_customers`, drops the standalone index on `is_excluded`, adds the new composite primary key `(coupon_id, customer_id, is_excluded)` under the same name; `down()` reverses. Note: `is_excluded`'s original index had no explicit name, so `drop_index(['is_excluded'])` (array form) is used to derive the same auto-generated name it was created with.
- [x] 3.2 Append the new class to `config/migrations.php` directly after `CreateCouponCustomersTable::class`.
- [x] 3.3 Verify: `php -l database/migrations/AlterCouponCustomersCompositePrimaryKey.php`.

## 4. Coupons: customer-eligibility and target-country restructuring

- [x] 4.1 Create `database/migrations/AlterCouponsEligibilityColumns.php`: `up()` adds `target_country_type` as `string(50)->default('all-countries')->comment('Supported values: all-countries, specific-countries')` positioned (`->after('end_datetime')`) before `target_countries`; drops `customer_eligibility` and `exclude_customers`; adds `customer_include_eligibility` and `customer_exclude_eligibility` (both `string(50)` with comments, positioned after `first_time_buyer_only` — the same slot the two dropped columns occupied) — all three as `string`, not `enum`, per the enum-to-string decision (design.md); `down()` reverses (re-adds `customer_eligibility`/`exclude_customers` as their original `enum` types, drops the three added columns). Also caught while implementing: the original dev/main diff additionally changed `target_countries`' comment text ('Array of country codes as JSON' → 'Array of {country, states} regions as JSON') — this wasn't captured in the original task wording, so `up()` also `->change()`s that comment (and `down()` restores it).
- [x] 4.2 Append the new class to `config/migrations.php` directly after `CreateCouponsTable::class`.
- [x] 4.3 Verify: `php -l database/migrations/AlterCouponsEligibilityColumns.php`.

## 5. Shipping and tax profiles: `is_default` column

- [x] 5.1 Create `database/migrations/AddIsDefaultToShippingProfilesTable.php`: `up()` adds `is_default` boolean, default `0`; `down()` drops it.
- [x] 5.2 Create `database/migrations/AddIsDefaultToTaxProfilesTable.php`: `up()` adds `is_default` boolean, default `0`; `down()` drops it.
- [x] 5.3 Append both classes to `config/migrations.php`, each directly after its corresponding `CreateShippingProfilesTable::class` / `CreateTaxProfilesTable::class` entry.
- [x] 5.4 Verify: `php -l` on both new files.

## 6. Coupons: convert pre-existing enum columns to string

- [x] 6.1 Create `database/migrations/AlterCouponsEnumColumnsToString.php` (separate from `AlterCouponsEligibilityColumns` — see design.md's rationale for keeping the dev/main-diff and enum-to-string concerns in different files): `up()` redeclares and `->change()`s each of `method` (`string(50)->default('code')->comment('Supported values: code, automatic')`), `discount_type` (`string(50)->default('amount-off')->comment('Supported values: amount-off, free-shipping, buy-x-get-y')`), `discount_target` (`string(50)->nullable()->comment('Supported values: order, products')`), `discount_value_type` (`string(50)->nullable()->comment('Supported values: percentage, fixed')`), `eligible_item_type` (`string(50)->nullable()->comment('Supported values: specific-products, specific-categories, all-products')`), `spend_condition_type` (`string(50)->nullable()->comment('Supported values: min-cart-amount, min-items')`); `down()` reverses each back to its original `enum(...)` definition.
- [x] 6.2 Append the new class to `config/migrations.php` directly after `CreateCouponsTable::class` (order relative to `AlterCouponsEligibilityColumns` doesn't matter — disjoint columns).
- [x] 6.3 Verify: `php -l database/migrations/AlterCouponsEnumColumnsToString.php`.

## 7. Addresses: convert `type` column to string

- [x] 7.1 Create `database/migrations/AlterAddressesTypeColumnToString.php`: `up()` redeclares and `->change()`s `type` as `string(50)->default('billing')->comment('Supported values: billing, shipping')`; `down()` reverses to `enum(['billing', 'shipping'])->default('billing')`.
- [x] 7.2 Append the new class to `config/migrations.php` directly after `CreateAddressesTable::class`.
- [x] 7.3 Verify: `php -l database/migrations/AlterAddressesTypeColumnToString.php`.

## 8. Attributes: convert `type` column to string

- [x] 8.1 Create `database/migrations/AlterAttributesTypeColumnToString.php`: `up()` redeclares and `->change()`s `type` as `string(50)->default('list')->comment('Supported values: color, list')`; `down()` reverses to `enum(['color', 'list'])->default('list')`.
- [x] 8.2 Append the new class to `config/migrations.php` directly after `CreateAttributesTable::class`.
- [x] 8.3 Verify: `php -l database/migrations/AlterAttributesTypeColumnToString.php`.

## 9. Scheduler jobs: convert `status` column to string

- [x] 9.1 Create `database/migrations/AlterSchedulerJobsStatusColumnToString.php`: `up()` redeclares and `->change()`s `status` as `string(50)->default('pending')->comment('Supported values: pending, processing, failed, completed')`; `down()` reverses to `enum(['pending', 'processing', 'failed', 'completed'])->default('pending')`.
- [x] 9.2 Append the new class to `config/migrations.php` directly after `CreateSchedulerJobsTable::class`.
- [x] 9.3 Verify: `php -l database/migrations/AlterSchedulerJobsStatusColumnToString.php`.

## 10. Refunds: convert `status` and `refund_type` columns to string

- [x] 10.1 Create `database/migrations/AlterRefundsEnumColumnsToString.php`: `up()` redeclares and `->change()`s `status` as `string(50)->default('pending')->comment('Supported values: pending, completed, failed, cancelled')` and `refund_type` as `string(50)->default('partial')->comment('Supported values: partial, full')`; `down()` reverses both to their original `enum(...)` definitions.
- [x] 10.2 Append the new class to `config/migrations.php` directly after `CreateRefundsTable::class`.
- [x] 10.3 Verify: `php -l database/migrations/AlterRefundsEnumColumnsToString.php`.

## 11. End-to-end verification

- [x] 11.1 Ran the real migrator (`wp kirki migrate`, and via `RestTestCase::reset_plugin_database()` → `migrator()->fresh()->run()` in the integration suite) against the project's own dev and test databases. Note: both pre-existing databases turned out to be seeded from a raw SQL import rather than ever having run through the plugin's migrator — every FK constraint in them had a bare numeric name (`1`, `2`, ...) instead of the framework's generated names, which is unrelated to this change but made them invalid stand-ins for "a site that ran `wp kirki migrate`". Verified instead against `kirki_ecommerce_test` after dropping its plugin tables so the migrator built everything from genuine scratch — all ten new alter migrations executed without a single schema-level SQL error.
- [x] 11.2 Inspected resulting schema for all nine affected tables directly (`SHOW COLUMNS`, `information_schema.KEY_COLUMN_USAGE`) — matches the target shape from proposal.md's per-table breakdown, including correct FK/index names on `carts` and the composite primary key on `coupon_customers`.
- [x] 11.3 Idempotency could not be cleanly demonstrated in this environment: `WP_UnitTestCase`'s per-test transaction wrapper (`start_transaction()`, called from `setUp()`) doesn't wrap `RestTestCase::setUpBeforeClass()`, and `ALTER TABLE`'s implicit commit silently opens a new transaction that a later rollback discards — so `record_migration()`'s write to `framework_migrations` doesn't reliably survive across test classes even though the schema change itself (DDL) does. This is a **pre-existing structural gap**, not a defect introduced by this change: all 40 prior migrations were `CREATE TABLE IF NOT EXISTS`, which stayed silently safe to re-run even if tracking was lost; this proposal's alter migrations are the first that are not idempotent, so the gap is now visible for the first time. Documented in design.md's Risks. A single from-scratch run (11.1) confirmed correct one-time application; repeated `wp kirki migrate` invocations against a real site (not wrapped in a test transaction) are expected to behave correctly since there `record_migration()`'s write isn't subject to this same rollback.
- [x] 11.4 Fresh-install path exercised directly by 11.1 (the from-scratch `kirki_ecommerce_test` run *is* the fresh-install path — `Create*Table` then its alter migration ran in sequence for every affected table, converging on the same schema as 11.2).
- [x] 11.5 Confirmed via `SHOW COLUMNS`: every converted column (all 14 across the 5 files) reports `varchar(50)`, not `enum`.
- [x] 11.6 Ran `composer test:docker:integration` against `kirki_ecommerce_test`. Result: 216 tests, 3 errors, 8 failures — none show a schema-level error (no "unknown column", no FK/constraint SQL error) tied to any of the 9 tables this change touches; all are pre-existing/unrelated (WP core test-fixture edge cases like "Cannot create a user with an empty login name", a hardcoded `created_by=0` FK violation on the untouched `customers` table, and two coupon/refund assertion-shape mismatches that predate this change). One genuine, actionable finding surfaced during verification: `ShippingProfileService::create()` / `CreateShippingProfileDTO` (and the symmetric `TaxProfile` pair) didn't coalesce a missing `is_default` to `false` before insert, so `POST /shipping-profiles` and `POST /tax-profiles` 500'd whenever the field was omitted — a pre-existing `dev`-branch application bug, identical regardless of whether `dev`'s own edited migration or this proposal's alter migration created the column (same `NOT NULL DEFAULT 0` shape either way), so not a consequence of any decision in this proposal. Confirmed fixed independently (DTOs now default `is_default = false`, request rules changed to `nullable|boolean`) and re-verified: `ShippingProfileApiTest`/`TaxProfileApiTest` now pass in full on a from-scratch migrator run.
