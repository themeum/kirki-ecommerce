## Why

Editing a product's attributes destroys the merchant's saved variant data. `createVariantCombinations` (`resources/app/pages/products/utils.ts`) matches a saved variant to a generated combination by **exact set equality** of `attribute_values`. Adding a second attribute changes every combination's length, so nothing matches; every variant is rebuilt as a clone of `variants[0]` with `id` deleted. `UpdateProductAction` then hard-deletes every DB row whose id was not echoed back. Adding "Size" to a product with Color: Red/Blue destroys both variant rows — SKUs, inventory, images and prices — with no warning and no undo.

The same clone is the root of three further defects that all sit on this path: it copies `sku` verbatim into every generated row (and `variants.sku` is globally `unique()`, so saving is a constraint violation), it copies `is_default: true` onto every row (so every multi-variant product ever created through this UI has N defaults), and `single-group.tsx` returns `null` before three `useEffect` calls, so emptying a value group throws "rendered fewer hooks than expected".

## What Changes

- Replace exact-set matching with a **claim/fill algorithm**: each saved variant claims the first unclaimed combination it is compatible with, keeping its `id` and all data; remaining combinations are filled from their nearest ancestor. Adding an attribute preserves saved variants (Shopify's behaviour); removing one keeps the earliest survivor per collapsed combination.
- Generated variants inherit pricing, logistics and **media** from their ancestor, but blank `sku`/`barcode` and reset `available_quantity`/`committed_quantity` to 0 and `is_default` to false — fixing the unique-SKU violation and the phantom-stock inflation.
- Exactly one variant carries `is_default` after any regeneration; `mapProductToFormValues` normalizes it on load so the form can never round-trip an invalid payload, whatever wrote the product.
- Confirm before an attribute or value removal discards variants that have an `id`; draft products (no ids yet) proceed silently.
- Collapse the three duplicated `setValue` call sites into one write path: a pure `variant-matrix.ts` module plus a `use-variant-matrix` hook. Removes the stale-closure read in `add-or-edit-attribute.tsx` and deletes `createVariantCombinations`.
- Fix the conditional-hook crash in `single-group.tsx`.
- **BREAKING (API)**: the product create/update endpoints gain matrix integrity validation — `attribute_values` becomes required on update when `has_variants` is true (today omitting it silently detaches every pivot row via `sync([])`), value ids must belong to a listed attribute, the combination length must match the attribute count, combinations must be unique across variants, and exactly one variant must be `is_default`. No data backfill accompanies this — the plugin is pre-release, so no stored product predates the rule.

## Capabilities

### New Capabilities

- `product-variant-matrix`: how the variant grid is derived from a product's attributes — combination generation, which saved variants survive an attribute or value change and what they keep, what generated variants inherit, `is_default` normalization, and the server-side integrity rules the payload must satisfy.

### Modified Capabilities

- `product-variations-card`: the "Apply commits locally without saving the product" requirement currently describes the attribute editor writing `attributes`/`variants`/`has_variants` directly via `setValue`. That write path moves behind a single hook, and attribute/value removal gains a confirmation step when saved variants would be discarded.

## Impact

**Frontend** (`resources/app/`)
- New: `pages/products/variant-matrix.ts` (+ co-located test — the first non-schema Vitest file; `vitest.config.ts` already includes `**/*.test.ts` repo-wide), `pages/products/product-form/sections/variants/use-variant-matrix.ts`.
- Modified: `attribute-list.tsx`, `add-or-edit-attribute.tsx`, `variation-table/single-group.tsx`, `schemas/forms/product-form.ts` (`mapProductToFormValues` only — no schema shape change, so no zod v3 constraints are engaged).
- Removed: `createVariantCombinations` from `pages/products/utils.ts` (2 call sites, both replaced).
- Reused as-is: `components/modal/confirmation-dialog.tsx` — its `subtitle` is a plain string, so the warning is a summary sentence, not a list. The `product-variations-card` spec forbids modifying a primitive to reach a design.

**Backend**
- Modified: `ProductCreateRequest`, `ProductUpdateRequest` (validation rules), `CreateProductAction` / `UpdateProductAction` (`has_variants` is assigned `count($attributes)` — an int into a boolean column; becomes `count(...) > 0`).
- Tests: `tests/Support/CreatesTestProducts.php::variants_for_update` never sends `attribute_values` and must now echo it; one call site in `tests/Integration/ProductApiTest.php`.

**Not changed**: the request/response contract itself. `VariantResource` already emits `attribute_values` as a flat `int[]`, exactly what the request expects, so the matrix round-trips today. Blank SKUs go over the wire as `null` (the schema transform does `sku || null`) and MySQL permits many NULLs in a UNIQUE index.
