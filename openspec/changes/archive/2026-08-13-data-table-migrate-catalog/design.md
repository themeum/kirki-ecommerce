## Context

See proposal.md — Why. State of the three tables being migrated:

- **products** (`features/products/components/product-table/`, 157 lines) —
  module-scope columns already, bulk delete, a `ProductTitleCell` component that
  uses `useNavigate`, filter + filter-bar + filter-popup already split out.
  The closest thing to the target shape.
- **orders** (`features/orders/pages/order-table/`, 143 lines) — columns declared
  in `useMemo(..., [])` inside the component; row-click navigation; selection UI
  renders but no `bulkActionOptions` are passed, so the bulk bar appears with no
  actions in it; `table-info.tsx` (60 lines) is dead; its toolbar file is named
  `order-table-action.tsx` while the others use `*-table-filter.tsx`.
- **coupons** (`features/coupons/pages/coupon-table/`, 197 lines) — module-scope
  columns, bulk delete, and the only one of the three using the `rowActions`
  resolver (duplicate / activate / delete per row).

All three already share the good pattern the legacy tables lack: a single
module-scope `*ListOptions` constant in the feature's `types.ts`, used by both the
table and its filter UI. That constant does not change.

`resolveBulkDeletePayload(isSelectAll, selectedItems)` from `libs/bulk-delete` is
the existing bulk-delete contract and takes exactly the two values the new
selection state reports.

## Goals / Non-Goals

**Goals:**

- Make the new DataTable API compile and behave correctly against three real
  tables, including the two hardest cases (a row-actions column, and bulk delete
  with select-all-across-pages).
- Establish the per-table folder shape that the remaining eight tables copy.
- Make the loading state actually appear.

**Non-Goals:**

- No change to any filter popup, filter chip bar, service, query key, schema or
  URL parameter contract. The filter UI is moved between props, not rewritten.
- Not adding column sorting. None of these three sorts today; giving them sortable
  headers is a product decision, not a migration side effect.
- Not adding column pinning or visibility beyond the one pinned actions column
  coupons needs.
- Not touching the 8 legacy tables or the 5 embedded tables.

## Decisions

### Migrate these three first, and treat them as the API's acceptance test

These three are 3 of 16 tables but cover most of the new surface: filter regions,
a chip bar, bulk actions with the all-matching flag, a row-actions column, and
row-click navigation. The 8 legacy tables are mostly variations on brands. So this
change is where the new API is allowed to be found wrong and adjusted — if a prop
shape needs to change, it changes here, before eleven more call sites depend on it.

Recorded consequence: if implementing this change reveals a defect in the
DataTable's surface, fix `data-table-tanstack`'s component and note it as a
correction in that change's design, rather than working around it per feature.

### One folder shape for all three, `columns.tsx` + `*-table-filters.tsx` + `*-table.tsx`

Each table directory gets:

- `columns.tsx` — module-scope `ColumnDef<T>[]`, plus the small cell components
  that need hooks (`ProductTitleCell`, `OrderCell`) and the pinned actions column.
- `*-table-filters.tsx` — the toolbar region: search box and filter-popup trigger.
- `*-table-filter-bar.tsx` — the active-filter chip row.
- `filter-popup/` — untouched.
- `*-table.tsx` — `useDataTableParams`, the query, dialog state, and the DataTable.

Orders' `order-table-action.tsx` is renamed to `order-table-filters.tsx` and
products'/coupons' `*-table-filter.tsx` likewise, so one name means one thing
across the app. Renaming three files now is cheaper than eight more inconsistent
ones later.

### Columns move to module scope, including orders'

Orders' `useMemo(() => [...], [])` with an empty dependency array is a module-scope
constant that happens to be evaluated inside a component. Moving it out is
mechanical and removes the `useMemo` import. This matters beyond tidiness: a stable
`columns` reference is what allows the memoised header to sit out a search, which
is the documented reason products declares its columns at module scope.

Cells that need hooks (`useNavigate`) stay as small components rendered *by* a
cell, which is how products already does it — a cell renderer may render a
component with hooks even though the column array itself is static.

### `isFetching`, and it must be written at every call site

Each table passes `isFetching` from its query hook into the DataTable's
`isLoading` prop. This is the entire user-visible payoff of the change, and it is
also the easiest thing to get wrong, because `isLoading` is the field name that
matches the prop name. The tasks name the field explicitly per table for that
reason.

Consequence worth stating: because these queries use `keepPreviousData`, users will
now see a spinner where they previously saw stale rows during a search. That is
the intended behaviour per the `data-table` spec, but it is a visible change, not a
silent internal one.

### Coupons' `rowActions` resolver becomes a pinned actions column

The resolver returned a per-row config that the DataTable turned into a synthetic
trailing column. Now coupons declares `{ id: 'actions' }` itself, pinned to the
trailing edge, whose cell renders the retained `DataTableRowActions` component with
that row's config. The per-row logic (which actions a coupon offers given its
status) is unchanged — it moves from a resolver callback into the cell renderer.

Pinning it right is a genuine improvement over the old synthetic column, which
scrolled away with the rest of the table.

### Orders keeps its action-less bulk bar as-is

Orders currently enables selection but passes no bulk actions, so selecting rows
shows a bar with a count and no actions. That is pre-existing and arguably a bug,
but fixing it means deciding what bulk actions an order should have — a product
question. Selection stays enabled and the bar stays action-less; flag it, do not
invent actions.

### `selectionResetKey` is passed by all three

The DataTable no longer reads the URL, so each table passes the
`selectionResetKey` that `useDataTableParams` derives. Without it a selection
survives a filter change, which is a real regression against today's behaviour —
so it is not optional per table, even though the prop is optional on the component.

## Risks / Trade-offs

- **[This change cannot land without `data-table-tanstack`, and that change cannot
  land without this one]** → They are a pair. Land them together, or land the
  component first and this immediately after on the same branch; never merge
  either alone to a branch required to be green.
- **[Passing `isLoading` instead of `isFetching` silently reproduces the original
  bug — the names differ by one word and the wrong one compiles]** → Named
  explicitly per table in the tasks; verify by searching for a search term in each
  table and watching for the spinner.
- **[Users will notice stale rows being replaced by a spinner during search]** →
  Intended per spec, but call it out rather than letting it read as a regression.
- **[Coupons' row-action logic is the most intricate part being moved, and it moves
  from a typed resolver to a cell renderer]** → Port it verbatim into the cell and
  check each action (duplicate, activate, delete) still fires for the right coupon
  status before moving on.
- **[Renaming three toolbar files churns imports for no functional gain]** →
  Accepted deliberately: eight more tables adopt this naming next, and settling it
  now avoids two conventions.
