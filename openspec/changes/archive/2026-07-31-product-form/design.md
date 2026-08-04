## Context

See [proposal.md](./proposal.md) for motivation. Today the product edit page (`edit-product.tsx`) wraps content in `ProductFormProvider` (a `useReducer`-based context) and runs six or more independent `useForm` instances — basics, price, inventory, shipping, SEO, right panel — synchronized back to context via `form.watch` and reset via `formSyncKey`. Section components under `edit-product/` import `useProductForm()` for reads and writes. The backend stores variant-specific data (price, inventory, shipping) in the variants table and returns `variants: [{...}]` even for simple products.

Constraints:
- PHP 7.4 backend; React frontend with RHF, Zod, TanStack Query
- Existing form field components in `resources/app/components/form/`
- Existing section Zod schemas in `resources/app/schemas/forms/product-*`
- `createVariantCombinations()` utility already handles attribute → variant generation

## Goals / Non-Goals

**Goals:**
- Single RHF form instance with `FormProvider` as sole editable state
- Shared `ProductForm` used by separate create and edit pages
- All sections consume form via `useFormContext`, `Controller`, and form directory components
- `useFieldArray` for `additional_info`, `attributes`, `variants`
- New form field components for gaps (MoneyField, NumberField, CreatableSelectField, ComboboxField)
- Composed `ProductFormSchema` with load/submit mappers
- Proper loading state on edit page; settings seeding on create page
- Remove `ProductFormContext` and `formSyncKey` pattern

**Non-Goals:**
- Backend API changes
- Bulk edit page refactor (`/variants/bulk`)
- New product form UX or layout redesign
- Unsaved-changes tracker integration (not currently wired for products)
- Barcode field (explicitly excluded per inventory spec)

## Decisions

### 1. Form data shape: nested `variants[0]`

**Decision:** Variant-specific fields live at `variants.0.*` in form state.

**Rationale:** Matches API response shape; avoids load/submit transform layer for the common case (simple products always have one variant from API).

**Alternative rejected:** Flat root-level price/sku fields with mapper — adds complexity without UX benefit.

### 2. Remove ProductFormContext entirely

**Decision:** Delete `product-form-context.tsx`. RHF is the single source of truth.

**Rationale:** Eliminates dual-state sync bugs. Variant combination logic moves to a utility called on attribute save, writing results via `form.setValue('variants', ...)` and `form.setValue('has_variants', true)`.

**Alternative rejected:** Keep context for variant generation only — still requires sync between two stores.

### 3. Inventory fields on variant only

**Decision:** `allow_back_order`, `has_limit_per_order`, `max_per_order` bind to `variants.0.*`. Submit payload excludes top-level `allow_back_order`.

**Rationale:** Aligns with backend validation (`variants.*.allow_back_order` in `ProductCreateRequest`). User confirmed variant-only payload.

**Alternative rejected:** Duplicate at product root and variant — redundant and confusing in unified form.

### 4. Composed schema from existing section schemas

**Decision:** New `product-form.ts` merges existing Zod schemas rather than rewriting from scratch.

**Rationale:** Preserves validated field rules; section schemas remain useful for dialog sub-forms.

**Alternative rejected:** Use `ProductSchema` directly — too API-shaped; form needs intermediate types (e.g., relation objects vs IDs).

### 5. Dialog sub-forms stay local

**Decision:** Attribute, variation, and additional-info dialogs keep local `useForm`; on confirm, push to parent via `useFieldArray` `append`/`update`.

**Rationale:** Isolated validation per dialog; avoids nesting FormProviders. User confirmed this pattern.

### 6. File layout under `product-form/`

**Decision:**
```
resources/app/pages/products/
  product-form/
    product-form.tsx
    sections/          (moved from edit-product/)
  create-product/create-product.tsx
  edit-product/edit-product.tsx   (thin wrapper)
```

**Rationale:** Clear separation between shared form and page-specific data fetching.

### 7. Routes

**Decision:** Register `/products/create` before `/products/:id` in `routes.tsx`. Update products list navigation to `/products/create`.

**Rationale:** Explicit create route; no more `id === 'create'` detection.

## Risks / Trade-offs

- **[Variant combination migration]** Attribute add/remove must preserve existing `createVariantCombinations` behavior while writing to RHF field array → Test attribute add/edit/delete flows; preserve variant IDs where possible
- **[Bulk edit navigation]** Variation table links to `/variants/bulk?ids=...` — variant IDs must persist in field array after load → Verify IDs present in form state after `mapProductToFormValues`
- **[Base unit dialog]** Sets composite fields on variant (`base_unit`, `base_unit_amount`, etc.) → Refactor to use `form.setValue` on `variants.0.*` paths
- **[Large refactor scope]** Many section files touched → Implement in dependency order: form components → schema → ProductForm shell → sections → pages → cleanup
- **[SEO/inventory spec deltas]** Existing specs reference "product form context" — behavior preserved, sync mechanism changes only

## Migration Plan

1. Add new form field components and unified schema (no breaking changes yet)
2. Build `ProductForm` and migrate sections one at a time behind new pages
3. Add `/products/create` route; keep old route temporarily if needed for bookmarks
4. Switch products list navigation to new create route
5. Delete `ProductFormContext` and old multi-form code in `edit-product.tsx`
6. Verify create, edit, variant add, save, and server error flows manually

**Rollback:** Revert to previous `edit-product.tsx` + context if critical regressions found; routes can coexist briefly.
