## Why

Five tables (`kirki_ecommerce_carts`, `kirki_ecommerce_coupon_customers`, `kirki_ecommerce_coupons`, `kirki_ecommerce_shipping_profiles`, `kirki_ecommerce_tax_profiles`) had their `Create*Table` migrations edited directly on `dev` to reflect a new schema shape. Those edits are invisible to any site that already ran the original migrations: the migration runner tracks completion by class name in a WP option, so an already-applied `CreateCartsTable` never re-runs, and an existing install's schema silently diverges from what the updated `Create*Table` file now describes. Merging `dev` into `main` and releasing would leave existing users on the old schema while new code assumes the new one, breaking reads/writes against the changed columns, keys, and foreign keys. This needs to land before the next release that merges `dev` into `main`.

Separately, native database `enum` columns require an alter migration every time a new allowed value is added — exactly the kind of change this proposal is already building tooling for. The project has decided to stop using `enum` columns going forward in favor of `string` columns with the allowed values documented in a column comment, so adding a value becomes an application-level change rather than a schema migration. This proposal is the natural place to also convert every existing `enum` column in the codebase (14 columns across 5 tables) to that shape, since it's already introducing the first alter migrations this codebase has ever had.

## What Changes

- Revert the five edited `Create*Table.php` files back to their `main`-branch (originally-released) shape, and add alter migrations (the first ones in this codebase — no prior precedent) that carry the full delta forward, appended to `config/migrations.php` directly after each table's `Create*Table` entry. This way fresh installs and upgrading installs both replay the identical migration sequence — `Create*Table` (original shape) then the alter migration (delta) — and converge on the same schema, instead of two independent paths that would have to separately agree:
  - `kirki_ecommerce_carts`: drop `customer_id` (with its FK to `kirki_ecommerce_customers.id` and `idx_customer_carts`) and add a fresh `user_id` column (with a new FK to `users.ID`, cascade on delete, and `idx_user_carts` on `(user_id, created_at)`) — a drop+add, not a rename, since the two columns reference different ID spaces (a plugin customer record vs. a WordPress user) and carrying old values forward under the new column would either be meaningless or violate the new foreign key outright. **BREAKING**: any existing cart's `customer_id` association is dropped, not remapped — carts are ephemeral/expiring by design, so this is treated as acceptable data loss.
  - `kirki_ecommerce_coupon_customers`: drop the composite primary key `(coupon_id, customer_id)` and the standalone `is_excluded` index; add the new composite primary key `(coupon_id, customer_id, is_excluded)`.
  - `kirki_ecommerce_coupons`: add `target_country_type` (string, default `all-countries`); drop `customer_eligibility` and `exclude_customers`; add `customer_include_eligibility` (string, default `everyone`) and `customer_exclude_eligibility` (string, default `none`) — all three added as `string` with allowed values documented in a comment, not as `enum`, per the enum-to-string decision below. Also updates `target_countries`' comment to describe its widened shape (`'Array of {country, states} regions as JSON'`, previously `'Array of country codes as JSON'`). **BREAKING**: any existing coupon's customer-eligibility configuration resets to the new defaults — no value mapping from the old columns, per product decision (these columns didn't carry meaningful behavior in the prior release).
  - `kirki_ecommerce_shipping_profiles`: add `is_default` (boolean, default `0`). No backfill of an existing default row.
  - `kirki_ecommerce_tax_profiles`: add `is_default` (boolean, default `0`). No backfill of an existing default row.
- The five `Create*Table.php` files revert to their `main`-branch content; the new alter migrations become the sole source of the schema delta for both fresh and upgrading installs.
- Convert every native `enum` column in the codebase to a `string` column with the allowed values documented via `->comment()`, preserving each column's current default and nullability. This spans tables beyond the five above — it's a repo-wide policy change bundled into this proposal rather than a separate one, since it needs the same alter-migration mechanism:
  - `kirki_ecommerce_coupons`: `method`, `discount_type`, `discount_target`, `discount_value_type`, `eligible_item_type`, `spend_condition_type` (the 6 pre-existing enum columns, unrelated to the dev/main diff above).
  - `kirki_ecommerce_addresses`: `type`.
  - `kirki_ecommerce_attributes`: `type`.
  - `kirki_ecommerce_scheduler_jobs`: `status`.
  - `kirki_ecommerce_refunds`: `status`, `refund_type`.

## Capabilities

### New Capabilities
- `schema-upgrade-migrations`: Defines how the plugin evolves an existing installation's database schema across releases via versioned alter migrations, so upgrading the plugin never leaves a site's schema out of sync with the code that runs against it.

### Modified Capabilities
_(none — no existing spec covers database schema migration behavior)_

## Impact

- New files under `database/migrations/` (PSR-4, one class per file), registered in `config/migrations.php` after their corresponding `Create*Table` entries.
- `database/migrations/CreateCartsTable.php`, `CreateCouponCustomersTable.php`, `CreateCouponsTable.php`, `CreateShippingProfilesTable.php`, and `CreateTaxProfilesTable.php` revert to their `main`-branch content.
- Runtime schema of the five tables in the dev/main diff, on any site that upgrades from a pre-change version, and on any fresh install (via the create-then-alter sequence).
- Runtime schema of `kirki_ecommerce_addresses`, `kirki_ecommerce_attributes`, `kirki_ecommerce_scheduler_jobs`, and `kirki_ecommerce_refunds` — tables otherwise untouched by the dev/main diff, affected only by the enum-to-string conversion.
- No API or frontend changes. Any application code that reads these columns as PHP enum-backed values or relies on the database column type being `enum` is out of scope to audit here — see design.md's Risks.
