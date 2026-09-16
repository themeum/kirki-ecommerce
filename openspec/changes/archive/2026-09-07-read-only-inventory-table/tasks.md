## 1. Backend — variant list response

- [x] 1.1 Rewrite `to_array()` in `app/Resources/Variant/InventoryResource.php` to emit only: `id`, `sku`, `display_price`, `display_price_money_object`, `display_sale_price`, `display_sale_price_money_object`, `attribute_value_labels`, `track_inventory`, `available_quantity`, `committed_quantity`, `availability_status`, `availability_label`, and `product { id, name, image }`.
- [x] 1.2 Wire availability the way `app/Resources/Product/ProductListWithVariantsResource.php` does: resolve `AvailabilityService` from the container and read the store default via `Settings::get('product.low_stock_threshold', 0)`, then call `resolve_variant_status()` (the single-variant layer) and `AvailabilityStatus::get_formatted()`.
- [x] 1.3 Return `attribute_value_labels` as an array of attribute values, replacing the pre-joined `name` string.
- [x] 1.4 Remove `name`, `stock_quantity`, `base_price`, `base_price_money_object`, `base_sale_price`, `base_sale_price_money_object`, `base_cost_of_goods`, `base_cost_of_goods_money_object`, `display_cost_of_goods`, and `display_cost_of_goods_money_object`.
- [x] 1.5 Confirm `VariantService::list_query()` needs no change — `product.media` and `attribute_values` are already eager-loaded and no column list is restricted. Leave `VariantResource` and `VariantSchema` untouched.

## 2. Frontend — schema

- [x] 2.1 Rewrite `InventoryVariantSchema` in `resources/app/features/products/schemas/catalog/variant.ts` to mirror the new resource exactly.
- [x] 2.2 Type `availability_status` with the same lenient `z.union([AvailabilityStatusSchema, z.string()])` treatment the product schema uses, so backend drift degrades instead of throwing. **Correction:** importing the enum from `product.ts` would have created a circular import (`product.ts` already imports `VariantSchema`), which is a TDZ crash at module init for `const` bindings, not a warning. `AvailabilityStatusSchema` and its type were moved into `variant.ts` and re-exported from `product.ts`, so no importer's path changes.

## 3. Frontend — cell rules

- [x] 3.1 Add `resources/app/features/inventory/lib/inventory-cells.ts` exporting a pure Available rule: untracked → the availability label; tracked → the available quantity. Colour comes from `getAvailabilityColor()` in `features/products/lib/availability.ts`; a tracked variant whose status is low or out of stock is critical, otherwise default.
- [x] 3.2 In the same module, export a pure Committed rule returning the committed quantity, or a dash marker when it is zero or absent, or when the variant does not track inventory.

## 4. Frontend — table

- [x] 4.1 Rewrite `components/inventory-table/columns.tsx` with five columns in order: Variants, Price, SKU, Available, Committed. Delete the SKU, Price, Sale Price, Cost of Goods and Profit input cells and the `useInventoryForm`, `Input` and `calculateProfit` imports. Leave `calculateProfit` in `utils/common.ts` — bulk-edit and the product form still use it.
- [x] 4.2 Variants cell: keep the existing image handling (it already falls back to a placeholder), render the product name, and render `attribute_value_labels` joined by a separately-styled `|` with a fallback when the array is empty.
- [x] 4.3 Price cell: render `PriceText` with the display-currency regular and sale money objects.
- [x] 4.4 SKU cell: plain text, dash when null.
- [x] 4.5 Available and Committed cells: render the two rules from task 3 as plain coloured text. Do not copy the product table's `dangerouslySetInnerHTML` — the label is plain translated text — and do not use `getAvailabilityDescription`, whose copy is group-level and wrong for one variant.
- [x] 4.6 Update `features/inventory/lib/utils.tsx`: `allTableHeaders` drops Sale Price, Cost of Goods and Profit, gains Available and Committed, and all five are default-visible.

## 5. Frontend — remove the inline editor

- [x] 5.1 Delete `features/inventory/contexts/inventory-form-context.tsx` and its export line from `features/inventory/index.ts`.
- [x] 5.2 Rework `features/inventory/pages/inventory.tsx`: remove the `hasChanges` heading swap, the Save and Discard buttons, `resetChanges`, the `useUpdateBulkVariantsMutation` import, and the effect copying query data into the context. **Correction:** the page does not pass results as props. Every other list table in this codebase (`product-table`, `brand-table`, `customer-table`) calls its own query and takes no data props, so `InventoryTable` calls `useInventoryQuery` itself and the page renders it with no wiring.
- [x] 5.3 Rework `components/inventory-table/inventory-table.tsx` to own its query rather than reading the context (see 5.2 correction). Keep row selection, the Bulk Edit bulk action, `selectionResetKey`, the column-visibility wiring, `inventoryTableStyles` and the existing toolbar.
- [x] 5.4 Leave the Import and Export buttons, the search box, the date-range picker and the column-visibility dropdown as they are.

## 6. Tests and verification

- [x] 6.1 Add `features/inventory/tests/lib/inventory-cells.test.ts` covering: untracked in stock → success label; untracked out of stock → critical label; tracked with stock → number in default colour; tracked at zero → number in critical; tracked low stock → number in critical; committed zero → dash; committed positive but untracked → dash; committed positive and tracked → number.
- [x] 6.2 Run `npm test` in `resources/app/` — the new suite passes and the `bulk-edit` and `products` suites are unaffected. 103 files / 774 tests pass; the new `features/inventory` suite contributes 9.
- [x] 6.3 Run `npm run typecheck` in `resources/app/` — this is what proves every reader of the trimmed schema was updated. Clean; confirmed the check actually runs by probing it with a deliberate type error first.
- [x] 6.4 Run `npm run lint` in `resources/app/`. 17 errors reported, all pre-existing in files this change does not touch (orders, product-form, utils/index.ts). `eslint` over `features/inventory` and the two schema files exits 0.
- [x] 6.5 Confirm no orphans remain: `grep -rn "useInventoryForm\|InventoryFormProvider\|stock_quantity" resources/app` returns nothing.
- [x] 6.6 Do not open a browser preview (project rule). Hand the screen to the user for visual confirmation against the design.

- [x] 6.7 **Added during apply:** run the PHP suites. `composer test:unit` passes (173 tests, 281 assertions). `tests/Integration/VariantApiTest.php` exercises `InventoryResource::to_array()` and would catch a fatal in the new availability wiring, but the integration suite needs a WordPress test library that is not installed on this machine — **not run**. Install it (`composer test:docker:install && composer test:docker:integration`, or `bash bin/install-wp-tests.sh`) before merging.
