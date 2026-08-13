## 1. Brands — the archetype

Land this one completely before starting any other table; categories and tags are copied from it.

- [ ] 1.1 Add a module-scope `brandListOptions` constant to `features/brands/types.ts` (create it if absent) holding the defaults currently duplicated in `pages/brands.tsx`, `brand-table.tsx` and `brand-table-action.tsx` — `{ search: '', sort_by: 'name', sort_order: 'asc', page: 1, limit: 10 }`
- [ ] 1.2 Create `features/brands/components/brand-table/columns.tsx` as a module-scope `ColumnDef<Brand>[]`, porting the cells from `single-row.tsx`: name, logo thumbnail, description, slug, count. Preserve the `|| '--'` / `?? 0` fallbacks
- [ ] 1.3 Set `enableSorting: true` with ids taken **verbatim** from the current `Sorting` configs — `name`, `description`, `slug`, `count`. The image column stays unsortable. Verify each id against `services/brand` rather than inferring it from the column heading
- [ ] 1.4 Add the actions column as `{ id: 'actions' }` pinned to the trailing edge, rendering `DataTableRowActions` (edit + destructive delete). Its cell calls back to the table rather than owning state
- [ ] 1.5 Rename `brand-table-action.tsx` → `brand-table-filters.tsx` and point it at `brandListOptions`
- [ ] 1.6 Rewrite `brand-table.tsx`: `useDataTableParams(brandListOptions)`, `useBrandsQuery(params)`, one `editingItem` state driving a single `BrandAddEditPopover` (keyed on the item id so switching rows remounts it), one `useDeleteBrandMutation`, `useBulkDeleteBrandsMutation` behind `onBulkApply`, `enableRowSelection`, `selectionResetKey`, `columnPinning={{ right: ['actions'] }}`, `density="compact"`, and `toolbar` / `filterBar` props
- [ ] 1.7 Pass **`isFetching`** from `useBrandsQuery` into `isLoading`
- [ ] 1.8 Delete `features/brands/components/brand-table/single-row.tsx`
- [ ] 1.9 Strip `pages/brands.tsx` down to its heading and page actions: remove `useListParams`, the query, the `loaded` gate, `Card`/`CardContent`, `Pagination` and the `PaginationData` cast. Remove the now-dead `isFetching` prop from the table's props type
- [ ] 1.10 Verify: `npm run typecheck && npm test` in `resources/app/`

## 2. Categories and tags

- [ ] 2.1 Repeat group 1 for categories: `categoryListOptions`, `columns.tsx`, `category-table-filters.tsx`, rewritten `category-table.tsx`, deleted `single-row.tsx`, stripped `pages/categories.tsx`. `density="compact"`
- [ ] 2.2 Repeat group 1 for tags — note tags does **not** pass `type="variation"` today, so it takes the default density, not `compact`
- [ ] 2.3 Diff all three table components against each other; any difference that is not a genuine feature difference is an accident from copying
- [ ] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Collections and customers

- [ ] 3.1 Collections: `collectionListOptions`, `columns.tsx` from its `single-row.tsx`, `collection-table-filters.tsx`, rewritten table, deleted `single-row.tsx`, stripped `pages/collections.tsx`. Keep `fixed`
- [ ] 3.2 Leave collections' toolbar sort-toggle button as it is, wired to the same params. Do not convert it to sortable headers — that is a UI change, not a migration
- [ ] 3.3 Leave collections' disabled date filter in place, still disabled
- [ ] 3.4 Customers: `customerListOptions`, `columns.tsx`, `customer-table-filters.tsx`, rewritten table, deleted `single-row.tsx`, stripped `pages/customers.tsx`. Sorting stays on the customer column only
- [ ] 3.5 Leave customers' disabled date filter and non-functional filter button exactly as they are
- [ ] 3.6 Note that `pages/customers.tsx` uses `cardStyles.formCard` and a bare `CardContent`, unlike the other five — after adopting the DataTable's own card its spacing will change. Flag it for the visual check in group 8
- [ ] 3.7 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Inventory

