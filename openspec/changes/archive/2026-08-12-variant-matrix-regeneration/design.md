## Context

See `proposal.md` — Why. Constraints that shape the approach:

- **The frontend owns combination generation.** There is no cartesian-product logic anywhere in `app/` or `database/`; the backend trusts whatever variant array it receives. `UpdateProductAction` reconciles purely by id: id present → update, id absent → insert, id in DB but not in the payload → **hard delete** (`VariantRepository::bulk_delete` is `where_in(...)->delete()`, no soft delete). Variant identity is therefore decided entirely by which ids the frontend chooses to echo back.
- **The wire format already round-trips.** `VariantResource` emits `attribute_values` as a flat `int[]` of value ids — exactly the shape the request expects. No contract change is needed to fix the bug.
- **Value ids are globally unique** and each belongs to exactly one attribute (`kirki_ecommerce_attribute_values` has an `attribute_id` FK and `unique(attribute_id, value)`). A combination expressed as a bare `int[]` is therefore unambiguous, which is what makes set-based matching sound.
- **The variant↔value pivot has no `ordering` column**, unlike the product pivots. Value order within a variant is not persisted, so nothing may depend on the order of `attribute_values` as returned by the API.
- `variants.sku` is globally `unique()` and nullable. Multiple `NULL`s are permitted; multiple `''` are not. The form schema's transform already maps `sku || null`, so blank SKUs are safe.

## Goals / Non-Goals

**Goals:**

- One pure, unit-testable function that maps (attributes, previous attributes, variants) to the next grid, with every attribute mutation routed through it.
- The frontend is a correct-by-construction producer of the matrix; the backend validates rather than repairs.
- No merchant data is destroyed without an explicit confirmation.

**Non-Goals:**

- Soft-deleting or archiving discarded variants. Deletion stays immediate on save; the confirmation prompt is the only safeguard.
- Reworking the variation table's editing model (`updateVariants`'s untyped `key`/`value` channel, the `in_stock` string/boolean coercion, index-based row addressing). Only the hook-order crash is fixed here.
- Covering `PUT /variants/bulk`, which is a second writer outside `ProductUpdateRequest`. See Risks.
- Persisting attribute-value ordering on the variant pivot.

## Decisions

### Claim/fill instead of exact-set matching

Two passes over the generated combinations:

1. **Claim.** Each saved variant, in array order, takes the first unclaimed combination it is compatible with, keeping its id and every field. Compatibility: for each value the variant holds whose attribute is still present, the combination must hold that same value; values whose attribute was removed entirely impose no constraint.
2. **Fill.** Each unclaimed combination is generated from the surviving variant sharing the most values with it.

*Why:* one rule covers add-attribute, remove-attribute, add-value, remove-value, reorder, and both simple↔variant transitions. Equal-length value sets reduce to exact equality, so the no-change case is a strict preservation. Reorder is order-insensitive because matching is set-based.

*Alternatives rejected:* regenerating from scratch (current behaviour — destroys all data); broadcasting the ancestor's stock and SKU to every descendant (duplicates SKUs against a unique index and inflates sellable stock).

### `previousAttributes` is a required input

The claim predicate must distinguish two situations that look identical from the new attribute list alone — a value that is gone because **its attribute was removed** (no constraint; the variant collapses onto a shorter combination) versus a value that is gone because **it was removed from a surviving attribute** (a hard constraint; the variant must be discarded).

Without the previous list, a variant holding a deleted value would match every combination as a wildcard and could claim a slot belonging to a legitimate variant — e.g. removing Green from Color would let the Green variant claim Blue's combination and delete Blue. Passing the previous attribute list makes each value's owning attribute resolvable, so the two cases separate cleanly. Both callers hold the previous list already.

*Alternative rejected:* deriving the owning attribute from the union of old and new attributes without an explicit parameter — same information, but implicit and unavailable when the caller replaces the whole list at once.

### Inheritance is split by field semantics, not by convenience

Generated variants inherit pricing, weight, tax/shipping profiles, visibility and **media**, but not identity or stock. Media is inherited because Red/S and Red/M genuinely share the Red photograph. Stock is not, because inheriting it converts 40 real units into 40 units per generated row — the storefront would oversell with no audit trail. `committed_quantity` is derived from open orders and is meaningless on a row that has never been ordered. SKU and barcode must be blank against the unique index.

### A pure module plus a hook, not a reducer

`variant-matrix.ts` holds the algorithm with no React import, so every scenario in the spec is a plain unit test. `use-variant-matrix.ts` owns the single write path — the three `setValue` calls for `attributes`, `variants` and `has_variants` — reading form state fresh on each call.

