## 1. Precondition

- [x] 1.1 Confirm `data-table-migrate-remaining` is fully applied — its task 8.2 (nothing outside `components/` imports `useMarkList`, `bulk-action-handler`, `sorting` or `pagination`) is this change's entry condition. If it is not met, stop and finish that change first — confirmed done in that change's tasks.md
- [x] 1.2 Verify: `npm run typecheck && npm test` in `resources/app/` is green **before** deleting anything, so any error later in this change is unambiguously caused by it — typecheck clean, 82 files / 570 tests passed

## 2. Delete the replaced components

- [x] 2.1 Search for importers of `@/components/pagination`, then delete `resources/app/components/pagination.tsx`. Its `getPageItems` already moved to `utils/pagination.ts` in `table-pagination-primitives` — confirm the util is the only remaining copy — zero importers found; deleted; `utils/pagination.ts` is the only remaining `getPageItems`
- [x] 2.2 Search for importers of `@/components/sorting`, then delete `resources/app/components/sorting.tsx`, including its exported `SortableConfig` type — **premise revised per explicit user direction**: `components/data-table/data-table.tsx` was the sole surviving consumer (used `Sorting`'s button-styled arrow-icon click target). Per user instruction, inlined the sortable-header rendering directly into `data-table.tsx` (clicking the column header title itself — not a separate button — now calls `header.column.toggleSorting()`, with the same `ArrowDownUpFilled` top/bottom indicator driven by `header.column.getIsSorted()` instead of manually-threaded props), then deleted `sorting.tsx` and confirmed zero remaining references to `SortableConfig`/`SortingData`. Server-side sorting (`manualSorting: true`, `params` sent to each feature's query hook) and URL query-param persistence (`sort_by`/`sort_order` via `useListParams`/`useDataTableParams`) were already in place beforehand — confirmed, not newly added
- [x] 2.3 Search for importers of `@/components/bulk-action-handler`, then delete `resources/app/components/bulk-action-handler.tsx`. Confirm its untranslated `${itemCount} items selected` string has a translated equivalent in the DataTable's selection bar rather than being lost — zero importers found; deleted; confirmed `data-table-selection-bar.tsx` has `sprintf(__('%s selected', 'kirki-ecommerce'), selectedCount)` as the translated equivalent
- [x] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/` — clean (typecheck passes, 82 files / 570 tests pass) after 2.1, 2.2 (inlined) and 2.3 all deleted

## 3. Delete the replaced hook

- [x] 3.1 Search for importers of `useMarkList`, then delete `resources/app/hooks/useMarkList.ts` and remove its export from `resources/app/hooks/index.ts` — zero external importers found; deleted both
- [x] 3.2 Verify: `npm run typecheck && npm test` in `resources/app/` — clean

## 4. Remove the orphaned types

- [x] 4.1 Remove `MarkListHandlers` and `TaxonomyTableHeader` from `resources/app/types/pages/common.ts`. Delete the file if nothing else remains in it — removed both types and their export entries; file retains other types (`FormErrors`, `DateFormatType`, etc.), not deleted
- [x] 4.2 Remove `PaginationData` from `resources/app/types/components/common.ts`. Any resulting error marks a call site that was reading `from` or `has_more_pages` — fields the API's `PaginatedData<T>` does not return — so fix the call site rather than reinstating the type — zero consumers besides the already-deleted `pagination.tsx`; removed cleanly, no call-site errors
- [x] 4.3 Confirm `TableType` is already gone (renamed to `TableDensity` in `table-pagination-primitives`) and that no `TableEditMode` remains anywhere — confirmed by search: zero hits for either name; `TableDensity` present in `types/components/common.ts`
- [x] 4.4 Remove the legacy `ListState` type and `parseBoolean` from `resources/app/types/list-state.ts`, along with their entries in that file's export lists. Both are already referenced nowhere; re-confirm with a search before deleting — re-confirmed zero references; removed both plus their export entries
- [x] 4.5 Verify: `npm run typecheck && npm test` in `resources/app/` — clean

## 5. Final verification

- [x] 5.1 Run `npm run typecheck && npm run lint && npm test` in `resources/app/` — typecheck and test clean (82 files / 570 tests); lint has exactly the two pre-existing errors design.md documented as expected (`components/ui/table.tsx:188`, `categories.tsx`), both untouched by this change
- [x] 5.2 Run `npm run build` in `resources/app/` — succeeds
- [x] 5.3 Search the app for `useMarkList`, `BulkActionHandler`, `SortableConfig`, `PaginationData`, `MarkListHandlers`, `TaxonomyTableHeader`, `TableEditMode` and `single-row` — expect zero hits outside `openspec/` — all zero except `single-row`, which matches only `features/bulk-edit/pages/bulk-edit-table/single-row.tsx`: a distinct hand-built editable-grid row component (its own `useBulkEditRow` hook, not `DataTable`/`ColumnDef`-based), never part of either migration's scope — not a leftover
- [x] 5.4 Run `npx knip` in `resources/app/` as an advisory cross-check only. It has no config file, so expect pre-existing unrelated findings; the point is that nothing table-related appears, not that the run is clean — ran; confirmed zero matches for sorting/pagination/bulk-action/marklist/single-row across the full output
- [x] 5.5 Confirm exactly one pagination component (`components/ui/pagination.tsx`), one table primitive module (`components/ui/table.tsx`) and one selection model (TanStack row selection inside `components/data-table/`) remain — confirmed by search: only `components/ui/pagination.tsx` (plus the pure `utils/pagination.ts` helper), only `components/ui/table.tsx`, and `RowSelectionState`/`rowSelection` used only inside `components/data-table/`
