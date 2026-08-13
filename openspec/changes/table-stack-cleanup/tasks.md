## 1. Precondition

- [ ] 1.1 Confirm `data-table-migrate-remaining` is fully applied — its task 8.2 (nothing outside `components/` imports `useMarkList`, `bulk-action-handler`, `sorting` or `pagination`) is this change's entry condition. If it is not met, stop and finish that change first
- [ ] 1.2 Verify: `npm run typecheck && npm test` in `resources/app/` is green **before** deleting anything, so any error later in this change is unambiguously caused by it

## 2. Delete the replaced components

- [ ] 2.1 Search for importers of `@/components/pagination`, then delete `resources/app/components/pagination.tsx`. Its `getPageItems` already moved to `utils/pagination.ts` in `table-pagination-primitives` — confirm the util is the only remaining copy
- [ ] 2.2 Search for importers of `@/components/sorting`, then delete `resources/app/components/sorting.tsx`, including its exported `SortableConfig` type
- [ ] 2.3 Search for importers of `@/components/bulk-action-handler`, then delete `resources/app/components/bulk-action-handler.tsx`. Confirm its untranslated `${itemCount} items selected` string has a translated equivalent in the DataTable's selection bar rather than being lost
- [ ] 2.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Delete the replaced hook

- [ ] 3.1 Search for importers of `useMarkList`, then delete `resources/app/hooks/useMarkList.ts` and remove its export from `resources/app/hooks/index.ts`
- [ ] 3.2 Verify: `npm run typecheck && npm test` in `resources/app/`

## 4. Remove the orphaned types

- [ ] 4.1 Remove `MarkListHandlers` and `TaxonomyTableHeader` from `resources/app/types/pages/common.ts`. Delete the file if nothing else remains in it
- [ ] 4.2 Remove `PaginationData` from `resources/app/types/components/common.ts`. Any resulting error marks a call site that was reading `from` or `has_more_pages` — fields the API's `PaginatedData<T>` does not return — so fix the call site rather than reinstating the type
- [ ] 4.3 Confirm `TableType` is already gone (renamed to `TableDensity` in `table-pagination-primitives`) and that no `TableEditMode` remains anywhere
- [ ] 4.4 Remove the legacy `ListState` type and `parseBoolean` from `resources/app/types/list-state.ts`, along with their entries in that file's export lists. Both are already referenced nowhere; re-confirm with a search before deleting
- [ ] 4.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 5. Final verification

- [ ] 5.1 Run `npm run typecheck && npm run lint && npm test` in `resources/app/`
- [ ] 5.2 Run `npm run build` in `resources/app/`
- [ ] 5.3 Search the app for `useMarkList`, `BulkActionHandler`, `SortableConfig`, `PaginationData`, `MarkListHandlers`, `TaxonomyTableHeader`, `TableEditMode` and `single-row` — expect zero hits outside `openspec/`
- [ ] 5.4 Run `npx knip` in `resources/app/` as an advisory cross-check only. It has no config file, so expect pre-existing unrelated findings; the point is that nothing table-related appears, not that the run is clean
- [ ] 5.5 Confirm exactly one pagination component (`components/ui/pagination.tsx`), one table primitive module (`components/ui/table.tsx`) and one selection model (TanStack row selection inside `components/data-table/`) remain
