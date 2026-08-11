## 1. Form field components

- [x] 1.1 Create `MoneyField` in `resources/app/components/form/money-field.tsx` (currency prefix, Controller pattern)
- [x] 1.2 Create `NumberField` in `resources/app/components/form/number-field.tsx`
- [x] 1.3 Create `CreatableSelectField` in `resources/app/components/form/creatable-select-field.tsx` (options + "Add new" action)
- [x] 1.4 Create `ComboboxField` in `resources/app/components/form/combobox-field.tsx` (single-select creatable)

## 2. Unified form schema and mappers

- [x] 2.1 Create `resources/app/schemas/forms/product-form.ts` with composed `ProductFormSchema`
- [x] 2.2 Implement `getProductFormDefaultValues()` matching current initial product state
- [x] 2.3 Implement `mapProductToFormValues(product)` with empty-variants normalization
- [x] 2.4 Implement `buildProductPayload(values)` — media/relations to IDs, variant-only inventory, no top-level `allow_back_order`
- [x] 2.5 Update inventory section mappers to use `variants.0.*` paths only

## 3. ProductForm shell

- [x] 3.1 Create `resources/app/pages/products/product-form/product-form.tsx` with single `useForm`, `FormProvider`, page layout, save/submit
- [x] 3.2 Implement conditional Price/Inventory/Shipping visibility based on `has_variants` and `attribute_values`
- [x] 3.3 Wire server error handling via `applyServerErrors` on unified form (remove `formSyncKey` pattern)
- [x] 3.4 Move section components to `product-form/sections/` directory

## 4. Section refactors

- [x] 4.1 Refactor basics section — `TextField`, `TextareaField`, `RichTextField`, `MediaGalleryField` via `useFormContext`
- [x] 4.2 Refactor price section — `MoneyField`, `CreatableSelectField`; base unit dialog writes `variants.0.*`
- [x] 4.3 Refactor inventory section — `NumberField`, `CheckboxField`; all fields at `variants.0.*`
- [x] 4.4 Refactor shipping section — `WeightField`, `ShippingBoxField`, shipping profile via form context
- [x] 4.5 Refactor right panel — `SelectField`, `ComboboxField`, `TagManagerField`; categories tree via form context
- [x] 4.6 Refactor SEO section — field components + `use-seo-preview-data` reads from `useFormContext`/`useWatch`
- [x] 4.7 Refactor additional info — `useFieldArray` for `additional_info`; dialog pushes on confirm
- [x] 4.8 Refactor variants section — `useFieldArray` for `attributes` and `variants`; attribute dialog triggers `createVariantCombinations` → `setValue`

## 5. Create and edit pages

- [x] 5.1 Create `resources/app/pages/products/create-product/create-product.tsx` with settings/shipping-box seeding
- [x] 5.2 Rewrite `edit-product.tsx` as thin wrapper — `useProductQuery`, loading spinner, pass data to `ProductForm`
- [x] 5.3 Update `routes.tsx` — add `/products/create` before `/products/:id`
- [x] 5.4 Update `products.tsx` navigation to `/products/create`

## 6. Cleanup and verification

- [x] 6.1 Delete `resources/app/contexts/product-form-context.tsx`
- [x] 6.2 Remove all `useProductForm` imports and `formSyncKey` props across product pages
- [x] 6.3 Verify create flow — defaults seeded, save navigates to edit page
- [x] 6.4 Verify edit flow — loader, form populated, save updates product
- [x] 6.5 Verify variant flow — attribute add regenerates variants, price sections hidden, bulk edit IDs preserved
- [x] 6.6 Verify server validation errors map to correct form fields
