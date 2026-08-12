## 1. Variant matrix module

- [x] 1.1 Create `resources/app/pages/products/variant-matrix.ts` with `buildCombinations(attributes)` — cartesian product over each attribute's selected value ids, in attribute order then value order; empty attributes yields a single empty combination.
- [x] 1.2 Add `syncVariantMatrix({ attributes, previousAttributes, variants })` returning `{ variants, discarded }`, implementing the claim pass (compatibility resolved against `previousAttributes` per design.md) and the fill pass (nearest-ancestor template, identity and stock reset).
- [x] 1.3 Add `is_default` normalization to `syncVariantMatrix`: keep the sole surviving default, else mark index 0 and clear the rest.
- [x] 1.4 Add `formatComboLabel(attributes, attributeValues)` producing `'Red / M'`, ordering by the `attributes` array — never by `attribute_values` order, which the API does not preserve.
- [x] 1.5 Write `resources/app/pages/products/variant-matrix.test.ts` covering every scenario in `specs/product-variant-matrix/spec.md`: add attribute, remove attribute, add value, remove value, reorder, simple→variant, variant→simple, generated-variant inheritance (media in; sku/barcode/stock out), and both default-normalization cases.
- [x] 1.6 Verify: `cd resources/app && npm run typecheck && npm test`.

## 2. Single write path

- [x] 2.1 Create `resources/app/pages/products/product-form/sections/variants/use-variant-matrix.ts` exposing `addAttribute` / `updateAttribute` / `removeAttribute` / `reorderAttributes`, each resolving to one `applyAttributes` that reads current form state fresh and writes `attributes`, `variants` and `has_variants` (`attributes.length > 0`). Each verb returns the variants that would be discarded so callers can gate on a prompt.
- [x] 2.2 Rewire `attribute-list.tsx` to the hook: delete its local `applyAttributes`, route remove and drag-reorder through the hook.
- [x] 2.3 Rewire `add-or-edit-attribute.tsx`'s `handleApply` to the hook, removing the stale `getValues('attributes')` read captured at render.
- [x] 2.4 Delete `createVariantCombinations` from `resources/app/pages/products/utils.ts` and remove any imports it leaves orphaned.
- [x] 2.5 Verify: `cd resources/app && npm run typecheck && npm test`.

## 3. Destructive-removal confirmation

- [x] 3.1 Gate attribute removal and attribute-value removal on `ConfirmationDialog` (`variant="delete"`) when the discarded set contains variants with an `id`; proceed silently otherwise. Reuse the component unchanged — `subtitle` is a plain string, so write a summary sentence naming the count and the combinations via `formatComboLabel`.
- [x] 3.2 Confirm cancelling leaves `attributes`, `variants` and `has_variants` untouched.
- [x] 3.3 Verify: `cd resources/app && npm run typecheck && npm test`.

## 4. Variation table crash fix

- [x] 4.1 In `variation-table/single-group.tsx`, move the early `return null` (currently line 78, above three `useEffect` calls) below all hook calls so an emptied value group cannot throw "rendered fewer hooks than expected".
- [x] 4.2 Verify: `cd resources/app && npm run typecheck && npm test`.

## 5. Default normalization on load

- [x] 5.1 Normalize `is_default` inside `mapProductToFormValues` in `resources/app/schemas/forms/product-form.ts` so a product stored with zero or several defaults hydrates with exactly one. Do not change any schema field shape — this is mapper-only, so no zod v3 input-type widening is involved.
- [x] 5.2 Extend `resources/app/schemas/forms/product-form.test.ts` with payload cases for a product loaded with several defaults and one with none.
- [x] 5.3 Verify: `cd resources/app && npm run typecheck && npm test`.

## 6. Backend integrity

- [x] 6.1 ~~Add `database/migrations/NormalizeVariantDefaults.php` and register it in `config/migrations.php`.~~ — *Dropped. Written, then removed at the user's direction: the plugin is pre-release, so no stored product predates the `is_default` rule and there is nothing to backfill. `mapProductToFormValues` normalization (task 5.1) stays — it covers products written by `PUT /variants/bulk`, which the new validation does not reach.*
- [x] 6.2 Change `has_variants` assignment in `CreateProductAction` and `UpdateProductAction` from `count($attributes)` to `count($attributes) > 0`.
- [x] 6.3 Add matrix integrity rules to `ProductCreateRequest` and `ProductUpdateRequest`: value ids must belong to an attribute on the request; combination length must equal the attribute count; no duplicate combination across variants; exactly one `is_default`. Keep the simple-product case (no attributes, empty value set) valid.
- [x] 6.4 Make `variants.*.attribute_values` required on **update** when the product has attributes, closing the silent `sync([])` pivot wipe.
- [x] 6.5 Update `tests/Support/CreatesTestProducts.php::variants_for_update` to echo `attribute_values`, and check its call site in `tests/Integration/ProductApiTest.php`.
- [x] 6.6 Add integration coverage for the new rejections (unlisted value id, duplicate combination, omitted values on update). — *5 tests, all passing: the three rejections plus a no-default rejection and a variant-product round-trip. The multi-default case this originally also called for is now frontend-only (see 6.1) and is covered by `product-form.test.ts`.*
- [x] 6.7 Verify: `composer test`, then `cd resources/app && npm run typecheck && npm test`. — *Required an authorized scope exception to run at all; see design.md "Corrections during implementation".*

## 7. Manual verification — NOT DONE, needs the user

Per CLAUDE.md §0 this project forbids browser/dev-server verification by the agent. These are unverified.
`restructure-app-features` relocated the product-form code these checks exercise into
`features/products/` without behavioral change — run these against the restructured tree:

- [ ] 7.1 Edit a product with Color(Red,Blue) and real SKUs/stock → add Size(S,M): Red/S and Blue/S keep their SKU and stock; Red/M and Blue/M are new with inherited price and media, blank SKU, 0 stock. Save → no variants deleted.
- [ ] 7.2 Remove Size → the prompt names the two rows to be deleted; Red and Blue keep their original SKU and stock.
- [ ] 7.3 Remove the last attribute → collapses to one variant that keeps its id, and the Price/Inventory/Shipping sections reappear.
- [ ] 7.4 Open a multi-variant product created before this change (every row marked default) and save without touching attributes → no 422.
