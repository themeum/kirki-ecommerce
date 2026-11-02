## Context

See proposal.md — Why. This design covers only the mechanics of removing the column safely.

Relevant current state:

- `kirki_ecommerce_products.currency_id` is declared `unsigned_big_integer` with no `->nullable()`, so it is `NOT NULL`. It carries an explicit index (`idx_kecom_products_currency_id`) and a named foreign key (`fk_kecom_products_currency_id`) referencing `kirki_ecommerce_currencies(id)` with no `null_on_delete` or cascade clause, so MySQL applies `RESTRICT`.
- Since `squash-migrations-into-create-tables`, `database/migrations/` holds only `Create*` migrations, and until the first stable `1.0.0` release a schema change edits the table's create migration directly (`schema-upgrade-migrations`). Pre-release installs are not upgraded in place.

## Goals / Non-Goals

**Goals:**

- Remove the column, its index, and its foreign key from `CreateProductsTable`, so a fresh install never creates them.
- Remove the field from every layer in the same change, so no layer is left referencing a column that no longer exists.

**Non-Goals:**

- Preserving the historical value of `currency_id`. It is discarded; nothing reads it, and the proposal establishes that stored amounts were never interpreted through it.
- Changing how money is displayed or computed anywhere. That behavior already reads the base currency and must be unchanged by this work.
- Introducing per-product currency support under a different name. If multi-currency pricing is ever wanted, it is a new design, not a rename of this column.
- Adding a deprecation window for the `currency` response key. See the decision below.

## Decisions

**Drop the column outright rather than making it nullable.**
A nullable vestigial column would resolve the `NOT NULL`/`nullable` mismatch and unblock currency deletion (if the FK were also relaxed), but it leaves the misleading field in place — which is the main reason for the change. Alternative considered: keep the column and merely relax the constraints. Rejected because it preserves the trap for future readers.

**Edit `CreateProductsTable` instead of adding an alter migration.**
Delete the `currency_id` column, the `idx_kecom_products_currency_id` index, and the `fk_kecom_products_currency_id` foreign key from the create migration. Alternative considered: an `AlterProductsDropCurrencyId` migration that drops FK → index → column with a nullable `down()`. Rejected because the pre-release policy in `schema-upgrade-migrations` forbids alter migrations until the first stable release, and no pre-release install is upgraded in place.

**Remove the `currency` key from `ProductResource` without a deprecation window.**
Alternative considered: keep emitting `currency` for a release, sourced from the store's base currency. Rejected — it would be a second lie (a per-product field that is really a store-level value), and at `1.0.0-alpha.4` there is no stability promise to honor. The break is instead called out explicitly in the proposal's Impact so it reaches release notes.

**Remove the form field rather than leaving it unsubmitted.**
`product-form.ts` maps `currency_id: values.currency?.id ?? null`. Leaving a form field whose value is never sent is exactly the kind of dead weight this change removes, so the `currency` field and `ProductCurrencySchema` go together with the mapping. `schemas/catalog/app-config.ts` keeps its own currency shape — it documents in a comment that it deliberately duplicates `ProductCurrencySchema` rather than importing it, so removing the product-side schema does not affect it.

## Risks / Trade-offs

**An external consumer reads `product.currency` from the REST API** → Unavoidable for a breaking removal. Mitigated by stating it as **BREAKING** in the proposal and by the pre-1.0 version. Consumers move to `/app-config`'s `base_currency`, which is the value they actually wanted.

**A pre-release site keeps the column after updating the plugin** → Expected: pre-release builds require a fresh install, so the column only disappears on reinstall. Code stops reading and writing it in the same change, so a stale column is harmless apart from still blocking currency deletion until the reinstall.

**Data loss is irreversible in practice** → Accepted deliberately. This is sound only because the values are meaningless; that premise is the proposal's central claim and should be re-confirmed before implementing, not assumed from this document.

**A missed reference leaves a write path targeting a dropped column** → `Product::$fillable` and the DTOs are the risky ones, since mass assignment fails loudly only when the column is gone. The task breakdown removes all layers in one change, and the product create/update/duplicate paths should be exercised after the migration runs.

## Migration Plan

1. Run the migrations from scratch and confirm `kirki_ecommerce_products` has no `currency_id` column, index, or foreign key.
2. Exercise product create, update, and duplicate, plus the product list and detail endpoints, to confirm no layer still writes or reads the column.
3. Delete a currency that was previously the base and is still referenced by older products — the case that fails today — to confirm it now succeeds.

Rollback: reinstall the previous build fresh. Prior values are not recovered.
