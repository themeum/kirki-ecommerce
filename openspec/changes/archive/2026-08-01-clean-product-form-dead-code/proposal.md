## Why

The product form refactor (`472538f`) consolidated per-section zod validation into a single merged schema (`schemas/forms/product-form.ts`), leaving several pre-refactor files and exports unimported anywhere. A full audit of the product form's component tree, zod schemas, types, and TanStack Query hooks — cross-checked with repo-wide greps — also found one fully-built mutation hook with zero callers and a couple of dangling exports. None of this is reachable from any route, component, or test; removing it reduces surface area with no behavior change.

## What Changes

- Delete 4 whole unused schema files superseded by the consolidated form schema: `schemas/forms/product-inventory-form.ts`, `product-shipping-form.ts`, `product-price-form.ts`, `product-right-panel-form.ts`.
- Delete the orphaned `CartSVG` component: `pages/products/product-form/sections/svg/cart-svg.tsx`.
- Remove unused exports from `schemas/forms/product-basics-form.ts` (`ProductBasicsFormValues`, `mapProductBasicsFromProduct`, `productBasicsDefaultValues`) and `schemas/forms/product-seo-form.ts` (`ProductSeoFormValues`, `productSeoDefaultValues`), keeping the live schemas (`ProductBasicsFormSchema`, `ProductSeoFormSchema`) that are structurally consumed via `.extend()`/`.merge()`.
- Remove a dangling type re-export (`AttributeFormState`, `AttributeFormValue`) at the bottom of `add-or-edit-attribute.tsx` with zero importers under those aliases.
- Remove the fully-dead `UpdateProductPayload` type from `types/entities/product.ts` and its barrel re-export in `types/index.ts`.
- Remove the unused `useDeleteProductMutation` hook and its backing `deleteProduct` API call from `services/product.ts` — the product table's delete action uses `useBulkDeleteProductsMutation` for both single and bulk deletes, so this mutation has zero callers.

Explicitly out of scope (reviewed and descoped): un-exporting internally-used-only types in `hooks/use-list-params.ts`, `hooks/useBulkEditList.ts`, and `schemas/forms/product-form.ts` (not dead, just over-exported); and the `AttributeType`/`ProductAttribute` type re-export chain across `schemas/catalog/attribute.ts` → `product.ts` → `types/entities/product.ts` → `types/index.ts` → `schemas/catalog/coupon.ts` (low value relative to its 5-file blast radius).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

(none — no spec-level behavior changes; this change removes unreachable code only. `skip_specs: true` is set in this change's `.openspec.yaml`.)

## Impact

- **Frontend schemas**: `resources/app/schemas/forms/product-inventory-form.ts`, `product-shipping-form.ts`, `product-price-form.ts`, `product-right-panel-form.ts` (deleted); `product-basics-form.ts`, `product-seo-form.ts` (trimmed)
- **Frontend components**: `resources/app/pages/products/product-form/sections/svg/cart-svg.tsx` (deleted); `resources/app/pages/products/product-form/sections/variants/attribute-list/add-or-edit-attribute.tsx` (trimmed)
- **Frontend types**: `resources/app/types/entities/product.ts`, `resources/app/types/index.ts` (trimmed)
- **Frontend services**: `resources/app/services/product.ts` (trimmed)
- **Out of scope**: any file/export still reachable from the live product form tree, or reused by other features (e.g. `base-unit-dialog.tsx`, also used by the bulk-edit page — untouched)
