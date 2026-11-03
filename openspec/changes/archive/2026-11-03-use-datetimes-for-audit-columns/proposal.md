# Proposal

## Why

`$table->timestamps()` creates `created_at` and `updated_at` as MySQL `TIMESTAMP` columns. Every other date column on the plugin tables is now `DATETIME` (change `datetime-utc-columns`). So each table mixes both types. A `TIMESTAMP` moves with the database session time zone and stops at 2038 (2106 on newer MariaDB). The framework now has `$table->datetimes()`, which makes the same two columns as `DATETIME`. The change is a direct swap.

The plugin is still in alpha, and alpha installs reinstall (see `squash-migrations-into-create-tables`). This is the cheapest time to change the type.

## What Changes

- Replace `$table->timestamps();` with `$table->datetimes();` in all 43 `Create*Table` files: 41 in `database/migrations/` and 2 in `app/Migration/Database/Migrations/` (`CreateMigrationRunsTable`, `CreateMigrationRecordLedgerTable`). The columns keep the same names, defaults and nullability.
- Remove the `created_at` / `updated_at` exclusion from the schema guard test, so it covers every column of every plugin table.
- Update `utc-datetime-storage`: the "no `timestamp` column" rule now covers `created_at` and `updated_at` too.
- **BREAKING**: an existing alpha install cannot upgrade. This matches the policy in `schema-upgrade-migrations`, so no alter migration is written.

Not changed: `OrderMapper::timestamps()` in the WooCommerce migration code. It is a PHP method with the same name and has no relation to the schema call.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `utc-datetime-storage`: the requirement "Date columns use DATETIME" no longer excludes `created_at` and `updated_at`.

## Impact

- `database/migrations/`: 41 files change one line each.
- `app/Migration/Database/Migrations/`: 2 files change one line each.
- `tests/Integration/UtcDateTimeStorageTest.php`: remove the column exclusion and its comment.
- Models and API: no change expected. Models write `Y-m-d H:i:s` UTC strings to these columns, and a `DATETIME` returns the same string.
- Existing alpha installs: must reinstall (already the policy).
