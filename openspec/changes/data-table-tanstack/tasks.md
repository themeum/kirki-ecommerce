## 1. Dependency and types

- [ ] 1.1 `npm i @tanstack/react-table` in `resources/app/`
- [ ] 1.2 Augment `ColumnMeta` in `resources/app/global.d.ts` (alongside the existing Emotion `Theme` augmentation) with `alignment?: TableAlignment` and `cssOverride?: CSSObject`. It goes here so the required `interface` keyword stays out of files linted by `consistent-type-definitions: 'error'`
- [ ] 1.3 Reshape `components/data-table/types.ts`: add `DataTableSelectionState = { selectedIds: string[]; isAllMatchingSelected: boolean; selectedCount: number }`; keep `DataTableItem` and the row-action config types; delete `DataTableColumn`, `DataTableBulkApplyPayload`, `DataTableRowActionsResolver` and `EMPTY_PAGE`
- [ ] 1.4 Verify: `npm run typecheck && npm test` in `resources/app/` — the 3 current consumers will now fail to compile; that is expected until `data-table-migrate-catalog`

## 2. Params binding hook

- [ ] 2.1 Create `resources/app/hooks/use-data-table-params.ts` wrapping `use-list-params.ts`, returning `{ params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey, setParam, setParams }`
- [ ] 2.2 Implement the page-base conversion in both directions: `pageIndex = params.page - 1` on read, `page = pageIndex + 1` on write. Missing or `1` in the URL means index `0`
- [ ] 2.3 Implement the sort conversion: `params.sort_by` + `params.sort_order` ↔ `SortingState` (`[{ id, desc }]`). Empty sort state means no `sort_by` update
- [ ] 2.4 Derive `selectionResetKey` from the search term and filter keys only — destructure out `page`, `limit`, `sort_by`, `sort_order` before serialising, mirroring the signature the deleted selection context computed
- [ ] 2.5 Wrap `onPaginationChange` / `onSortingChange` in `useCallback` over the stable `setParams` so they keep stable identities across URL changes. They must accept TanStack's updater-function form as well as a plain value
- [ ] 2.6 Export from `resources/app/hooks/index.ts`
- [ ] 2.7 Write `resources/app/hooks/use-data-table-params.test.ts` (needs a router wrapper): page 1 and absent page both yield index 0; page 4 yields index 3; reporting index 3 writes page 4; sort round-trips; changing search or a filter changes `selectionResetKey`; changing page, limit or sort does not; handler identities are stable across a URL change
- [ ] 2.8 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. DataTable core

