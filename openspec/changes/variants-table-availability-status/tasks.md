## 1. Persist the low stock threshold

- [x] 1.1 Add `database/migrations/AddLowStockThresholdToVariantsTable.php` — nullable integer on `kirki_ecommerce_variants`, positioned after `committed_quantity`, with a `down()` that drops it. Follow `AddIsDefaultToShippingProfilesTable.php`.
- [x] 1.2 Append the migration class to the **end** of `config/migrations.php` (ordered list — append only, never insert)
- [x] 1.3 Add `low_stock_threshold` to `Variant::$fillable` and cast it as integer in `$casts`
- [x] 1.4 Add the property to `CreateVariantDTO` and `UpdateVariantDTO`
- [x] 1.5 Add `variants.*.low_stock_threshold` rules and `Sanitizer::INT` filters to `ProductCreateRequest`, `ProductUpdateRequest`, and `BulkUpdateVariantRequest`
- [x] 1.6 Emit the raw value from `VariantResource`
- [x] 1.7 Verify the round trip: save a threshold, reload the product, confirm the value returns; then confirm `down()` drops the column

## 2. Store-level default

- [x] 2.1 Add `"low_stock_threshold": 0` to `resources/data/settings/product.json`
- [x] 2.2 Add the rule and filter to `SettingsUpdateRequest::get_product_settings_rules()` and `get_product_settings_filters()`
- [x] 2.3 Add the field to `features/settings/products/schemas/forms/products-settings-form.ts` and render a `NumberField` on `products-settings.tsx`
- [x] 2.4 Update `features/settings/products/tests/schemas/forms/products-settings-form.test.ts` for the new payload key

## 3. Availability algorithm — PHP

- [x] 3.1 Add `app/Constants/Product/AvailabilityStatus.php` — `final class`, `use HasConstants`, four constants, static `get_list()` of translated labels. Follow `app/Constants/Order/OrderStatus.php`.
- [x] 3.2 Add an availability service exposing Layer 1 (single variant) and Layer 2 (set of statuses) as pure functions taking the store default as an argument, per `specs/variant-availability-status/spec.md`
- [x] 3.3 Add PHP unit coverage for every Layer 1 branch and all four Layer 2 outcomes, including the order-independence pair and the empty-group case. This case table must match the TypeScript suite in 6.2.
- [x] 3.4 Leave `app/Constants/InventoryType.php` untouched — it still serves the variant-level inventory list

## 4. Expose status through the API

- [x] 4.1 Emit `availability_status` + `availability_label` (Layer 1) from `VariantResource`
- [x] 4.2 Emit `availability_status` + `availability_label` (Layer 2 over `$this->variants`) from `ProductListResource`, calling the service directly rather than reusing `VariantResource` — the list query does not eager-load `variants.product`
- [x] 4.3 Emit the same product-level keys from `ProductResource` and `ProductListWithVariantsResource`
- [x] 4.4 Guard the zero-variant case so no status is emitted rather than defaulting to one
- [x] 4.5 Confirm no customer-facing response changed — `CartResource`, `PageInlineScript`, and `SiteController::products_html` stay untouched

## 5. Filter the product list by availability

- [x] 5.1 Rename `inventory_type` to `availability_status` on `ProductListRequest` and `ProductListFilterDTO`, validating against `AvailabilityStatus::get_constant_values()`
- [x] 5.2 Rewrite the product-list stock predicate in `ProductService::apply_filters()` as the `EXISTS`/`NOT EXISTS` form in `design.md`, binding the store default for `COALESCE(low_stock_threshold, :default)`
- [x] 5.3 Leave `VariantListRequest` and `VariantService::list_query()` on `InventoryType`
- [x] 5.4 Verify filtering is server-side and paginated: each of the four values returns only matching products, across more than one page, with a correct total

## 6. Availability algorithm — TypeScript

- [x] 6.1 Add `resources/app/features/products/lib/availability.ts` — Layer 1 and Layer 2 as pure functions, no React, store default passed in
- [x] 6.2 Add `features/products/tests/lib/availability.test.ts` asserting the same case table as 3.3

