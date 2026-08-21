## 1. Establish ground truth

- [x] 1.1 Verify what framework 2.1.15 actually emitted by reading its source at the commit
      `composer.lock` pins (`f168281`). **Done:** `compile_foreign()` emits no `CONSTRAINT` clause
      and ignores the name argument, so all 67 foreign keys are engine-named on alpha.1;
      `Structure::index()`/`unique()` already matched 3.0.3's convention, so indexes and uniques
      never drifted.
- [x] 1.2 Determine the real set of keys whose scheme name exceeds 64 characters by computing names
      against a migrated database. **Done:** five, after the scheme was revised on review to carry
      the full `kirki_ecommerce_` namespace — the four-column coupons index, the collection- and
      attribute-translation uniques, and the two three-column orders status indexes. The earlier
      source-parse false positives were keys already carrying short explicit names such as
      `idx_active_coupons`.
- [x] 1.3 Reproduce the legacy shape. **Done, differently than planned:** rather than committing a
      static `.sql` dump, `SchemaKeyInventoryTest::rewind_to_legacy_shape()` derives it from the live
      schema — recreating every foreign key with no `CONSTRAINT` clause, exactly what 2.1.15 emitted.
      Nothing to keep in sync as the schema evolves, and it exercises the real current tables.
- [x] 1.4 Confirm the rewind produces engine-assigned names. **Done:** the convergence test asserts
      the rewind actually changes the inventory before re-running the migration.

## 2. Key introspection and name derivation

- [x] 2.1 Create `app/Supports/SchemaKeys.php` with `get_tables()` returning only tables matching
      `{wp_prefix}kirki_ecommerce_%`.
- [x] 2.2 Add `get_indexes(string $table)` reading `information_schema.STATISTICS` — name, columns
      ordered by `SEQ_IN_INDEX`, uniqueness — excluding `PRIMARY`. Model the query style on
      `Compiler::compile_database_columns()`.
- [x] 2.3 Add `get_foreign_keys(string $table)` reading `KEY_COLUMN_USAGE` joined to
      `REFERENTIAL_CONSTRAINTS` for `DELETE_RULE`/`UPDATE_RULE`, filtered so only constraints whose
      **child** table is a plugin table are returned.
- [x] 2.4 Add `expected_name(string $table, array $columns, string $type)` implementing
      `{fk|idx|uq}_{table}_{columns}`, the table keeping its `kirki_ecommerce_` namespace, plus
      the override map from 1.2.
- [x] 2.5 Write `tests/Unit/Supports/SchemaKeysTest.php` covering each key type, a multi-column
      index, and the >64-character override.

## 3. The rename migration

- [x] 3.1 Create `database/migrations/AlterSchemaKeysToExplicitNames.php` with a file-level comment
      recording the ordering invariant: it must stay after the last `Create*` and before the first
      `Alter*`, and must never be reordered or edited.
- [x] 3.2 Implement `up()`: per table, enumerate live keys, compute expected names, and skip any
      already correct.
- [x] 3.3 Implement the drop/add sequence in order — drop foreign keys (capturing definitions
      first), then drop indexes including any orphan left under a dropped constraint's name, then
      add indexes, then add foreign keys with the captured references and rules.
- [x] 3.4 Wrap the run in `Schema::disabled_checking_foreign_key_constraints()` /
      `enabled_checking_foreign_key_constraints()` with a `finally`, matching `Migrator::rollback()`.
- [x] 3.5 Implement `down()` as a documented no-op.
- [x] 3.6 Let failures throw rather than swallowing per-table errors.
- [x] 3.7 Register in `config/migrations.php` after the last `Create*` and before the first
      `Alter*`, keeping the existing grouping of `Alter*` at the end.

## 4. Clean up the existing migrations

- [x] 4.1 `AlterCartItemsVariantForeignKeyToCascade`: delete the `information_schema` lookup; drop
      and re-add `fk_kirki_ecommerce_cart_items_variant_id` by name.
- [x] 4.2 `AlterCouponCustomersCompositePrimaryKey`: delete the lookup (it was never needed — that
      index name matched on both populations); drop `idx_kirki_ecommerce_coupon_customers_is_excluded` by
      name; give the index added in `down()` an explicit name.
- [x] 4.3 `ReplaceCartsCustomerIdWithUserId`: delete both lookups; drop `fk_kirki_ecommerce_carts_customer_id`
      and `idx_kirki_ecommerce_carts_customer_id_created_at` by name.
- [x] 4.4 In the same file, name the keys it *creates* — the currently unnamed `user_id` foreign key
      becomes `fk_kirki_ecommerce_carts_user_id`, and `idx_user_carts` becomes
      `idx_kirki_ecommerce_carts_user_id_created_at`. Do the same for the keys its `down()` creates.
- [x] 4.5 Confirm `grep -rn "information_schema\|global \$wpdb" database/migrations/` returns
      nothing.

