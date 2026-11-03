# Tasks

## 1. Guard test (write first, see it fail)

- [x] 1.1 In `tests/Integration/UtcDateTimeStorageTest.php`, remove `and COLUMN_NAME not in ('created_at', 'updated_at')` from `test_no_named_date_column_is_a_timestamp` and update its docblock. Add an assertion that `created_at` and `updated_at` are `datetime` on a sample table. Verify: `./kirki-ecommerce-test integration --filter=UtcDateTimeStorageTest` fails and lists the `created_at` and `updated_at` columns before group 2.

## 2. Schema

- [x] 2.1 Replace `$table->timestamps();` with `$table->datetimes();` in the 41 files in `database/migrations/`. Verify: `grep -rn 'timestamps()' database/migrations` returns nothing, and `git diff --stat database/migrations` shows 41 files with one changed line each.
- [x] 2.2 Make the same replacement in `app/Migration/Database/Migrations/CreateMigrationRunsTable.php` and `CreateMigrationRecordLedgerTable.php`. Leave `OrderMapper::timestamps()` as it is. Verify: `grep -rn '\$table->timestamps()' app database` returns nothing.
- [x] 2.3 Check the plugin's minimum database version against the `DATETIME DEFAULT CURRENT_TIMESTAMP` requirement (MySQL 5.6.5, MariaDB 10.0). Verify: the minimum in the plugin header or readme is at or above these versions; if not, record it in design.md and tell the owner. Checked: the plugin header and readme declare no database minimum, only WordPress 6.8 and PHP 7.4. The old `timestamps()` already used `DEFAULT CURRENT_TIMESTAMP`, so the only new floor is MySQL 5.6.5 or MariaDB 10.0 for the `DATETIME` default. WordPress 6.8 recommends MySQL 8.0 or MariaDB 10.6, so no action is needed.
- [x] 2.4 Re-create the plugin tables in the test database and run `./kirki-ecommerce-test integration --filter=UtcDateTimeStorageTest`. Verify: all tests in the file pass, including the guard test from 1.1.

## 3. Regression and docs

- [x] 3.1 Run `./kirki-ecommerce-test all`. Verify: Unit and Integration pass with no new failure (migration run and ledger tests included).
- [x] 3.2 Search `docs/` for statements that say `created_at` and `updated_at` are `TIMESTAMP`, or that they follow the framework. Update the sentence in `docs/order-data-and-calculations.md` so it says all stored dates are UTC `DATETIME`. Verify: the doc and the schema agree.
- [x] 3.3 Run `npm run typecheck && npm test` in `resources/app/`. Verify: both pass (no frontend file changes; this confirms nothing broke).
- [x] 3.4 Run `phpcs` with `phpcs.xml.dist` on the changed PHP files. Verify: no new error.

## Workflow follow-up

- Re-create the plugin tables on the local dev site, then run `SELECT DATA_TYPE FROM information_schema.COLUMNS` for `kirki_ecommerce_orders.created_at` to confirm `datetime`. This deletes local plugin data, so the owner does it.
- Add a line to the next alpha release notes: this build changes column types; alpha installs must reinstall.
- Archive the change after review.
