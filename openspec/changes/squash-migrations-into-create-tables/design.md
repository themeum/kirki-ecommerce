## Context

See proposal.md, "Why". Constraints that shape how this is done:

- **Applied migrations are tracked by class name** (`MigrationRepository` stores them in a WordPress option, and `Migrator::run()` skips any class already recorded). That is why rewriting a `Create*` class in place cannot reach existing installs, and why the change depends on the "fresh install only" decision.
- **Many keys in today's `Create*` files have no name.** Column modifiers such as `->unique()`, `$table->index('slug')`, and `$table->foreign('created_by')` come with no name, and some composite indexes carry ad-hoc names like `idx_customer_orders` or `idx_active_coupons`. On beta.1 every one of these ends up with a scheme name only because `AlterSchemaKeysToExplicitNames` renames them afterwards. Once that migration is deleted, each key has to be named in its `Create*` file.
- **`Structure` signatures**: `primary($keys, $key_name = null)`, `unique($keys, $key_name = null)`, `index($keys, $key_name = null)`, `foreign(string $column, $name = null)`. The `->unique()` column modifier takes no name, so every unique has to be written as a table-level `$table->unique('col', 'uq_…')` call.
- **The framework puts additions before drops in one ALTER** (noted in `AlterCartItemsVariantForeignKeyToCascade`). This no longer matters because nothing is altered, but it explains why several alters were split into two `Schema::table` calls. Don't copy that pattern into a create.
- **The current end state is spread over 30 files.** For each table, the target is what the beta.1 chain produces, minus the five duplicate indexes.

## Goals / Non-Goals

**Goals:**
- Each `Create*` produces, on its own, the beta.1 shape of its table: same columns, types, lengths, nullability, defaults, comments, index column sets, uniqueness, primary keys, and FK targets and rules.
- Every non-primary key is named literally in source under the `kecom` scheme.
- A machine-checked before/after diff demonstrates the first goal.

**Non-Goals:**
- Changing any column's type, default, or semantics. The only intended schema difference is the five dropped duplicate indexes.
- Removing `products.currency_id`. That belongs to `remove-product-currency-id`.
- Any upgrade or reset path for existing installs.
- A committed test that checks key names. The user chose to drop that guard. The naming rule lives in the spec and in review.
- Changing seeders, except where one references a dropped table or column (none expected; confirm during apply).

## Decisions

### D1. Fold per table, writing the end state by hand

For each table, read its `Create*` together with every later migration that touches it, in `config/migrations.php` order, and write the resulting definition into the `Create*`. Alters that touch each table:

| Table | Folded migrations |
|---|---|
| addresses | AlterAddressesTypeColumnToString, AlterAddressesTableForAddressBook (final `type` default `home`, comment `home, office, others`; adds `label`, `is_default_shipping`, `is_default_billing`) |
| attributes | AlterAttributesTypeColumnToString |
| carts | ReplaceCartsCustomerIdWithUserId (`customer_id` and its FK/index replaced by `user_id` → `users.ID` cascade, index `(user_id, created_at)`), AlterCartsDropDiscountDetails |
| cart_items | AlterCartItemsVariantForeignKeyToCascade (`variant_id` FK becomes `cascade_on_delete`) |
| coupons | AlterCouponsEligibilityColumns, AlterCouponsEnumColumnsToString |
| coupon_customers | AlterCouponCustomersCompositePrimaryKey (PK `(coupon_id, customer_id, is_excluded)`, `is_excluded` index removed) |
| customers | DropIsBillingSameAsShippingFromCustomersTable |
| orders | DropIsBillingSameAsShippingFromOrdersTable, then AddIsBillingSameAsShippingFromOrdersTable (net: the column exists, `boolean default false`, after `shipping_company`), AddInvoiceNumberToOrdersTable, AlterOrdersDropLegacyCouponColumns, AlterOrdersAddShippingTaxColumns, AlterOrdersAddIsTaxInclusiveColumn |
| order_items | AlterOrderItemsDropTaxColumns, AlterOrderItemsAddRegularPriceColumns |
| products | AddPublishedAtAndTrashedAtToProductsTable, AddRibbonColorToProductsTable, AddScheduledAtToProductsTable |
| refunds | AlterRefundsEnumColumnsToString |
| shipping_profiles | AddIsDefaultToShippingProfilesTable |
| tax_profiles | AddIsDefaultToTaxProfilesTable |
| variants | AddLowStockThresholdToVariantsTable |
| coupon_usage, scheduler_jobs | Created and then dropped. Delete both `Create*` and `Drop*`. |

Each alter's `->after(...)` hint shows the column's logical position, so use it to place the column inside the create.

*Alternative considered*: generate creates from a `SHOW CREATE TABLE` dump of a migrated database. Rejected because it loses the framework's idiom (`id()`, `timestamps()`, `boolean()`), and comments would come out mangled. Hand-writing plus a mechanical diff gives readable files with the same guarantee.

### D2. Key naming: `{fk|uq|idx}_kecom_{table}_{columns}`

