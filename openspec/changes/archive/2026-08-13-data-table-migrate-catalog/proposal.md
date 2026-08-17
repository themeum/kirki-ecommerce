## Why

`data-table-tanstack` replaces the DataTable's API, which leaves the three
features already using it — products, orders and coupons — unable to compile.
This change migrates them, and does so first, before the 8 hand-rolled legacy
tables, because these three already exercise the hardest parts of the new
surface: multi-key filter popups, an active-filter chip bar, bulk delete with
select-all-across-pages, per-row action menus, and row-click navigation. If the
new API is wrong, it is cheaper to find out across three call sites than across
eleven.

It also lands the fix these three tables have been missing: they pass
react-query's `isLoading`, which `placeholderData: keepPreviousData` holds at
`false` for every fetch after the first, so searching or filtering any of them
currently shows no loading feedback at all.

## What Changes

- Rewrite the product, order and coupon tables against the new DataTable:
  `ColumnDef` columns, controlled pagination and sorting via
  `use-data-table-params`, typed `toolbar` / `filterBar` region props, and
  `enableRowSelection`.
- Split each table into its own folder with columns, filters, filter bar and the
  table component in separate files, so a column definition is no longer buried
  in the component that renders it.
- **Fix**: pass react-query's `isFetching` rather than `isLoading`, so a search,
  filter, sort or page change shows the loading state.
- Replace the `DataTable.Filter` / `.SelectionFilter` / `.FilterBar` /
  `.Pagination` slot children with the `toolbar` and `filterBar` props;
  pagination is now rendered by the table.
- Replace coupons' `rowActions` resolver with an actions column pinned to the
  trailing edge, rendering the retained row-actions presentational component.
- Move the order columns out of the component: they are declared in a
  `useMemo(..., [])` with an empty dependency list, which is a module-scope
  constant written in the wrong place. Module scope is also what lets the
  memoised header sit out a search.
- Delete `features/orders/pages/order-table/table-info.tsx`, which is dead.
- Give each table an explicit `selectionResetKey` so a filter change still
  discards a stale selection now that the DataTable no longer reads the URL
  behind the caller's back.

## Capabilities

### New Capabilities

- `list-table-composition`: How a feature's list table is structured — the
  separation of column definitions, filter UI and table wiring into their own
  modules, where list-parameter configuration lives, and which of these must be
  reachable without rendering. Established here against three tables and applied
  to the remaining eight in `data-table-migrate-remaining`.

### Modified Capabilities

(none — the table's own behaviour is specified by `data-table`, which this change
consumes rather than alters)

## Impact

- **Rewritten**: `features/products/components/product-table/`,
  `features/orders/pages/order-table/`, `features/coupons/pages/coupon-table/`
- **New per table**: `columns.tsx` (module-scope `ColumnDef[]` including the
  pinned actions column where the table has row actions)
- **Renamed**: `order-table-action.tsx` → `order-table-filters.tsx`, so all three
  features use one name for the toolbar region (products and coupons already use
  `*-table-filter.tsx`, which becomes `*-table-filters.tsx`)
- **Deleted**: `features/orders/pages/order-table/table-info.tsx`
- **Unchanged**: every `filter-popup/` directory, all services, query keys,
  schemas and the `*ListOptions` constants in each feature's `types.ts`. The
  filter UI and its URL contract are deliberately untouched — only how the table
  receives them changes
- **Depends on**: `data-table-tanstack`. Neither change compiles alone; they land
  together or back to back
- **Behavioural change users will notice**: searching, filtering, sorting or
  paging any of these three tables now shows a spinner in the row area where it
  previously showed stale rows with no feedback
- **Sorting**: none of these three tables currently offers column sorting, and
  this change does not add it. Columns get ids matching their API field names,
  but `enableSorting` stays off, so behaviour is unchanged. Enabling it is a
  follow-up decision per table, not a side effect of migrating
