## Context

See proposal.md — Why. This design covers only the mechanics of removing the column safely.

Relevant current state:

- `kirki_ecommerce_products.currency_id` is declared `unsigned_big_integer` with no `->nullable()`, so it is `NOT NULL`. It carries an explicit index (`$table->index('currency_id')`) and a named foreign key (`fk_kirki_ecommerce_products_currency_id`) referencing `kirki_ecommerce_currencies(id)` with no `null_on_delete` or cascade clause, so MySQL applies `RESTRICT`.
- The framework generates index names as `{table}_{columns}_index` passed through `format_key_name()`, which only truncates and hashes names over the maximum key length. A foreign key also creates its own backing index under the constraint name.
- The repo already has precedents for each piece: `AlterCartItemsVariantForeignKeyToCascade` drops a foreign key and then its index; `AlterOrdersDropLegacyCouponColumns` drops columns and restores them in `down()`; `AddInvoiceNumberToOrdersTable` drops a named index before its column.

## Goals / Non-Goals

**Goals:**

- Remove the column and its constraints in a single alter migration that is safe on both a fresh install and an upgraded one.
- Keep a working `down()` so the migration is reversible in development.
- Remove the field from every layer in the same change, so no layer is left referencing a column that no longer exists.

**Non-Goals:**

- Preserving the historical value of `currency_id`. It is discarded; nothing reads it, and the proposal establishes that stored amounts were never interpreted through it.
- Changing how money is displayed or computed anywhere. That behavior already reads the base currency and must be unchanged by this work.
- Introducing per-product currency support under a different name. If multi-currency pricing is ever wanted, it is a new design, not a rename of this column.
- Adding a deprecation window for the `currency` response key. See the decision below.

## Decisions

**Drop the column outright rather than making it nullable.**
A nullable vestigial column would resolve the `NOT NULL`/`nullable` mismatch and unblock currency deletion (if the FK were also relaxed), but it leaves the misleading field in place — which is the main reason for the change. Alternative considered: keep the column and merely relax the constraints. Rejected because it preserves the trap for future readers while still requiring a migration.

**Drop the foreign key first, then the index, then the column.**
MySQL refuses to drop a column still covered by a foreign key, and dropping the FK leaves its backing index behind. Ordering is therefore FK → index → column, matching `AlterCartItemsVariantForeignKeyToCascade`. Note there may be two index entries to consider: the explicit `currency_id` index and the FK's own backing index. The implementation should inspect the live table (or attempt each drop defensively) rather than assume exactly one exists — the explicit index name should be derived through the framework's own naming (`{table}_currency_id_index` via `format_key_name`) instead of being hardcoded from memory.

**Make `down()` restore the column as nullable, not `NOT NULL`.**
A reversal cannot invent a valid currency for existing rows, and re-adding a `NOT NULL` column with a foreign key to a populated table would fail. `down()` therefore restores `currency_id` as a nullable column with its index and foreign key. This is an intentional asymmetry with `up()`: the migration is reversible in shape, not in data.

**Remove the `currency` key from `ProductResource` without a deprecation window.**
Alternative considered: keep emitting `currency` for a release, sourced from the store's base currency. Rejected — it would be a second lie (a per-product field that is really a store-level value), and at `1.0.0-alpha.4` there is no stability promise to honor. The break is instead called out explicitly in the proposal's Impact so it reaches release notes.

**Remove the form field rather than leaving it unsubmitted.**
`product-form.ts` maps `currency_id: values.currency?.id ?? null`. Leaving a form field whose value is never sent is exactly the kind of dead weight this change removes, so the `currency` field and `ProductCurrencySchema` go together with the mapping. `schemas/catalog/app-config.ts` keeps its own currency shape — it documents in a comment that it deliberately duplicates `ProductCurrencySchema` rather than importing it, so removing the product-side schema does not affect it.

## Risks / Trade-offs

**An external consumer reads `product.currency` from the REST API** → Unavoidable for a breaking removal. Mitigated by stating it as **BREAKING** in the proposal and by the pre-1.0 version. Consumers move to `/app-config`'s `base_currency`, which is the value they actually wanted.

**The migration fails partway on a site where the FK or index name differs** (e.g. a site whose schema predates the named-key migration, `AlterSchemaKeysToExplicitNames`) → Make each drop tolerant of an already-absent key rather than assuming a fixed name, and verify against a database that has run the full migration sequence from scratch as well as one upgraded from an earlier version.

**Data loss is irreversible in practice** → Accepted deliberately. `down()` restores the column shape but not its values. This is sound only because the values are meaningless; that premise is the proposal's central claim and should be re-confirmed before implementing, not assumed from this document.

**A missed reference leaves a write path targeting a dropped column** → `Product::$fillable` and the DTOs are the risky ones, since mass assignment fails loudly only when the column is gone. The task breakdown removes all layers in one change, and the product create/update/duplicate paths should be exercised after the migration runs.

## Migration Plan

1. Apply the alter migration on a database that has run the full migration sequence from scratch.
2. Apply it on a database upgraded from an earlier plugin version, to confirm the FK and index names resolve on both paths.
3. Exercise product create, update, and duplicate, plus the product list and detail endpoints, to confirm no layer still writes or reads the column.
4. Delete a currency that was previously the base and is still referenced by older products — the case that fails today — to confirm it now succeeds.

Rollback: run the migration's `down()`, which restores `currency_id` as a nullable column with its index and foreign key. Prior values are not recovered.
