## Why

The product form's variant table shows an editable **Inventory** column of raw `available_quantity` / `in_stock` inputs. It reports a number, not a state, and it cannot express "low stock" at all — because the threshold the UI already collects (`min_stock_threshold`) has no database column and is discarded by PHP on every save. The `product-inventory-card` spec even codifies this gap: the value "MUST be included in the variant payload on product save **even if the backend does not yet persist it**."

Merchants consequently cannot tell, at a glance, whether a product is healthy, running low, partly unavailable, or gone — neither in the variant table nor on the product listing, where a product with inventory tracking disabled always displays a misleading `0`.

## What Changes

- Persist a per-variant `low_stock_threshold` column, completing the half-built threshold field. **BREAKING**: the frontend field `min_stock_threshold` is renamed to `low_stock_threshold` across schemas, form state, and the Inventory card.
- Introduce a two-layer availability algorithm: Layer 1 resolves a single variant to In Stock / Low Stock / Out of Stock; Layer 2 resolves a set of variant statuses to In Stock / Low Stock / Out of Stock / **Partially Stocked**.
- Add a store-level default threshold in product settings, with the per-variant value overriding it.
- Replace the variant table's editable Inventory column with a read-only **Availability** column — Layer 1 on child rows, Layer 2 on group parent rows.
- Replace the product listing's numeric `inventory` column with the Layer 2 availability label.
- **BREAKING**: rename the product-list filter parameter `inventory_type` to `availability_status` and widen it from two values to four. The frontend currently sends a third name, `stock_status`, that the backend never reads, so this filter is inert today.
- Add a per-variant "Low stock threshold" column to the bulk-edit table, and rename that table's existing "Availability" column — which holds a quantity — to "Quantity".
- Rework the variant table's group parent row: an inline price-range editor that writes to every child, and media that stays empty until every child has media, then stacks when the children's media differ.
- Rename the variation table to the variants table throughout — directory, files, components, and user-facing copy.

Explicitly out of scope: storefront and customer-facing availability display; reconciling `InventoryService::has_stock()`, which treats a back-orderable variant at zero quantity as sellable while the new label will read "Out of Stock".

## Capabilities

### New Capabilities

- `variant-availability-status`: The two-layer algorithm — threshold resolution, per-variant status, product-level status, the labels, their exposure through the variant and product resources, and filtering the product list by them.
- `variants-table`: The product form's variants table — its columns, group parent and child row composition, the read-only availability display, the inline price-range editor, and parent media aggregation.

### Modified Capabilities

- `product-inventory-card`: The Minimum stock threshold field is renamed to Low stock threshold, binds to `variants.0.low_stock_threshold`, and is now actually persisted by the backend — removing the requirement's explicit allowance that it need not be.
- `product-variant-matrix`: A generated variant must inherit its ancestor's `low_stock_threshold`. The existing requirement enumerates what is inherited (settings) versus what is reset (identity and stock); the new field is a setting and needs to be classified.

## Impact

**Database**: new `low_stock_threshold` column on `kirki_ecommerce_variants`, added via an alter migration appended to the end of `config/migrations.php`.

**PHP**: new `App\Constants\Product\AvailabilityStatus` and an availability service holding both layers. Threaded field through `Variant` model, `CreateVariantDTO`/`UpdateVariantDTO`, `ProductCreateRequest`, `ProductUpdateRequest`, `BulkUpdateVariantRequest`. Status emitted from `VariantResource`, `ProductListResource`, `ProductResource`, `ProductListWithVariantsResource`. Filter reworked in `ProductListRequest`, `ProductListFilterDTO`, `ProductService::apply_filters()`. `App\Constants\InventoryType` is left untouched — it still serves the variant-level inventory list, which can never be Partially Stocked.

**Settings**: `resources/data/settings/product.json` gains `low_stock_threshold`, defaulting to `0` so no existing store's labels change on upgrade; validated in `SettingsUpdateRequest`; exposed on the products settings page.

**Frontend**: new `features/products/lib/availability.ts` mirroring both layers for live form state, since newly generated variants have no server-side existence and form values change as the merchant types. The `variation-table/` directory is renamed and its components reworked; `lib/variant-group.ts` must expose min/max as numbers and deduplicate media. The product table's columns and filter bar change, as do the bulk-edit table's columns.

**Tests**: the existing `variant-group.test.ts` deliberately pins two current bugs — duplicated parent media and a single-space sentinel for mixed stock — with a comment saying so. Those assertions change. PHP and TypeScript availability tests must assert the same case table so the two implementations cannot drift.