- [ ] 4.1 Create `columns.tsx` from `inventory-table/single-row.tsx`, delete `single-row.tsx`
- [ ] 4.2 Keep the form-backed data source: read rows from `useInventoryForm()` and convert the keyed object at the boundary with `Object.values(results)`. Do not introduce a query
- [ ] 4.3 Supply the in-flight signal from the form context's own loading state — inventory has no query, so there is no `isFetching` to pass
- [ ] 4.4 Move the column-visibility dropdown from local `selectedFields` state to the DataTable's `columnVisibility`, keeping the same dropdown UI in `inventory-table-filters.tsx`
- [ ] 4.5 Keep the bulk action navigating to `RouteConfig.BulkVariants` with `?ids=`, now built from the reported `selectedIds` instead of `useMarkList`'s `selectedItems`
- [ ] 4.6 Pass the inventory feature's `singleCell` style module (created in `table-pagination-primitives`) through to the table
- [ ] 4.7 Strip `pages/inventory.tsx` of its `useListParams`, `Card`, `Pagination` and the `loaded && !isLoading` gate, keeping the `useInventoryForm` wiring and the unsaved-changes bar
- [ ] 4.8 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Variation library

- [ ] 5.1 Create `columns.tsx` from its `single-row.tsx`, delete `single-row.tsx`
- [ ] 5.2 Keep the client-side search: continue calling `getSearchedValue(keyword, results)` in the feature and supply the filtered array as the table's rows. Do not ask the DataTable to filter
- [ ] 5.3 Render with paging disabled — this list has no server pages
- [ ] 5.4 Delete the hand-rolled "No data found" Card/Text block; the DataTable's empty state replaces it, so a local search matching nothing looks like every other empty list
- [ ] 5.5 Keep bulk delete going through `confirmAction` from `useOutletContext<SettingsOutletContext>()`
- [ ] 5.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Customer groups (mock)

- [ ] 6.1 Rebuild `customer-group-table.tsx` on the DataTable with its existing mock array as the rows and real local row selection replacing the `noop` handlers. `density="wide"`
- [ ] 6.2 Put its header strings through `__()` with domain `kirki-ecommerce` — `'Group Name'`, `'Members'`, `'Tags'`, `'Created On'` are currently raw literals
- [ ] 6.3 Keep the mock nature obvious in the code so nobody mistakes it for a wired screen, and leave the page's non-functional filter UI alone
- [ ] 6.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 7. The five non-list tables (primitives only)

These keep hand-rolled rows and do not become DataTables.

- [ ] 7.1 `features/bulk-edit/pages/bulk-edit-table/bulk-edit-table.tsx` — drop `scrollable` and `editMode="multiCell"`, pass the bulk-edit style module created in `table-pagination-primitives` as `cssOverride`, keep `style={{ minWidth: '100vw' }}`
- [ ] 7.2 `features/products/components/product-form/sections/variants/variation-table/` — `type="variation"` → `density="compact"` in both files. Check the `TableRow cssOverride={styles.hoverParent}` in `single-group.tsx:82`, whose styles now win where they previously lost to wp-admin CSS
- [ ] 7.3 `features/orders/pages/order-details/items-table.tsx` — compile against the new parts; no prop changes expected
- [ ] 7.4 `features/orders/pages/order-create/components/product-selection-card.tsx` and `order-item/order-item-row.tsx` — same; note this table has no `<thead>` at all, which is valid
- [ ] 7.5 Extract the inline table out of `features/products/components/select-products-dialog.tsx` (398 lines) into `select-products-dialog/product-table.tsx`, keeping its `Set`-based variant-aware selection and its own pagination exactly as they are
- [ ] 7.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 8. Final verification

- [ ] 8.1 Run `npm run typecheck && npm run lint && npm test` in `resources/app/`
- [ ] 8.2 Confirm nothing outside `components/` imports `useMarkList`, `@/components/bulk-action-handler`, `@/components/sorting` or `@/components/pagination` — this is the precondition for `table-stack-cleanup`
- [ ] 8.3 Confirm no `single-row.tsx` remains under `features/{brands,categories,tags,collections,customers,inventory}` or the variation library
- [ ] 8.4 Confirm each feature declares exactly one `*ListOptions` constant and that no `useListParams({ defaults: ... })` object literal remains at a call site
- [ ] 8.5 Run `npm run build` in `resources/app/`
- [ ] 8.6 Manual check per list table in wp-admin (no browser-based verification in this project): search shows a spinner in the row area with headers, toolbar, filter bar and pagination all staying put; an empty result shows the empty state; sorting still sorts on exactly the columns that sorted before and in the right direction; row edit dialogs open for the correct record and still reset when switching rows; single and bulk delete both work, including via select-all-matching; a filter change clears an active selection
- [ ] 8.7 Manual check of the specifically risky items: customers' card spacing after losing its `formCard` wrapper; inventory's column-visibility dropdown and its `?ids=` hand-off to bulk-edit; the variation library's local search and empty state; the bulk-edit grid's drag-fill, grabber handle and sticky first column (pure CSS that changed files, so a clean compile proves nothing); and the product-picker dialog's variant selection after extraction
