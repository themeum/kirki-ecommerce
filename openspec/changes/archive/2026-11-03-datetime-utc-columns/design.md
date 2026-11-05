# Design

## Context

See proposal.md, "Why". Facts found in the code:

- `Structure::timestamps()` in the vendor framework always creates two `TIMESTAMP` columns: `created_at` with `DEFAULT CURRENT_TIMESTAMP`, and `updated_at` nullable. The framework `datetime()` column supports the same `use_current()` default. Edits to vendor code are lost on `composer install`, so the plugin cannot change `timestamps()`.
- 41 of the 43 `Create*Table` files call `$table->timestamps()` and nothing else (no precision argument). The other two, `CreateJobsTable` and `CreateFailedJobsTable`, keep Unix numbers in `unsigned_integer` columns. They are not date columns.
- 12 named columns use `timestamp()`: `carts.expires_at`, `order_coupons.usage_reversed_at`, `orders.paid_at`, `shipped_at`, `cancelled_at`, `fulfilled_at`, `estimated_delivery_date`, `delivered_at`, `archived_at`, and `products.published_at`, `trashed_at`, `scheduled_at`. The coupon `start_datetime` and `end_datetime` are already `DATETIME`, and the `Coupon` model converts them to UTC before saving.
- Writes through a model set `created_at` and `updated_at` in PHP (`Model::update_timestamps` with `Date::now()`), so the database default does not run for them. `BelongsToMany` and `upsert` also write PHP-built UTC strings.
- Bulk `insert()` does not add timestamps. Four call sites rely on the database default: `SchemaProfilePresets` (`ProductSchema` rows), `AttributeValueService::insert`, and the two branches of `CurrencyService::insert`. The dev-only seeders under `database/seeders` do the same, but they run only in dev mode and are out of scope.
- WordPress core sets the PHP default time zone to UTC. So `Date::now()` with no argument returns UTC today.
- The models read dates with `Y-m-d H:i:s` in the PHP default time zone. A `TIMESTAMP` is returned in the session time zone, so a non-UTC session already misreads. A `DATETIME` returns exactly what was stored.
- No application code uses `NOW()`, `UNIX_TIMESTAMP`, `CONVERT_TZ` or `FROM_UNIXTIME`. Analytics compares date columns with UTC `gmdate()` literals, which a `DATETIME` compares as plain values.

## Goals / Non-Goals

**Goals:**
- No named date column has the type `timestamp` after a fresh install.
- Every value the plugin stores in a date column is UTC, including the four bulk inserts.
- A test fails if a `timestamp` column returns, or if a bulk insert depends on the session time zone.

**Non-Goals:**
- An upgrade path for existing alpha installs. The reinstall policy applies.
- Any change to how `Date::now()` is called, and any helper, lint or guard for it. This is the developer's responsibility. WordPress already sets UTC, and the model writes are not changed.
- Changing `$table->timestamps()` in the 41 files, and changing `Structure::timestamps()` in the framework. The owner will make `timestamps()` create `DATETIME` in the framework. Until then `created_at` and `updated_at` stay `TIMESTAMP`.
- Dev-only seeders, the queue tables, and sub-second precision (all columns stay at precision 0).
- Unique indexes. They are a separate change.

## Decisions

### D1. Edit the `Create*` files; write no alter migration

Same reason as `money-columns-bigint`: the squash change set the reinstall policy, and an alter migration would restart a chain that was just deleted.

### D2. Leave `$table->timestamps()` as it is; change only the named columns

The 41 files keep `$table->timestamps();`. The owner will change `timestamps()` in the framework so that it creates `DATETIME` columns, and then every table gets `created_at` and `updated_at` as `DATETIME` without a change here. Replace each of the 12 `timestamp('<name>')` calls with `datetime('<name>')`, keeping `nullable` and `comment`.

- **Alternative: write two explicit `datetime` lines in each of the 41 files.** Tried first, then reverted at the owner's request. It would duplicate a framework change that is coming, and it would have to be undone later.
- **Consequence:** until the framework changes, `created_at` and `updated_at` still move with the session time zone and stop at 2038 (2106 on newer MariaDB). The model writes still store UTC strings, so only a server or session time zone change shifts them.

### D3. The `DEFAULT CURRENT_TIMESTAMP` fallback comes from the framework

`timestamps()` sets the default on `created_at`. This change does not touch it. When the framework creates `DATETIME`, the default needs MySQL 5.6.5 or MariaDB 10.0. That minimum belongs to the framework change.

### D4. Add UTC timestamps at the four bulk insert sites

Each site adds `created_at` and `updated_at` to every row it inserts, computed once per call as `Date::now('UTC')->to_date_time_string()`, the project's own date class with an explicit UTC zone. This is the same form that `to_utc_datetime_string()` in `app/helpers.php` uses, so date handling stays in one place and does not depend on the PHP default time zone.

- **Alternative: an `insert()` override in a shared base model.** Rejected: the models extend the framework `Model` directly, so a new base class and trait would touch all models for four call sites.

**Correction during implementation:** the first version used `gmdate()`. The owner asked for the project's own `Date` class, for consistency and control. The first version also replaced `timestamps()` in 41 files. That was reverted at the owner's request (see D2).

### D5. Test from `information_schema` and under a shifted session time zone

One integration test file does the following:
- Select every column of the plugin tables where `DATA_TYPE = 'timestamp'`, except `created_at` and `updated_at`. The result must be empty. This needs no column list to maintain, and it also catches a named column added later. Remove the exclusion when the framework creates `DATETIME`.
- Set `time_zone = '+07:00'` for the session, run the bulk-insert sites, read `created_at` and `updated_at` back and compare them with the current UTC time. The session time zone is reset in a `finally` block, because the test shares one database connection.
- Save an order with a fixed `paid_at` under UTC, switch the session to `+07:00`, and read the raw value. It must not change. A `TIMESTAMP` column fails this check.
- Save an order with `estimated_delivery_date` of `2040-06-01 12:00:00` and read it back.

## Risks / Trade-offs

- **[A named date column is missed]** → The "no `timestamp` column" test covers every plugin table, so a missed named column fails it.
- **[`created_at` and `updated_at` keep the old problem until the framework changes]** → Accepted by the owner. The framework change is planned. The test exclusion must be removed then, so that the guard covers all columns.
- **[A bulk insert is missed]** → The test covers the four known sites. Code review checks new `insert()` calls. Seeders are dev-only.
- **[`Date::now()` follows the PHP default time zone]** → Accepted and left to the developer. WordPress sets UTC, and the existing writes already depend on it.
- **[Existing alpha installs break]** → Accepted by the reinstall policy. The next alpha release notes should say it.

## Migration Plan

1. Edit the four files that hold the 12 named columns.
2. Patch the three bulk-insert files.
3. Run the new test and the full suites on a fresh database.
4. Reinstall the plugin on any alpha test site (deactivate, drop the plugin tables, activate).

Rollback is a revert of the commit, because no data migration runs.
