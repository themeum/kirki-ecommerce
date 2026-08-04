## Context

See proposal.md for motivation. The Inventory card in `resources/app/pages/products/edit-product/inventory/inventory.tsx` mixes `@/components/form` wrappers with raw `Field`/`Input`, has an unbound minimum-stock input, and a non-functional "Sell when out of stock" checkbox. The refactored Price card (`price.tsx`) establishes the target pattern: explicit `Controller` blocks, `innerDarkCard` rows with conditional right-side controls, and `FieldLabel` `infoText` tooltips.

Constraints: React + Emotion design system, existing product form context with `form.watch` subscription sync, PHP/backend unchanged for `min_stock_threshold` (frontend sends field on variant payload; API ignores until backend adds column).

## Goals / Non-Goals

**Goals:**

- Align Inventory card layout and spacing with Figma (track quantity, quantity grid, full-width SKU, bottom toggle row)
- Use explicit RHF `Controller` + `Field`/`Input`/`Checkbox`/`Select` throughout (Price card pattern)
- Wire all visible fields to product form context with existing sync model
- Add SKU auto-generation via wand button (`SKU-XXX-1234` random format)
- Add frontend `min_stock_threshold` field on variant schema and form

**Non-Goals:**

- Barcode field, printer icon, or eye/preview actions
- Backend migration or API validation for `min_stock_threshold`
- Migrating sync from `form.watch` subscription to explicit per-field handlers (Price-style `syncVariantField`)
- Changing variant-table or bulk-edit inventory UIs

## Decisions

### 1. Controller-only field rendering (match Price card)

- **Choice:** Replace `TextField`, `CheckboxField`, and `SelectField` wrappers with explicit `Controller` render props in `inventory.tsx`.
- **Why:** User chose controller-only; Price card already validates this pattern for checkbox rows with conditional inputs.
- **Alternatives:** Keep form wrappers (rejected per decision); hybrid wrappers + Controller (rejected).

### 2. Preserve `form.watch` subscription for sync

- **Choice:** Keep the existing `form.watch` → `updateProduct` subscription; do not refactor to inline `syncVariantField` on every change.
- **Why:** Explicit requirement to keep product form sync behavior as-is today.
- **Alternatives:** Migrate to Price-style explicit sync handlers (deferred).

### 3. Product-level vs variant-level field mapping

- **Choice:**
  - Product level: `allow_back_order`, `has_limit_per_order`, `max_per_order`
  - Variant level: `track_inventory`, `available_quantity`, `committed_quantity`, `min_stock_threshold`, `sku`, `in_stock`
- **Why:** Matches existing `productLevelFields` array and save payload shape (`allow_back_order` on product resource; inventory quantities on variant).
- **Alternatives:** Move `allow_back_order` to variant (rejected — user chose product-level).

### 4. Minimum stock threshold as frontend-only variant field

- **Choice:** Add `min_stock_threshold` to form schema, variant Zod schema, default variant, and variant save payload. No PHP migration.
- **Why:** Design requires the field; backend will follow in a separate change.
- **Alternatives:** UI-only disabled placeholder (rejected — user wants full frontend handling).

### 5. SKU generation algorithm

- **Choice:** `generateSku()` in `resources/app/pages/products/utils.ts` producing `SKU-{3 alphanumeric}-{4 alphanumeric}` uppercase segments.
- **Why:** User chose random format matching placeholder `SKU-XYZ-1234`; no settings-driven or slug-based logic exists yet.
- **Alternatives:** Slug-based, sequential, settings-driven (rejected per grill-me).

### 6. Conditional render for limit-order input

- **Choice:** Render `max_per_order` input only when `has_limit_per_order` is checked (not `visibility: hidden`).
- **Why:** Matches Figma and Price card two-state row pattern; avoids reserving dead layout space.

### 7. Track quantity off behavior

- **Choice:** When tracking is off, show In Stock / Out of Stock `Select` (existing behavior); hide quantity grid.
- **Why:** Figma only shows checked state; preserving select avoids regression for non-tracking products.

## Risks / Trade-offs

- **[Risk]** `min_stock_threshold` sent to API before backend support → **Mitigation:** Field is optional/nullable; backend should ignore unknown keys; document in tasks.
- **[Risk]** `has_limit_per_order` mapped from product in form but enforced on variant in backend → **Mitigation:** Keep existing sync paths unchanged; do not refactor product/variant level split in this change.
- **[Risk]** SKU collisions on random generation → **Mitigation:** Acceptable for merchant-triggered wand; uniqueness validated on save by backend SKU constraint.
- **[Risk]** Wand button with no product title context → **Mitigation:** Random format does not depend on product metadata.

## Migration Plan

- Frontend-only change; no database migration.
- Roll forward with admin app build; rollback by reverting the change branch.
- Existing products retain current inventory values; new `min_stock_threshold` defaults to null/0 until merchant edits.
