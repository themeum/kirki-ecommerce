## Why

`database/migrations/` holds 75 files. Only 45 of them create tables; the other 30 alter, add, drop, rename, or re-key what the creates built, and two of the created tables (`coupon_usage`, `scheduler_jobs`) are later dropped again. To learn what a table looks like today you have to replay its whole history in your head. The plugin is still pre-release (`1.0.0-beta.1`), and beta users will be told to do a fresh install, so there is no installed base whose upgrade path we must keep. This is the cheapest moment to collapse the history into one create migration per table.

## What Changes

- Fold every `Alter*`, `Add*`, `Drop*`, `Replace*` migration into the `Create*` migration of the table it touches, so that each `Create*` produces the current beta.1 table shape directly. Columns brought in this way go in their logical position within the table, not at the end.
- Delete the `Create*` migrations for tables that are later dropped (`CreateCouponUsageTable`, `CreateSchedulerJobsTable`) along with their `Drop*` counterparts.
- Give every index, unique key, and foreign key an explicit name under a new, shorter scheme: `{fk|uq|idx}_kecom_{table}_{columns}`, for example `idx_kecom_orders_customer_id`. A name over 64 characters gets a hand-picked short form.
- Drop five plain indexes that only duplicate a unique key on the same column: `slug` on `brands`, `categories`, `collections`, `products`, and `code` on `languages`. The unique key already serves every lookup and every foreign key.
- **BREAKING**: remove the key-renaming migration `AlterSchemaKeysToExplicitNames`, the `SchemaKeys` support class, and both of their test classes. `TestMigrator` reads the plugin's tables straight from `information_schema` instead.
- **BREAKING**: remove the data migration `RenameFailedOrderEmailSettingsToPaymentFailed` and its test. A fresh install has no saved `failed_order` settings to move.
- Rewrite `config/migrations.php` as a single list of `Create*` migrations in foreign-key dependency order.
- **BREAKING**: an existing alpha/beta install cannot upgrade to this build. Its migration history records `Create*` classes whose content has since changed, and the alters it never applied are gone. Such sites must reinstall from scratch.
- Adopt a migration policy: until the first stable `1.0.0` release, a schema change edits the relevant `Create*` migration directly. From the first stable release onward, schema changes ship as new alter migrations.
- Drop the "upgrade migration" sentence from `docs/emails.md`, which no longer holds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-upgrade-migrations`: the "existing installations converge on upgrade" requirement is limited to stable releases, and a pre-release policy requiring fresh installs is added. Requirements that only existed to serve beta upgrade paths are removed: cart-identity association loss, coupon-eligibility reset, key-renaming idempotency and resumability, key-renaming scope, rename semantics, and stability across schema-library upgrades. The explicit key-naming requirement is restated around the new `kecom` scheme, and the "reported as a failure" scenario is removed because the inventory test is gone.

## Impact

- **Code**: `database/migrations/` (30 files deleted, most `Create*` files rewritten), `config/migrations.php`, `app/Supports/SchemaKeys.php` (deleted), `tests/Support/TestMigrator.php`.
- **Tests**: deletes `tests/Unit/Supports/SchemaKeysTest.php`, `tests/Integration/Database/SchemaKeyInventoryTest.php`, `tests/Integration/Database/RenameFailedOrderEmailSettingsToPaymentFailedTest.php`.
- **Data**: no migration of live data. Existing installs have to reinstall.
- **Related change**: once this lands, `remove-product-currency-id` should be amended so it removes `currency_id` from `CreateProductsTable` instead of adding `AlterProductsDropCurrencyId`, and so it refers to the key names `fk_kecom_products_currency_id` / `idx_kecom_products_currency_id`.
- **Docs**: `docs/emails.md` (one sentence).
