## Why

`v1.0.0-alpha.1` shipped on `themeum/framework` 2.1.15. Its schema compiler emitted foreign keys as
`FOREIGN KEY (col) REFERENCES ...` with **no `CONSTRAINT` clause at all** — the name argument was
accepted by `Structure::foreign()` and then silently ignored by `Compiler::compile_foreign()`. Every
foreign key on an alpha.1 site is therefore named by the database engine as `{table}_ibfk_n`,
**including the 33 that the migrations explicitly name**. Framework 3.0.3 emits the `CONSTRAINT`
clause, so a fresh alpha.2 install gets the requested name, or a generated
`{table}_{column}_foreign` when none was given.

One source tree consequently produces two different databases, and any migration that drops a
foreign key by name fails on exactly one of them. Verified against the 2.1.15 source: indexes,
unique keys, and primary keys do **not** drift — 2.1.15 already used the same
`{table}_{columns}_index` convention and honoured explicit names, so those are identical on both
populations.

The root cause is that constraint names were never decided by this project. The engine or the
library decided them, invisibly, and a library upgrade silently changed the mapping. Until the
project owns those names, every future alter migration carries the same hazard, and the current
workaround — raw `information_schema` lookups inlined into three migrations — must be hand-repeated
each time.

## What Changes

- Introduce a single rename-only migration that gives every index, unique key, and foreign key on
  every plugin table an explicit, project-owned name following one uniform scheme:
  `{fk|idx|uq}_{table}_{columns}`. It reads each key's live definition and re-creates it under
  the computed name, so uniqueness, referenced table/column, and `ON DELETE`/`ON UPDATE` rules are
  carried across verbatim — only names change.
  - **Foreign keys** are the correctness fix: all 67 are currently engine-named on alpha.1.
  - **Indexes and uniques** are renamed for consistency, not correctness. They already match across
    populations; renaming them collapses the four naming styles now in use
    (`fk_kirki_ecommerce_cart_items_variant_id`, `fk_refunds_order_id`, `idx_fraud_detection`, and
    library-generated) into one predictable rule.
- Add a single home for database key introspection so no migration inlines `information_schema` SQL
  again, and so the migration and its guardrail test derive expected names from the same code.
- Remove the `information_schema` workarounds from `AlterCartItemsVariantForeignKeyToCascade`,
  `AlterCouponCustomersCompositePrimaryKey`, and `ReplaceCartsCustomerIdWithUserId`. Two of the
  three were solving a problem that never existed — the index lookups in the latter two were
  unnecessary, since index names always matched across populations.
- Name the keys those same migrations *create* — `ReplaceCartsCustomerIdWithUserId` currently adds
  an unnamed foreign key on `user_id` and an unnamed index in `down()`, reproducing the very bug
  being fixed.
- Add a guardrail test asserting every key in a fully migrated database carries its expected scheme
  name, so any future migration that omits a name fails CI by name.

Not a **BREAKING** change: no column, table, or referential behaviour changes — only identifiers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `schema-upgrade-migrations`: adds requirements that every schema key carry an explicit
  project-owned name, that upgraded and freshly installed databases converge to identical key names,
  and that a migration renaming keys preserve referential semantics exactly.

## Impact

- **New**: `app/Supports/SchemaKeys.php`, `database/migrations/AlterSchemaKeysToExplicitNames.php`.
- **Modified**: `config/migrations.php` (registers the new migration after the last `Create*` and
  before the first `Alter*` — a load-bearing position), and the three migrations currently carrying
  `information_schema` workarounds.
- **Tests**: a legacy-schema fixture reproducing alpha.1's engine-named foreign keys, plus unit
  coverage for name derivation and an integration test asserting the full key inventory.
- **Not affected**: no framework change — `themeum/framework` stays at 3.0.3. No application code,
  REST API, or admin UI change. No data migration.
- **Risk surface**: DDL runs against live customer databases; MySQL DDL is not transactional, so the
  migration is written to be idempotent and resumable. Renaming indexes as well as foreign keys is a
  deliberate cost accepted for naming uniformity.
