## 1. Remove superseded per-section form schemas

- [x] 1.1 Delete `resources/app/schemas/forms/product-inventory-form.ts` (zero importers; superseded by `schemas/forms/product-form.ts`)
- [x] 1.2 Delete `resources/app/schemas/forms/product-shipping-form.ts` (zero importers)
- [x] 1.3 Delete `resources/app/schemas/forms/product-price-form.ts` (zero importers)
- [x] 1.4 Delete `resources/app/schemas/forms/product-right-panel-form.ts` (zero importers)

## 2. Remove orphaned component

- [x] 2.1 Delete `resources/app/pages/products/product-form/sections/svg/cart-svg.tsx` (`CartSVG`, zero importers anywhere)

## 3. Trim unused exports from live schema files

- [x] 3.1 In `resources/app/schemas/forms/product-basics-form.ts`, remove unused exports `ProductBasicsFormValues` (type), `mapProductBasicsFromProduct`, `productBasicsDefaultValues`; keep `ProductBasicsFormSchema` (consumed via `.extend()` in `product-form.ts:60`)
- [x] 3.2 In `resources/app/schemas/forms/product-seo-form.ts`, remove unused exports `ProductSeoFormValues` (type), `productSeoDefaultValues`; keep `ProductSeoFormSchema` (consumed via `.merge()` in `product-form.ts:74`)

## 4. Remove dangling type re-export

- [x] 4.1 In `resources/app/pages/products/product-form/sections/variants/attribute-list/add-or-edit-attribute.tsx`, delete the trailing `export type { ProductAttributeFormValues as AttributeFormState, ProductAttributeValueFormValues as AttributeFormValue };` block (lines 343-346); the real underlying types stay untouched and keep working elsewhere

## 5. Remove fully-dead payload type

- [x] 5.1 In `resources/app/types/entities/product.ts`, delete the `UpdateProductPayload` type definition and drop it from the local `export type {...}` block; leave `ProductAttributePayload`/`ProductVariantPayload` untouched (used internally by `ProductFormData`)
- [x] 5.2 In `resources/app/types/index.ts`, remove `UpdateProductPayload` from the `types/entities/product` re-export list

## 6. Remove unused delete-product mutation

- [x] 6.1 In `resources/app/services/product.ts`, delete the `deleteProduct` API function and the `useDeleteProductMutation` hook, and remove both names from the file's `export {...}` block; confirm `useBulkDeleteProductsMutation` remains the only delete path used by `pages/products/product-table/product-table.tsx`

## 7. Verify

- [x] 7.1 Run the project's TypeScript check (e.g. `tsc --noEmit` per `package.json`) to confirm no dangling imports remain
- [ ] 7.2 Run the linter (e.g. `npm run lint`) to catch any newly-unused-import warnings
- [x] 7.3 Grep the repo for each removed symbol name (`UpdateProductPayload`, `useDeleteProductMutation`, `deleteProduct`, `AttributeFormState`, `AttributeFormValue`, `mapProductBasicsFromProduct`, `productBasicsDefaultValues`, `ProductBasicsFormValues`, `ProductSeoFormValues`, `productSeoDefaultValues`, and the 4 deleted module paths) to confirm zero remaining references
- [x] 7.4 Start the dev server and manually exercise the product form end-to-end (create product, edit product, save) plus the product table's bulk-delete action, to confirm no runtime regressions