- [ ] 3.1 Rewrite `components/data-table/data-table.tsx` around one `useReactTable` instance: `manualPagination: true`, `manualSorting: true`, `manualFiltering: true`, `getCoreRowModel()` only, caller-supplied `pageCount`, and controlled `state: { pagination, sorting, rowSelection, columnPinning, columnVisibility }`. Do not add `getFilteredRowModel` / `getSortedRowModel` / `getPaginationRowModel` — they would re-process already-server-processed rows
- [ ] 3.2 Default `getRowId` to `String(row.id)`. Without this TanStack keys selection by array index and selection silently follows positions across pages
- [ ] 3.3 Render the header from `table.getHeaderGroups()`; a header is sortable only when `column.getCanSort()`, and reports through `column.toggleSorting()`. Carry `meta.alignment` onto the header cell
- [ ] 3.4 Render the body from `table.getRowModel().rows` via `flexRender`, carrying `meta.alignment` and `meta.cssOverride` onto each cell. Keep the existing row-click and per-cell click-stops-propagation behaviour
- [ ] 3.5 When `enableRowSelection`, prepend a `{ id: 'select', size: 40, enableSorting: false }` column: header checkbox from `getIsAllPageRowsSelected()` with `isPartialChecked` from `getIsSomePageRowsSelected()`, cells from `row.getIsSelected()`. Keep `onlyCheckbox` on both cells and stop click propagation
- [ ] 3.6 Implement `isAllMatchingSelected` as component state: setting it clears the per-row selection map and makes the reported `selectedCount` the total; toggling any individual row leaves the mode
- [ ] 3.7 Report `{ selectedIds, isAllMatchingSelected, selectedCount }` through `onRowSelectionChange` from an effect keyed on the selection state — not during render, or a caller storing it in state can loop
- [ ] 3.8 Clear the selection in an effect on `selectionResetKey` change. Paging and sorting must not clear it
- [ ] 3.9 Loading: when `isLoading`, replace the body with one row containing `ui/spinner`, `colSpan={table.getVisibleLeafColumns().length}`. Header, `toolbar`, `filterBar` and pagination all stay mounted; pagination is passed `disabled`
- [ ] 3.10 Empty: when not loading and there are no rows, render `emptyState ?? <DataTableEmptyState />` in a spanning row using the same visible-column count
- [ ] 3.11 Pinning: for pinned cells apply `position: sticky` plus background and z-index through `scopedMerge`, and the offset from `column.getStart('left')` / `column.getAfter('right')` through the `style` prop, since those are runtime-computed
- [ ] 3.12 Compose the layout: `Card` › `CardContent` › toolbar-or-selection-bar › `filterBar` › `Table` › `Pagination` (from `ui/pagination`, this change's first consumer), with `hidePagination` to opt out
- [ ] 3.13 Delete `data-table-context.tsx`, `data-table-selection-context.tsx`, `data-table-header.tsx`, `data-table-body.tsx`, `data-table-toolbar.tsx`, `data-table-slots.tsx`, `data-table-pagination.tsx`. The `useListParams()` call inside the selection context is deleted, not relocated
- [ ] 3.14 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Empty state, selection bar, row actions

- [ ] 4.1 Create `components/data-table/data-table-empty-state.tsx` composing the existing `ui/empty-state.tsx` (`{ icon?, text, cssOverride? }`), with a translated default message via `__()` and domain `kirki-ecommerce`
- [ ] 4.2 Create `components/data-table/data-table-selection-bar.tsx` presenting the selected count, the bulk-action select and apply control, and the select-all-matching offer. Show that offer only when the total exceeds the rows currently shown. Clear the selection after the caller's `onBulkApply` resolves
- [ ] 4.3 Use a translated, `sprintf`-interpolated selected-count string — `BulkActionHandler`'s existing `${itemCount} items selected` is untranslated and must not be carried over
- [ ] 4.4 Keep `data-table-row-actions.tsx` as a presentational component for features to render inside their own actions column; drop the resolver plumbing. Retain the `data-action-group` attribute so the primitives' hover-reveal applies
- [ ] 4.5 Rewrite `components/data-table/index.ts` to export `DataTable`, `DataTableRowActions`, `DataTableEmptyState` and the types. Remove the `Object.assign` namespace (`Filter`, `SelectionFilter`, `FilterBar`, `Pagination`)
- [ ] 4.6 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Component tests

- [ ] 5.1 Create `components/data-table/data-table.test.tsx`. Render outside any router in at least one test, to prove the component no longer depends on one
- [ ] 5.2 Loading: with `isLoading` **and rows still present** (the `keepPreviousData` shape), the spinner shows and the stale rows do not; the header cells remain in the DOM; toolbar and filter bar remain; the pagination bar remains but is inert
- [ ] 5.3 Empty: no rows and not loading shows the default empty state; a supplied `emptyState` replaces it; loading with no rows shows the spinner and not the empty state
- [ ] 5.4 Paging: activating a page control reports a 0-based `pageIndex`, and the rendered rows do not change until new `data` is supplied
- [ ] 5.5 Sorting: activating a sortable header reports that column's `id`; a column without `enableSorting` renders no sort affordance and does not report
- [ ] 5.6 Selection: no selection column unless `enableRowSelection`; selecting a row reports its entity id; re-supplying the same entities in a different order keeps them selected; a partially selected page shows the indeterminate header state
- [ ] 5.7 Select-all-matching: choosing it reports `isAllMatchingSelected` with `selectedCount` equal to the total; the offer is absent when the total does not exceed the rows shown; `onBulkApply` receives both the ids and the flag
- [ ] 5.8 Selection lifecycle: changing `selectionResetKey` clears the selection; changing the page does not
- [ ] 5.9 Pinning and visibility: a pinned column's cells are `position: sticky`; a hidden column renders no header and no cells, and the loading row's `colSpan` counts only visible columns
- [ ] 5.10 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Final verification

- [ ] 6.1 Run `npm run typecheck && npm run lint && npm test` in `resources/app/`
- [ ] 6.2 Confirm the only remaining typecheck failures are the 3 unmigrated consumers (`product-table.tsx`, `order-table.tsx`, `coupon-table.tsx`) still using the old API. Any other failure is in scope for this change
- [ ] 6.3 Confirm no file under `components/data-table/` imports `use-list-params`, `useMarkList`, `react-router` or `BulkActionHandler`
- [ ] 6.4 Confirm no `as unknown as` cast remains in `components/data-table/`
