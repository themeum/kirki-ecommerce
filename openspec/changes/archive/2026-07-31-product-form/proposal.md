## Why

The product create/edit flow uses a hybrid architecture — a `ProductFormProvider` reducer plus six or more independent React Hook Form instances synced via `formSyncKey` and `form.watch`. This causes duplicated state, fragile synchronization, and inconsistent patterns across sections. Consolidating to a single RHF form with shared form context simplifies state management, enables proper `useFieldArray` for dynamic sections, and aligns with project form component conventions.

## What Changes

- Introduce a shared `ProductForm` component with one `useForm()` instance and `FormProvider` wrapping all sections
- Split create and edit into separate pages: `/products/create` and `/products/:id`
- Refactor all product form sections to consume form via `useFormContext()` and `Controller`
- Use `useFieldArray` for `additional_info`, `attributes`, and `variants`
- Create missing form field components: `MoneyField`, `NumberField`, `CreatableSelectField`, `ComboboxField`
- Compose a unified `ProductFormSchema` from existing section schemas
- Store variant-specific fields (price, inventory, shipping) under `variants[0]` in form state
- Wire media gallery through `MediaGalleryField` in RHF
- **BREAKING**: Remove `ProductFormContext` entirely — all editable state lives in RHF
- **BREAKING**: Route change — `/products/create` becomes a dedicated route (no longer `id === 'create'` on `/products/:id`)
- **BREAKING**: Drop top-level `allow_back_order` from submit payload; inventory limits live on variant only

## Capabilities

### New Capabilities

- `product-form`: Unified product create/edit form — single RHF instance, separate create/edit pages, loading states, payload mapping, variant normalization, and conditional section visibility

### Modified Capabilities

- `product-inventory-card`: Inventory field sync moves from product form context to unified RHF form; `allow_back_order` and order-limit fields bind to `variants.0` instead of product root
- `product-seo-card`: SEO/AEO/Social/Schema field sync moves from product form context to unified RHF form; preview hooks read from `useFormContext` instead of `useProductForm`

## Impact

- **Frontend pages**: `resources/app/pages/products/` — new `product-form/`, `create-product/`, rewritten `edit-product/`
- **Context removal**: `resources/app/contexts/product-form-context.tsx` deleted
- **Routes**: `resources/app/routes.tsx`, `resources/app/pages/products/products.tsx` navigation
- **Form components**: new fields in `resources/app/components/form/`
- **Schemas**: new `resources/app/schemas/forms/product-form.ts`; updates to inventory mappers
- **Section components**: price, inventory, shipping, variants, SEO, right panel, additional info — all refactored
- **API**: no backend changes required; payload shape adjustment drops redundant top-level `allow_back_order`