## 7. Rename the frontend threshold field

- [x] 7.1 Rename `min_stock_threshold` to `low_stock_threshold` in `schemas/catalog/variant.ts` and `schemas/forms/product-form.ts` (shape, transform output, and default variant)
- [x] 7.2 Relabel the Inventory card field to "Low stock threshold" and rebind it to `variants.0.low_stock_threshold`
- [x] 7.3 Update the fixtures in `features/products/tests/schemas/forms/product-form.test.ts`, `features/products/tests/lib/variant-group.test.ts`, and `features/bulk-edit/tests/lib/fill-down.test.ts`
- [x] 7.4 Confirm no `min_stock_threshold` occurrences remain anywhere in `resources/app/`

## 8. Group aggregation helpers

- [x] 8.1 Change `getCombinedVariantData` to expose min and max price as numbers instead of a formatted string
- [x] 8.2 Fix its media seeding so the first child is not counted twice, and deduplicate media by id
- [x] 8.3 Remove the mixed-stock sentinel, which becomes dead once the Inventory column is gone
- [x] 8.4 Update the two `variant-group.test.ts` assertions that deliberately pin the duplicate-media and sentinel behavior, and add coverage for distinct-media counting

## 9. Variants table rework

- [x] 9.1 Rename the directory to `variants-table/` and its files and components (`VariantsTable`, `VariantGroup`, `use-variant-group`), updating the importing section
- [x] 9.2 Update user-facing copy — "variants"/"variant" subtitle, "Edit Variants" action
- [x] 9.3 Replace the Inventory column with a read-only Availability column: Layer 1 on child rows, Layer 2 over the group on parent rows, rendered as `<Text>` with In Stock and Partially Stocked in `secondary` and Low Stock and Out of Stock in `critical`
- [x] 9.4 Remove the quantity/stock controls from parent and child cells, and drop the bulk quantity/stock control from the selection header while keeping bulk price
- [x] 9.5 Render the parent price as a range with the currency symbol shown once, collapsing to a single price when min equals max or the group has one child
- [x] 9.6 Make the parent price editable via a nested single-field form provider hosting `MoneyField`; propagate on each keystroke to every child in the group, skipping input that does not parse to a number; restore the range display on blur
- [x] 9.7 Show parent media only when every child has media — flat thumbnail for one distinct media, stacked for more than one — and keep parent assignment overwriting all children
- [x] 9.8 Confirm child labels join all remaining attribute values and are left-aligned

## 10. Bulk-edit table

- [x] 10.1 Retitle the existing `available_quantity` column from "Availability" to "Quantity" (label only — the value key is unchanged)
- [x] 10.2 Add a "Low stock threshold" column bound to `low_stock_threshold`, mirroring the `available_quantity` cell including its grabber and fill-down handlers

## 11. Product listing

- [x] 11.1 Replace the `inventory` column with an availability column in `product-table/columns.tsx`, rendered with the same `<Text>` colour mapping as 9.3
- [x] 11.2 Update `ProductListItemSchema` — drop `inventory`, add `availability_status` and `availability_label`
- [x] 11.3 Rename `stock_status` to `availability_status` in `features/products/types.ts` and widen `product-table-filter-bar.tsx` from two options to four (note: the two-option 2→4 Select actually lives in `filter-popup.tsx`, not the capsule bar; both were updated, along with the parallel `select-products-dialog`/`product-filter-popup.tsx` picker filter, which hits the same renamed backend param and would otherwise have stayed silently broken)

## 12. Verification

- [x] 12.1 `npm run typecheck` and lint clean
- [x] 12.2 `npm test` in `resources/app/` green, including the new availability suite and the updated variant-group assertions
- [x] 12.3 PHP availability tests green, asserting the same case table as the TypeScript suite
- [x] 12.4 Hand off manual checks to the user per CLAUDE.md §0 — no browser preview: three-attribute product grouped by each attribute in turn; a group showing Low Stock with one low child, then Partially Stocked once restocked; parent price edit collapsing the range; parent media staying empty until the last child is filled, then stacking only when images differ; listing label matching the form; all four filter values
