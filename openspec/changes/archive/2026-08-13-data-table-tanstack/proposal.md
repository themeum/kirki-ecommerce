## Why

The admin has two parallel, hand-rolled table stacks. The newer
`components/data-table/` (704 lines across 10 files) is used by 3 features;
13 other places hand-roll `ui/table` + `useMarkList` + `BulkActionHandler` +
a `single-row.tsx` per feature. Neither is built on a table library, so sorting,
selection, pagination and filtering are re-derived per feature, and the shared
one has accumulated defects that cannot be fixed within its design:

- **Searching never shows a loading state.** Features use react-query's
  `placeholderData: keepPreviousData`, so `isLoading` is `false` on every fetch
  after the first — only `isFetching` goes true. All three consumers pass
  `isLoading`, so the spinner branch in `data-table-body.tsx` is unreachable
  during a search, filter or sort.
- **The layout jumps while loading.** `data-table-pagination.tsx` returns `null`
  when loading, so the bar vanishes and the page reflows.
- **The component secretly reads the URL.** `data-table-selection-context.tsx`
  calls `useListParams()` with no arguments — using the hook's *default* options
  rather than the calling feature's — purely to clear selection when filters
  change. This makes a shared component require a react-router Router and makes
  it unusable in `select-products-dialog`, whose list state is local.
- **Composition is untyped.** Filter, filter-bar and pagination slots are found
  by walking `children` and comparing `child.type`, so a slot inside a fragment
  is invisible, the last duplicate silently wins, and nothing is checked.
- **The row generic is erased** by two `as unknown as` casts to get columns into
  a non-generic context.
- **No empty state, no column pinning, no column visibility, no column sizing.**
  Empty renders a hardcoded `'No items found'` string; `ui/empty-state.tsx`
  exists but no table uses it. Widths are expressed as `cssOverride: { width: '10%' }`.
- **Columns are positional.** `DataTableColumn` has no id and is rendered by
  array index, so nothing can address a column — which is why pinning,
  visibility and sizing were never possible.
- **No tests** cover any of it.

This change rebuilds the DataTable on `@tanstack/react-table` in manual
(server-driven) mode, so pagination, sorting, filtering, selection, pinning and
visibility come from one well-tested state machine instead of per-feature code.

## What Changes

- Add `@tanstack/react-table` as a dependency of `resources/app`.
- Rebuild `components/data-table/` around a single `useReactTable` instance
  configured with `manualPagination`, `manualSorting` and `manualFiltering`, and
  a caller-supplied `pageCount`.
- **BREAKING**: columns are declared as real `ColumnDef<T>[]` instead of
  `{ title, renderItem }`. A column's `id` **is** the field name the API sorts
  by, which removes the `sortable: { sort_by }` indirection entirely.
- **BREAKING**: DataTable becomes fully controlled and never reads the URL. It
  takes `pagination`, `sorting`, `pageCount` and change handlers. The hidden
  `useListParams()` call is deleted.
- **BREAKING**: replace the four `children`-walked slots with typed props —
  `toolbar`, `filterBar`, `emptyState` — and drop the
  `DataTable.Filter` / `.SelectionFilter` / `.FilterBar` / `.Pagination`
  namespace. Pagination is rendered internally, with `hidePagination` to opt out.
- **BREAKING**: `rowActions` resolver is removed. Features declare their own
  actions column, pinned right; the existing row-actions presentational
  component is kept for reuse in that cell.
- Row selection becomes opt-in via `enableRowSelection`, backed by TanStack's
  `rowSelection` keyed by entity id (via `getRowId`) rather than array index.
  The cross-page "all rows matching the current filters" case — today the `'*'`
  sentinel inside `useMarkList` — becomes an explicit `isAllMatchingSelected`
  flag. Selected ids, that flag and a count are exposed through
  `onRowSelectionChange` and to bulk actions.
- Add column pinning (`columnPinning` prop, sticky offsets computed from the
  table instance) and column visibility.
- Loading is driven by a single `isLoading` prop that call sites feed react-query's
  `isFetching`. While loading, the header row, toolbar, filter bar and pagination
  all stay mounted and only the body is replaced by a spinner.
- Add a default empty state, overridable per table via the `emptyState` prop.
- Add `hooks/use-data-table-params.ts` bridging `use-list-params` (URL search
  params, 1-based pages) to TanStack's state shapes (0-based `pageIndex`), so
  the conversion is written once rather than in each of 11 features.
- Add component tests — the first tests to cover any of this stack.

## Capabilities

### New Capabilities

- `data-table`: The server-driven list table contract — how rows and columns are
  supplied, how pagination/sorting/filtering are delegated to the caller, how
  loading and empty states are presented without disturbing the surrounding
  layout, how row selection (including selection across pages) is expressed and
  reported, and how column pinning and visibility behave.
- `data-table-params-binding`: The contract between URL-held list state and table
  state — page-number base conversion, which changes reset paging, and when a
  change invalidates an in-progress selection.

### Modified Capabilities

(none — no existing main spec covers the list table)

## Impact

- **Dependency**: `@tanstack/react-table` added to `resources/app/package.json`
- **Rewritten**: `components/data-table/` — `data-table.tsx` plus a default empty
  state and a selection bar; `data-table-row-actions.tsx` kept as a
  presentational component; `types.ts` and `index.ts` reshaped
- **Deleted**: `data-table-context.tsx`, `data-table-selection-context.tsx`,
  `data-table-header.tsx`, `data-table-body.tsx`, `data-table-toolbar.tsx`,
  `data-table-slots.tsx`, `data-table-pagination.tsx`
- **New**: `hooks/use-data-table-params.ts` (exported from `hooks/index.ts`),
  `components/data-table/data-table.test.tsx`
- **Types**: `ColumnMeta` augmented in `global.d.ts` to carry cell alignment and
  style overrides
- **Depends on**: `table-pagination-primitives` — consumes the new `ui/table`
  parts and is the first consumer of `ui/pagination`
- **Deferred**: the 3 features currently using DataTable do not compile against
  the new API until the next change. This change lands the component and its
  tests; `data-table-migrate-catalog` migrates the call sites.
- **Unchanged here**: `useMarkList`, `BulkActionHandler`, `components/sorting.tsx`
  and `components/pagination.tsx` all remain, since the 13 unmigrated tables
  still use them. They are removed in `table-stack-cleanup`.
