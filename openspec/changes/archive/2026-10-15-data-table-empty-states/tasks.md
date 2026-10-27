## 1. Params binding

- [x] 1.1 In `resources/app/hooks/use-data-table-params.ts`, return `hasActiveFilters`: true when any value outside `page`, `limit`, `sort_by`, `sort_order` is defined and is not `''`, `null` or `[]`
- [x] 1.2 Return `clearFilters` built on `setParams`: unset `search`, `from_date`, `to_date` and every key in `options.filter?.keys`; keep sort and page size; keep the reference stable
- [x] 1.3 Add tests in `hooks/use-data-table-params.test.tsx`: paging and sort only → false; search, date range, filter key → true; empty filter value → false; `clearFilters` keeps sort and limit and returns to page one; `clearFilters` reference is stable across URL changes
- [x] 1.4 Run `npm run typecheck && npm test` from `resources/app/`

## 2. Shared components

- [x] 2.1 Rewrite `components/data-table/data-table-empty-state.tsx` to take `icon`, `title`, `description`, `actions`, `cssOverride`; centred column, each part optional, no gap for a missing part; styles through `defineStyles` and `theme` tokens; strings through `__()`
- [x] 2.2 Ask first, then create `components/data-table/data-table-empty-filter-state.tsx`: wrapper over `DataTableEmptyState` with `EmptySearchIcon`, a no-results title and "Try a different search or clear your filters." as defaults, all overridable
- [x] 2.3 Export `DataTableEmptyFilterState` from `components/data-table/index.ts`
- [x] 2.4 Add component tests next to the files: all parts shown in order; actions omitted leaves no action row; filter state defaults
- [x] 2.5 Run `npm run typecheck && npm test` from `resources/app/`

## 3. DataTable selection logic

- [x] 3.1 Add `hasActiveFilters?: boolean` (default `false`) and `emptyFilterState?: ReactNode` to `DataTableProps`; read `props.total` to know whether a total was reported
- [x] 3.2 Render first use (no filters, reported total 0, not loading, no rows) as the message alone inside the existing `Card`; skip the toolbar row, `Table` and `Pagination`
- [x] 3.3 Render filtered-empty (filters active, not loading, no rows) in the existing empty row with `emptyFilterState ?? <DataTableEmptyFilterState />`; keep the toolbar and headers
- [x] 3.4 Keep the current row with `<DataTableEmptyState />` for every other empty case, including no reported total
- [x] 3.5 Update `data-table.test.tsx`: first use hides toolbar, headers and pagination; first use on page 3; filtered-empty keeps toolbar and headers and shows the default and a supplied message; loading shows the skeleton; `total` not passed falls back to "No items found"; the existing default-empty tests still pass
- [x] 3.6 Run `npm run typecheck && npm test` from `resources/app/`

## 4. Reference wiring

- [x] 4.1 Ask first, then edit `features/products/components/product-table/product-table.tsx`: take `hasActiveFilters` and `clearFilters` from `useDataTableParams`; pass `hasActiveFilters`
- [x] 4.2 Pass `emptyState` with `ProductEmptyStateIcon`, title "Add your first product", description "Every great business begins with product number one.", and the Add Product action (confirm the route and whether an Import action exists)
- [x] 4.3 Pass `emptyFilterState` with title "No products found" and a "Clear Search" action that calls `clearFilters`
- [x] 4.4 Check that the toolbar search box shows the cleared value after `clearFilters`; fix at the call site if it keeps its own text
- [x] 4.5 Run `npm run typecheck && npm test` from `resources/app/`

## 5. Specs and docs

- [x] 5.1 Update `docs/data-table.md`: add an "Empty states" section (the two screens, `hasActiveFilters`, `emptyState`, `emptyFilterState`, the `total` opt-in, `clearFilters`); add or extend the "Where this differs from" section
- [x] 5.2 Run `openspec validate data-table-empty-states --strict`
- [x] 5.3 Run `npm run typecheck && npm test` from `resources/app/`; leave visual confirmation to the user
