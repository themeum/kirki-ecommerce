# Tasks

## 1. Tests (write first, see them fail)

- [x] 1.1 Add `tests/Integration/UtcDateTimeStorageTest.php`. First test: select from `information_schema.COLUMNS` every column of the plugin tables with `DATA_TYPE = 'timestamp'`, except `created_at` and `updated_at`, and assert the list is empty. Those two come from the framework `timestamps()` call, which the owner will change in the framework, so the test leaves them out until then. Verify: `./kirki-ecommerce-test integration --filter=UtcDateTimeStorageTest` fails and lists the 12 named columns before group 2.
- [x] 1.2 Add a test for the far-future date: save an order with `estimated_delivery_date` `2040-06-01 12:00:00`, read it back, and assert the exact string. Verify: it fails before group 2 (the `TIMESTAMP` range ends in 2038). Note: the test DB is MariaDB 12.3, whose `TIMESTAMP` range reaches 2106, so a 2040 date alone passes there; the test also checks a 2110 date, which fails (stored as `0000-00-00`).
- [x] 1.3 Add a test that a stored time does not move: save an order with `paid_at` `2026-01-15 10:00:00` while the session time zone is `+00:00`, set the session to `+07:00`, read the raw value with a direct query, and assert `2026-01-15 10:00:00`. Reset the session time zone in a `finally` block. Verify: it fails before group 2 (it reads `17:00:00`).
- [x] 1.4 Add a test for bulk inserts under a shifted session time zone: set `+07:00`, then run `CurrencyService::insert`, `AttributeValueService::insert` and the `SchemaProfilePresets` insert (call the preset the way `StorePresetService` does), read `created_at` and `updated_at` of the new rows, and assert each is within 10 seconds of the current UTC time. Reset the session time zone in a `finally` block. Verify: it fails before group 3 on all three sites.

## 2. Schema

- [x] 2.1 Leave `$table->timestamps();` as it is in the 41 `Create*Table.php` files, because the owner will change `timestamps()` in the framework. (First done with two explicit `datetime` lines per file, then reverted at the owner's request.) Verify: `git diff --stat database/migrations` shows only the four files from 2.2.
- [x] 2.2 Change the 12 named columns from `timestamp` to `datetime`, keeping `nullable` and `comment`: `CreateCartsTable` (`expires_at`), `CreateOrderCouponsTable` (`usage_reversed_at`), `CreateOrdersTable` (`paid_at`, `shipped_at`, `cancelled_at`, `fulfilled_at`, `estimated_delivery_date`, `delivered_at`, `archived_at`), `CreateProductsTable` (`published_at`, `trashed_at`, `scheduled_at`). Verify: `grep -n "timestamp(" database/migrations/*.php` returns nothing.
- [x] 2.3 Run `./kirki-ecommerce-test integration --filter=UtcDateTimeStorageTest`. Verify: the named-column schema test, the far-future date test and the time-zone-shift test pass.

## 3. Bulk inserts write UTC

- [x] 3.1 `SchemaProfilePresets.php`: add `created_at` and `updated_at` (`Date::now('UTC')->to_date_time_string()`, computed once) to each row before `ProductSchema::query()->insert($rows)`. Verify: the `ProductSchema` part of test 1.4 passes.
- [x] 3.2 `AttributeValueService::insert`: add the two columns to every row, for both a single row and a list of rows. Check first whether anything in `app/` calls this method; if nothing does, say so in the task note and still patch it. Checked: nothing in `app/` calls it (only the controller constructor type-hints the service), so the method is unused today; it is patched anyway so a later caller is safe. Verify: the attribute value part of test 1.4 passes for both input shapes.
- [x] 3.3 `CurrencyService::insert`: add the two columns to the rows once, before both `Currency::insert` branches. Verify: the currency part of test 1.4 passes, and the existing currency tests still pass.
- [x] 3.4 Run `./kirki-ecommerce-test integration --filter=UtcDateTimeStorageTest`. Verify: all tests in the file pass.

## 4. Regression and docs

- [x] 4.1 Run `./kirki-ecommerce-test all`. Verify: Unit and Integration pass with no new failure (analytics, scheduled publishing, cart expiry and order tests included).
- [x] 4.2 Search `docs/` for statements about date storage. Add one sentence that the dates the plugin declares are stored as UTC `DATETIME` to `docs/order-data-and-calculations.md`. Verify: the doc and the schema agree.
- [x] 4.3 Run `npm run typecheck && npm test` in `resources/app/`. Verify: both pass (no frontend file is changed, so this confirms nothing broke).
- [x] 4.4 Run `phpcs` with `phpcs.xml.dist` on the changed PHP files. Verify: no new error.

## Workflow follow-up

- Re-create the plugin tables on the local dev site so that its columns become `datetime`, then run `SELECT DATA_TYPE FROM information_schema.COLUMNS` for `kirki_ecommerce_orders.created_at` to confirm. This deletes local plugin data, so the owner does it.
- When the framework `timestamps()` creates `DATETIME`, remove the `created_at` / `updated_at` exclusion from `test_no_named_date_column_is_a_timestamp`, so that the guard covers every column.
- Add a line to the next alpha release notes: this build changes column types; alpha installs must reinstall.
- Archive the change after review.
