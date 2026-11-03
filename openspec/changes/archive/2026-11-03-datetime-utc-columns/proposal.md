# Proposal

## Why

Every date column on the plugin tables, except the coupon dates, is a MySQL `TIMESTAMP`. MySQL converts a `TIMESTAMP` with the time zone of the database session, in both directions. If a site moves to a host with a different time zone, every stored time shifts. A `TIMESTAMP` also stops at 2038-01-19, so a later date, such as a far-future scheduled publish or delivery date, cannot be stored. The coupon tables already use `DATETIME`, so the schema is mixed.

The plugin is still in alpha. The `squash-migrations-into-create-tables` change already says that alpha installs reinstall. This is the cheapest time to fix the type. After release, it needs a data migration on live order tables.

## What Changes

- Change the 12 named date columns from `TIMESTAMP` to `DATETIME`: `carts.expires_at`, `order_coupons.usage_reversed_at`, `orders.paid_at`, `shipped_at`, `cancelled_at`, `fulfilled_at`, `estimated_delivery_date`, `delivered_at`, `archived_at`, and `products.published_at`, `trashed_at`, `scheduled_at`.
- Keep `$table->timestamps();` as it is in the 41 `Create*Table` files. It makes `created_at` and `updated_at` as `TIMESTAMP` today. The owner will change `timestamps()` in the framework so that it creates `DATETIME`. Until then these two columns still have the time zone and 2038 problems.
- Store UTC in every date column. The app already writes UTC through the models. Four bulk `insert()` calls skip the models and would use the database default, which follows the session time zone. They now pass `created_at` and `updated_at` as UTC strings:
  - `SchemaProfilePresets` (`ProductSchema` rows)
  - `AttributeValueService::insert`
  - `CurrencyService::insert` (two branches)
- Add an integration test that fails if a named date column is a `TIMESTAMP`, that a bulk insert stores UTC when the session time zone is not UTC, that a stored time does not move when the session time zone changes, and that a date after 2038 round-trips. The test leaves `created_at` and `updated_at` out until the framework creates `DATETIME`.
- **BREAKING**: an existing alpha install cannot upgrade. This matches the policy in `schema-upgrade-migrations`, so no alter migration is written.

Not changed (left to the developer): how `Date::now()` is called. The code that writes dates through the models already gives UTC, because WordPress sets the PHP default time zone to UTC. This change adds no helper and no guard for it.

Out of scope, to follow later: the framework change to `timestamps()`, and unique indexes on `uuid`, `order_number` and `invoice_number`.

## Capabilities

### New Capabilities
- `utc-datetime-storage`: Every date and time that the plugin declares on its tables is stored as a UTC `DATETIME`, so it does not depend on the database time zone and is not limited to 2038.

### Modified Capabilities

None.

## Impact

- `database/migrations/`: four files change named columns: `CreateCartsTable`, `CreateOrderCouponsTable`, `CreateOrdersTable` and `CreateProductsTable`. The other files, including the 41 that call `timestamps()`, are not changed. `CreateJobsTable` and `CreateFailedJobsTable` store Unix numbers in integer columns, not `TIMESTAMP` values.
- `app/Setup/Presets/SchemaProfilePresets.php`, `app/Services/AttributeValueService.php`, `app/Services/CurrencyService.php`: add UTC timestamps to bulk inserts.
- `tests/Integration/`: one new test file.
- `docs/order-data-and-calculations.md`: one sentence on UTC storage.
- Models and API: no change is expected. The models read and write the same `Y-m-d H:i:s` strings. The coupon dates were already `DATETIME` and are already converted to UTC by the model.
- Existing alpha installs: must reinstall (already the policy).