`{table}` drops both the WP prefix and `kirki_ecommerce_`; `{columns}` is the index columns in order, joined with `_`. Examples: `fk_kecom_brands_created_by`, `uq_kecom_brands_slug`, `idx_kecom_orders_order_status_payment_status_created_at`.

Under this scheme exactly one name goes over 64 characters: the coupons `(is_active, start_datetime, has_end_datetime, end_datetime)` index, at 72. It becomes `idx_kecom_coupons_active_window`, the same short form beta.1 already uses. The four other beta.1 overrides fit now and take their derived names. A rename suffices for the ad-hoc names (`idx_customer_orders`, `idx_active_coupons`, `idx_fraud_detection`, …), since only names change and column sets stay the same.

Primary keys: pass no name. The engine ignores it, and the spec exempts primaries. This also removes the misleading `pk_kirki_ecommerce_coupon_customers` literal.

*Alternatives considered*: keeping `kirki_ecommerce` in names (the user preferred the shorter `kecom`), and the Laravel-style `{table}_{cols}_index` suffix (rejected as a third scheme).

### D3. FK backing indexes are not declared separately

When a column has an FK and no index that leads with it, MySQL/MariaDB creates a backing index named after the constraint (`fk_kecom_…`), and that already satisfies the scheme. Where today's create declares an explicit `index('x')` and also `foreign('x')`, the explicit index stays (named `idx_kecom_…_x`) and the FK uses it. This matches the shape the beta.1 rename migration leaves behind, so the diff stays clean. Do not add or remove indexes beyond D4.

### D4. Drop the five duplicate plain indexes

Remove `$table->index('slug')` from brands, categories, collections, and products, and `$table->index('code')` from languages. The `uq_` key on the same column serves every equality lookup (for example `SiteController` `where('slug', …)`) and the translation-table FKs onto `languages.code`. The verification diff lists exactly these five as expected differences.

### D5. Registry order: FK dependency order, no section comments

`config/migrations.php` becomes one flat list of 43 `Create*` classes (45 minus coupon_usage and scheduler_jobs). Every referenced table comes before the tables that reference it. The current Create* block already gets this right for the original creates. `CreateCartCouponsTable`, `CreateOrderCouponsTable`, `CreateOrderItemCouponsTable`, and `CreateOrderTaxesTable` move up next to their parents, and `CreateJobsTable` and `CreateFailedJobsTable` go at the end. The "Since vX" release comments and the ordering-invariant comment are removed, since they described upgrade batches that no longer exist.

### D6. `TestMigrator::fresh()` lists tables itself

It currently calls `SchemaKeys::get_tables()`. Inline the same `information_schema.TABLES … LIKE {prefix}kirki_ecommerce_%` query, returning full table names. This is the only non-migration consumer of `SchemaKeys`, so after this the class can be deleted along with `tests/Unit/Supports/SchemaKeysTest.php` and `tests/Integration/Database/SchemaKeyInventoryTest.php`.

### D7. Verification by schema snapshot diff (scratchpad only)

A PHP or WP-CLI snippet, run inside the docker `wpcli` container, dumps a normalized JSON snapshot of every `{prefix}kirki_ecommerce_%` table:

- columns: `name, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, COLUMN_COMMENT`, sorted by name (order ignored per the user's choice)
- primary key column list
- non-primary indexes as `(unique, [columns])` tuples, with names left out
- FKs as `(column, referenced_table, referenced_column, DELETE_RULE, UPDATE_RULE)`, with names left out
- table list, plus `ENGINE` and `TABLE_COLLATION`

Steps: (1) on the current tree, wipe the plugin tables and migration option, run all migrations, save `before.json`. (2) After the squash, do the same and save `after.json`. (3) Diff. The only allowed difference is the five plain `slug`/`code` indexes. A second pass dumps names only and checks each one against the scheme regex `^(fk|uq|idx)_kecom_[a-z_]+$`, length ≤ 64, plus the single `active_window` override.

The script stays in the scratchpad and is not committed (user decision).

## Risks / Trade-offs

- [A folded column ends up with a slightly different default, comment, or length, e.g. the `addresses.type` default flipping between `billing` and `home`] → D7's diff compares `COLUMN_TYPE`, `COLUMN_DEFAULT`, and `COLUMN_COMMENT` exactly.
- [An FK grows an extra backing index, or loses one, because the index layout in the create differs from what the rename migration produced] → D7 compares index column sets, so an extra or missing index shows up.
- [A beta tester reactivates this build over a beta.1 database: `Create*` are already recorded, so nothing runs and the schema is stale] → Accepted (proposal: BREAKING). The release notes tell users to reinstall fresh. No code guard, since the user ruled out backward compatibility.
- [`remove-product-currency-id` still describes an alter migration and old key names] → Follow-up task to amend that change once this one lands.
- [Without the inventory test, a future unnamed key can slip in] → Accepted by the user. The spec states the rule, and review enforces it.

## Migration Plan

No data migration. Deploy = ship the build. To move a test site off an earlier build, deactivate the plugin, drop the `kirki_ecommerce_*` tables and the plugin's migration-history option (or use the plugin's own fresh/uninstall path), then reactivate. Rollback = reinstall the previous build the same way.
