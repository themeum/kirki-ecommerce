## Why

The product edit basics card does not match the Figma design: it is missing a **Short description** field, and vertical spacing between sections is uneven because form fields sit inside `CardContent` without a gap wrapper. Aligning the form with design improves merchant UX and prepares the frontend for a future backend field.

## What Changes

- Add a **Short description** textarea (3 rows) to the product basics card, placed after **Images and videos** and before **Description** (rich text)
- Wire `short_description` through frontend schemas, types, product form context, and create/update save payload
- Fix section spacing with a consistent 16px (`theme.spacing[4]`) vertical gap between all major sections in the basics card
- Tighten **Additional Info** internal spacing to match the same 16px rhythm
- Keep the separator before Additional Info (adjust margins to work with gap layout)
- Keep **Description** as the existing rich text editor, **Images and videos** design unchanged, and **Add an Info Section** button color unchanged

## Capabilities

### New Capabilities

- `product-edit-basics`: Defines the product basics card field order, short description field behavior, spacing requirements, and frontend save payload contract for `short_description`.

### Modified Capabilities

(none — no existing main specs cover product edit form behavior)

## Impact

- **Frontend schemas**: `resources/app/schemas/forms/product-basics-form.ts`, `resources/app/schemas/catalog/product.ts`
- **Frontend types**: `resources/app/types/entities/product.ts`
- **Form context**: `resources/app/contexts/product-form-context.tsx`
- **UI**: `resources/app/pages/products/edit-product/edit-product.tsx`, `resources/app/pages/products/edit-product/additional-info/additional-info.tsx`
- **API payload**: `short_description` included in create/update requests; backend persistence deferred to a follow-up change
- **Out of scope**: Database migration, PHP model/requests/resources, Images and videos redesign, Description editor redesign
