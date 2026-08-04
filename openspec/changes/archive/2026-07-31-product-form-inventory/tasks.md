## 1. Schema and form data model

- [x] 1.1 Add `allow_back_order` and `min_stock_threshold` to `ProductInventoryFormSchema`, mapper, and defaults in `product-inventory-form.ts`
- [x] 1.2 Add optional `min_stock_threshold` to `VariantSchema` in `schemas/catalog/variant.ts`
- [x] 1.3 Add `min_stock_threshold` default to `defaultVariant` in `product-form-context.tsx`
- [x] 1.4 Extend `productLevelFields` in inventory to include `allow_back_order`

## 2. SKU generation utility

- [x] 2.1 Add `generateSku()` to `resources/app/pages/products/utils.ts` producing `SKU-{3 uppercase alphanumeric}-{4 uppercase alphanumeric}` format

## 3. Inventory card UI refactor

- [x] 3.1 Replace form wrappers with explicit `Controller` blocks for all inventory fields in `inventory.tsx`
- [x] 3.2 Implement track-quantity checkbox and conditional inner card with Available, Committed (disabled), and Minimum stock threshold (with `infoText`)
- [x] 3.3 Keep In Stock / Out of Stock `Select` when track quantity is unchecked
- [x] 3.4 Implement full-width SKU row with label `infoText`, wand button calling `generateSku()`, and synced SKU input
- [x] 3.5 Implement bottom row: sell-when-out-of-stock (`allow_back_order`, always visible) and limit-orders row with conditional `max_per_order` input
- [x] 3.6 Apply Price card layout styles (`cardContent` gap, `innerDarkRowContent` 44px rows, conditional render not `visibility: hidden`)
- [x] 3.7 Remove duplicate `FieldDescription` under limit orders; remove barcode-related markup

## 4. Form sync preservation

- [x] 4.1 Keep existing `form.watch` subscription, `updateProduct` calls, and `track_inventory` available-quantity reset
- [x] 4.2 Keep `form.reset` on `formSyncKey` and server error mapping with `stripPrefix: 'variants.0.'`

## 5. Verification

- [x] 5.1 Verify track-on shows quantity grid; track-off shows stock status select
- [x] 5.2 Verify SKU wand generates and syncs; sell-when-out-of-stock and limit-orders toggles sync correctly
- [x] 5.3 Verify limit-order input appears only when checked; layout matches Figma screenshots
- [x] 5.4 Verify product save payload includes variant `min_stock_threshold` and product `allow_back_order`