*Why:* today those three calls are duplicated across `attribute-list.tsx` and `add-or-edit-attribute.tsx`, and the latter snapshots `getValues('attributes')` once at render, so an edit applied after another attribute changed reverts it. Centralising fixes that by construction, and the confirmation logic is written once rather than per call site.

*Alternative rejected:* a reducer + context. React Hook Form is already the source of truth; a reducer would duplicate it and its sync effect would race `form.reset(result)` after a successful save.

### The backend validates the invariants the frontend guarantees

Adding integrity rules to `ProductCreateRequest`/`ProductUpdateRequest` turns silent corruption into a 422. The most valuable of these is making `attribute_values` required on update when the product has attributes: today it is `array|nullable`, and `VariantService::update` calls `sync($data->attribute_values)` unconditionally, so **any client that echoes variants back without that key detaches every pivot row**. The repo's own test helper does exactly this.

`has_variants` is separately corrected: both product actions assign `count($attributes)` — an int — to a boolean column, and discard the client's value. It becomes `count(...) > 0`.

### The `is_default` rule normalizes on load rather than backfilling

Requiring exactly one default is the strictest rule here, and the old code violated it: `getDefaultVariantValues()` sets `is_default: true` and the clone copied it, so every multi-variant product this UI produced marked every row default. A merchant editing only the title would get a 422 with no UI to fix it — there is no `is_default` control in the variation table.

A data migration was drafted to backfill those rows and then dropped: the plugin is pre-release, so there is no stored product predating the rule and nothing to migrate.

`mapProductToFormValues` still normalizes `is_default` on load. That is not legacy cover — `PUT /variants/bulk` writes variants outside `ProductUpdateRequest` and is not covered by the new validation, so the form can still be handed a product with zero or several defaults. Normalizing on load means it heals that instead of 422-ing on a field the merchant cannot see.

### The confirmation reuses `ConfirmationDialog` unchanged

Its `subtitle` is a plain string, so the warning is a summary sentence naming the count and combinations rather than a bulleted list. The `product-variations-card` spec explicitly forbids modifying a shared primitive to reach a design.

## Risks / Trade-offs

- **`PUT /variants/bulk` bypasses the new validation** → it writes variants directly, outside `ProductUpdateRequest`, so it can still desync the matrix. Out of scope here; the product form's own payloads are fully covered, and normalize-on-load means the form heals whatever it is given.
- **The `is_default` rule could 422 a product written outside this form** (`PUT /variants/bulk` is not covered by the new validation) → normalize-on-load in `mapProductToFormValues` absorbs it; the form cannot submit an invalid default set regardless of what it loaded.
- **Discarded variants are hard-deleted with no undo** → the confirmation prompt is the only safeguard, and nothing is deleted until the merchant saves. Accepted deliberately; soft-delete is a Non-Goal.
- **Adding an attribute silently gives new combinations zero stock** → correct, but a merchant who expected stock to carry over sees 0 across the new rows. This is the same trade-off Shopify makes and is preferable to overselling.
- **Claim order is array order** → for an unmodified product the arrays already agree, so this is stable; it only becomes observable when several saved variants collapse onto one combination, where "earliest wins" is the specified rule.

## Migration Plan

None. No schema or data migration ships with this change: the plugin is pre-release, so no stored product predates the new integrity rules. Rollback is reverting the release, which removes the validation and leaves the data untouched.

## Open Questions

None. Every branch was resolved before implementation: preservation rule, collapse rule, inherited field set, warning threshold, code structure, backend strictness, and the legacy backfill strategy.

## Corrections during implementation

- **The PHP integration suite was already red before this change** — 34 failures out of 167 on a clean `dev`. `CreateVariantDTO::$committed_quantity` defaults to `null` while `kirki_ecommerce_variants.committed_quantity` is `NOT NULL DEFAULT 0`, so *every* product create 500s under the test container's strict-mode MariaDB. That blocked four of this change's five new integration tests before they could reach an assertion. Fixed here as a one-line DTO default (`null` → `0`, matching the column's own default), explicitly authorized as a scope exception. Result: 22 failures out of 172, with **zero product or variant failures** remaining — the rest are coupon, customer, order and cart tests failing for unrelated reasons.
  - The sibling field `available_quantity` has the identical null-vs-NOT-NULL mismatch and was deliberately left alone: it only escapes today because every current caller sends it. Flagged separately rather than widened into this change.

- `openspec/project.md` and this schema's `context` both state that Vitest is "scoped to `schemas/**/*.test.ts`". That describes where tests currently live, not a config restriction — `resources/app/vitest.config.ts` uses `include: ['**/*.test.ts']` repo-wide. The co-located `pages/products/variant-matrix.test.ts` therefore runs without a config change; it is simply the first non-schema test file.