## 5. Guardrail and verification

- [x] 5.1 Create `tests/Integration/Database/SchemaKeyInventoryTest.php`.
- [x] 5.2 Convergence test: load `legacy-schema.sql`, seed the migration option as if every
      `Create*` had run, run `migrator()->run()`, and assert the resulting key inventory across all
      38 tables is exactly equal to that of a database migrated from empty.
- [x] 5.3 Invariant test: on the from-empty database, assert every index and foreign key name equals
      `SchemaKeys::expected_name(...)`, with a failure message naming the offending table and key.
- [x] 5.4 Semantics test: assert foreign-key referenced tables/columns and `ON DELETE`/`ON UPDATE`
      rules are identical before and after the rename, and specifically that
      `cart_items.variant_id` ends `ON DELETE CASCADE` on both populations.
- [x] 5.5 Idempotency test: re-running the migrator is a no-op, and running the rename migration
      twice leaves the schema unchanged.
- [x] 5.6 Confirm the invariant test actually catches regressions by temporarily adding an unnamed
      key to a migration and checking it fails with the offender named.
- [x] 5.7 Run the full suite. **Done, on both engines:** unit 148/148 pass; integration 222 tests,
      4061 assertions on MariaDB 12.2 *and* on MySQL 8.0.46, with one failure on each —
      `OrderApiTest::test_checkout_guest_order_provisions_customer_from_billing` — confirmed
      **pre-existing** by reproducing it identically on unmodified `HEAD`.
- [~] 5.8 MariaDB 10.4 compatibility. **Verified by inspection, not by running:** no `RENAME INDEX`
      or `IF EXISTS` appears anywhere in `app/` or `database/`, and the framework emits plain
      `DROP FOREIGN KEY` / `DROP INDEX` (`Compiler.php:353-356`). A real 10.4 run is still worth
      doing before release.
- [x] 5.10 Run the integration suite against MySQL 8 as well as MariaDB. **Done:** a `mysql:8.0`
      container was joined to the compose network and the suite pointed at it via `DB_HOST`. This
      is what caught defect 7.4, which `mariadb:latest` accepts silently. Worth wiring into CI.
- [~] 5.9 **Partially done — a real alpha.1 upgrade was run and it failed** (defect 7.4), which is
      exactly what this task existed to find. After the fix, convergence from the legacy shape
      passes on both engines, but the real-database pass has not been repeated. Redo it against the
      restored copy and confirm the site loads and carts, orders and coupons behave normally.

## 6. Document the scheme

- [-] 6.1 **Deliberately skipped.** Documenting the scheme in `CLAUDE.md` was offered during design
      review and declined in favour of the inventory test alone. Left undone rather than added
      silently; say the word and it is a two-minute change.

## 7. Defects found while implementing

- [x] 7.1 `AlterCartItemsVariantForeignKeyToCascade` dropped and re-added the same constraint name in
      one callback. `Compiler::compile_alter` orders additions ahead of drops within a single ALTER,
      so it emitted `ADD CONSTRAINT fk_x …, DROP FOREIGN KEY fk_x` and failed with a duplicate
      constraint name. Split into two statements.
- [x] 7.2 The rename echoed back the `ON DELETE`/`ON UPDATE` rules it read. MySQL and MariaDB report
      an omitted clause as `RESTRICT` but an explicitly written one as `NO ACTION`, so a renamed key
      described itself differently from an identical freshly created one. Default rules are now
      omitted.
- [x] 7.3 InnoDB names a foreign key's auto-created backing index after the constraint, or after the
      column when the constraint is unnamed. Handling only the first case made the two populations
      diverge. `collect_backing_indexes()` now matches both.
- [x] 7.4 **Found by a real alpha.1 upgrade on Local WP, and fatal.** The migration processed one
      table at a time, dropping only the foreign keys declared *on that table*. The unique index on
      `languages.code` is the parent-side index for foreign keys on three other tables, so dropping
      it raised `Cannot drop index 'kirki_ecommerce_languages_code_unique': needed in a foreign key
      constraint`. Restructured into schema-wide phases (Decision 7).

      The suite could not have caught this: measured directly, MariaDB 12.2 permits that drop while
      `FOREIGN_KEY_CHECKS` is off and MySQL 8.0.46 refuses it, and Docker runs `mariadb:latest`
      while Local WP ships MySQL 8. Two follow-ups so it stays caught: the suite now also runs
      against MySQL 8 (5.10), and `test_indexes_are_only_touched_while_no_foreign_key_exists`
      asserts the emitted statement order directly, so the invariant is checked even on the
      permissive engine. Verified by restoring the per-table order and watching only that test fail.
- [x] 7.5 `SchemaKeyInventoryTest::rewind_to_legacy_shape()` had the same per-table flaw and failed
      on MySQL 8 for the same reason. The fixture builder now works in schema-wide phases too.
