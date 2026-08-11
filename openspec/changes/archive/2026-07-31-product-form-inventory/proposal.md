## Why

The product edit Inventory card does not match the Figma design: quantity fields use mixed Field/form-wrapper patterns, minimum stock threshold is not bound to form state, "Sell when out of stock" is a hardcoded checkbox with no sync, and limit-order input uses `visibility: hidden` instead of conditional render. Merchants need a consistent inventory UI aligned with the Price card refactor and correct product-form synchronization.

## What Changes

- Refactor [`inventory.tsx`](resources/app/pages/products/edit-product/inventory/inventory.tsx) to match Figma layout using explicit RHF `Controller` blocks (same pattern as the refactored Price card)
- Show Available, Committed, and Minimum stock threshold only when "Track quantity" is checked; keep In Stock / Out of Stock select when tracking is off
- Full-width SKU field with wand button that generates a random `SKU-XXX-1234`-style value (barcode field deferred)
- Wire "Sell when out of stock" to product-level `allow_back_order`, always visible in the bottom row
- Wire "Limit orders to number of item" with conditional `max_per_order` input (render only when checked)
- Add frontend-only `min_stock_threshold` on variant form schema and save payload (backend persistence deferred)
- Preserve existing `form.watch` → `updateProduct` sync behavior, server error mapping, and `track_inventory` quantity reset

## Capabilities

### New Capabilities

- `product-inventory-card`: Product edit Inventory card layout, conditional field visibility, SKU generation, and inventory field sync behavior

### Modified Capabilities

- (none — no existing specs under `openspec/specs/` for product inventory)

## Impact

- [`resources/app/pages/products/edit-product/inventory/inventory.tsx`](resources/app/pages/products/edit-product/inventory/inventory.tsx) — primary UI refactor
- [`resources/app/schemas/forms/product-inventory-form.ts`](resources/app/schemas/forms/product-inventory-form.ts) — add `allow_back_order`, `min_stock_threshold`
- [`resources/app/schemas/catalog/variant.ts`](resources/app/schemas/catalog/variant.ts) — optional `min_stock_threshold` on variant type
- [`resources/app/contexts/product-form-context.tsx`](resources/app/contexts/product-form-context.tsx) — default variant shape
- [`resources/app/pages/products/utils.ts`](resources/app/pages/products/utils.ts) — `generateSku()` helper
- Reuses existing `FieldLabel` `infoText` from the Price card change; no backend/API migration in this change
