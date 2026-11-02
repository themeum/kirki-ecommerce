## 1. Schemas and types

- [x] 1.1 Add `short_description: optionalNullableString()` to `ProductBasicsFormSchema` in `resources/app/schemas/forms/product-basics-form.ts`
- [x] 1.2 Update `mapProductBasicsFromProduct`, `productBasicsDefaultValues` with `short_description`
- [x] 1.3 Add `short_description: z.string().nullable()` to `ProductSchema` in `resources/app/schemas/catalog/product.ts`
- [x] 1.4 Add `short_description?: string | null` to `ProductFormData` in `resources/app/types/entities/product.ts`
- [x] 1.5 Add `short_description: ''` to `createInitialProduct()` in `resources/app/contexts/product-form-context.tsx`

## 2. Basics card UI

- [x] 2.1 Import `TextareaField` in `resources/app/pages/products/edit-product/edit-product.tsx`
- [x] 2.2 Wrap `CardContent` children in `<Flex direction="column" gap={4}>`
- [x] 2.3 Insert `TextareaField` for `short_description` (3 rows, i18n label) after `MediaGallery`, before `RichTextField`
- [x] 2.4 Set Separator `marginTop={0}` and `marginBottom={0}` before `AdditionalInfo`
- [x] 2.5 Add `short_description: productData.short_description` to `formattedData` in `handleAddOrCreateProduct`

## 3. Additional Info spacing

- [x] 3.1 Wrap info item list and "Add an Info Section" button in `<Flex direction="column" gap={4}>` in `additional-info.tsx`

## 4. Verify

- [x] 4.1 Confirm field order: Title/Ribbon → Slug → Images → Short description → Description → Separator → Additional Info
- [x] 4.2 Confirm uniform 16px gaps between major sections
- [x] 4.3 Confirm save request includes `short_description` in network payload
- [x] 4.4 Confirm Images gallery, Description editor, and Add Info button styling unchanged
