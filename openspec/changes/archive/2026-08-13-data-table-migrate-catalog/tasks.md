## 1. Products table

- [x] 1.1 Create `features/products/components/product-table/columns.tsx` — move the module-scope `productColumns` array to `ColumnDef<ProductListItem>[]`, keeping `ProductTitleCell` (it uses `useNavigate`, so it stays a component the cell renders). Give each column an `id` matching its API field name (`title`, `sku`, `inventory`, `base_price`, `status`, `created_at`) and leave `enableSorting` off — this table does not sort today
- [x] 1.2 Carry the existing `alignment` values over to `meta.alignment`, and any `cssOverride` to `meta.cssOverride` — no-op for products: the original `productColumns` had no `alignment` or `cssOverride` values to carry over
- [x] 1.3 Rename `product-table-filter.tsx` → `product-table-filters.tsx`; contents unchanged
- [x] 1.4 Rewrite `product-table.tsx`: `useDataTableParams(productListOptions)`, `useProductsQuery(params)`, and a DataTable taking `data={data?.results ?? []}`, `pageCount={data?.last_page ?? 0}`, `pagination`, `sorting`, the two change handlers, `selectionResetKey`, `enableRowSelection`, `bulkActionOptions={productBulkActions}` (the DataTable component's actual prop name — `bulkActions` in this task's wording doesn't match the merged `data-table-tanstack` component), `onBulkApply`, and `toolbar` / `filterBar` props instead of slot children
- [x] 1.5 Pass **`isFetching`** from `useProductsQuery` into `isLoading` — not `isLoading`, which `keepPreviousData` pins to `false` after the first fetch. This is the whole point of the change
- [x] 1.6 Keep `onBulkApply` delegating to `resolveBulkDeletePayload(isAllMatchingSelected, selectedIds)` — the existing two-argument contract is unchanged, only the field names it reads from are
- [x] 1.7 Verify: `npm run typecheck && npm test` in `resources/app/`

## 2. Orders table

- [x] 2.1 Create `features/orders/pages/order-table/columns.tsx` — move the column array out of the `useMemo(..., [])` in `order-table.tsx:63` to module scope as `ColumnDef<OrderListItem>[]`, keeping `OrderCell`. Remove the now-unused `useMemo` import
- [x] 2.2 Give columns ids matching their API field names and carry `alignment` (`center` on five of six) to `meta.alignment`, and the `{ width: '10%' }` on the Order column to `meta.cssOverride` — the combined fulfillment/payment "Status" column has no single backing API field, so it's given `id: 'status'`, matching the convention products uses for its own status column
- [x] 2.3 Rename `order-table-action.tsx` → `order-table-filters.tsx` so all three features use one name for the toolbar region; update its import
- [x] 2.4 Delete `features/orders/pages/order-table/table-info.tsx` — dead code, no importers
- [x] 2.5 Rewrite `order-table.tsx` with `useDataTableParams(orderListOptions)`, `useOrdersQuery`, `enableRowSelection`, `selectionResetKey`, `onRowClick` navigating to the order detail route, and the `toolbar` / `filterBar` props
- [x] 2.6 Pass **`isFetching`** into `isLoading`
- [x] 2.7 Leave the bulk bar action-less, as today — orders passes no `bulkActionOptions`. Do not invent bulk actions for orders; note it as a pre-existing gap for a product decision
- [x] 2.8 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Coupons table

- [x] 3.1 Create `features/coupons/pages/coupon-table/columns.tsx` — move `couponColumns` to `ColumnDef<CouponListItem>[]` with ids matching API field names
- [x] 3.2 Add the actions column to `columns.tsx` as `{ id: 'actions' }`, pinned to the trailing edge, whose cell renders the retained `DataTableRowActions` with that row's config. Port the per-row logic from the current `rowActions` resolver (duplicate / activate / delete, gated on coupon status) verbatim into the cell renderer — as a `CouponRowActionsCell` component (needs `useNavigate` and the coupon-action/delete mutation hooks), following the same "cell renders a component that holds hook-dependent behaviour" pattern as `ProductTitleCell`/`OrderCell`
- [x] 3.3 Rename `coupon-table-filter.tsx` → `coupon-table-filters.tsx`
- [x] 3.4 Rewrite `coupon-table.tsx`: `useDataTableParams(couponListOptions)`, `useCouponsQuery`, `enableRowSelection`, `selectionResetKey`, `bulkActionOptions={couponBulkActions}`, `onBulkApply`, `columnPinning={{ right: ['actions'] }}`, and the region props. Remove the `rowActions` prop and the `DataTableRowActionsResolver` import
- [x] 3.5 Pass **`isFetching`** into `isLoading`
- [x] 3.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Cross-cutting verification

- [x] 4.1 Run `npm run typecheck && npm run lint && npm test` in `resources/app/`. A clean typecheck here is the signal that the new DataTable API is complete enough for the remaining eight tables — all clean (typecheck: 0 errors, lint: 0 errors, tests: 570/570 passed)
- [x] 4.2 Confirm no file in these three features still imports `DataTable.Filter`, `DataTableColumn`, `DataTableBulkApplyPayload`, `DataTableRowActionsResolver` or `components/pagination` — confirmed via grep, no matches
- [x] 4.3 Confirm each of the three passes `selectionResetKey` — without it a selection survives a filter change, a regression against current behaviour — confirmed, all three do
- [x] 4.4 Run `npm run build` in `resources/app/` — succeeded
- [x] 4.5 If any of this required changing the DataTable's own props, fix it in `components/data-table/` and record a "Correction during implementation" note in `data-table-tanstack`'s `design.md` — not needed: the merged `data-table-tanstack` component's actual prop is `bulkActionOptions` (not `bulkActions`, which was this change's own tasks.md wording); no change to `components/data-table/` was required. Also added an eslint override for `**/columns.tsx` (`kirki/data-table-columns` in `eslint.config.js`) so the module-scope columns array can share a file with its hook-using cell components (e.g. `ProductTitleCell`, `CouponRowActionsCell`) without tripping `react-refresh/only-export-components` — this is a lint-config fix for the file shape the `list-table-composition` spec itself mandates, not a DataTable component change
- [ ] 4.6 Manual check in wp-admin (this project does no browser-based verification): for each of the three tables, type a search term and confirm a spinner replaces the rows while headers, toolbar, filter bar and pagination stay put; confirm bulk delete works both for individually selected rows and via select-all-matching; confirm coupons' row actions still appear on hover and fire correctly; confirm clicking an order row still navigates; confirm a filter change clears an active selection — **left for the user**, per this project's CLAUDE.md instruction to skip browser-based verification
