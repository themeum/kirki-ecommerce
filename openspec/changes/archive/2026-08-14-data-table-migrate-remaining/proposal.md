## Why

Thirteen tables still hand-roll the old pattern: `ui/table` primitives plus
`useMarkList` plus `BulkActionHandler` plus a `single-row.tsx` per feature, with
the page above them owning list params, the card and the pagination bar. Eight are
paginated list tables that the new DataTable exists to serve; five are editor or
display tables that should not be list tables at all but still need to move off
the old primitives.

The eight list tables carry defects the new DataTable already fixes:

- **A search blanks the entire table.** Each page computes
  `loaded = !isLoading && Boolean(data)` and unmounts the card, table and
  pagination when false.
- **`isFetching` is extracted, passed down, and ignored.** Every page destructures
  `isFetching` from its query and passes it to the table, which declares
  `isFetching?: boolean` in its props type and never destructures it. So refetch
  feedback was intended, wired halfway, and never landed.
- **An empty list renders nothing at all** — no message, no explanation.
- **The same `useListParams` defaults literal is declared three times per feature**
  (page, table, and toolbar), which silently defeats the hook's memoisation, since
  its setters are only stable when the options object is a stable reference.
- **`customer-group-table.tsx` is mock UI**: hardcoded rows, checkboxes wired to
  `noop`, untranslated header strings, and no service behind it.

Finishing the migration also unblocks deleting the old stack, which is the next
and final change.

## What Changes

### The eight list tables

brands, categories, tags, collections, customers, customer groups, inventory,
variation library — each migrated to the new DataTable following the folder shape
established in `data-table-migrate-catalog`:

- Column definitions move from each feature's `single-row.tsx` into a module-scope
  `columns.tsx`, and **`single-row.tsx` is deleted**.
- Each feature's `*-table-action.tsx` becomes `*-table-filters.tsx`, supplied as
  the table's `toolbar`.
- The table component takes over what the page used to own: list params (through
  `use-data-table-params`), the query, the edit-dialog state and the delete
  mutations. The page keeps only its heading and page-level actions; the card and
  the pagination bar are now the DataTable's.
- Each feature's `useListParams` defaults are hoisted to a single module-scope
  constant, matching the `*ListOptions` pattern products, orders and coupons
  already use.
- `useMarkList` and `BulkActionHandler` usage is replaced by `enableRowSelection`
  plus `bulkActions` / `onBulkApply`.
- Per-row edit dialogs are hoisted to one instance per table, driven by a single
  `editingItem` state, rather than one dialog mounted per row.
- Column sorting is preserved where it exists today (brands, categories, tags, and
  the customer column on customers) by giving those columns `enableSorting` and an
  id matching the service's sort field.

### The five non-list tables

bulk-edit grid, the product-form variants table, the order-details items table,
the order-create item rows, and the product-picker dialog — these keep hand-rolled
rows and do **not** become DataTables. They are rewritten against the new
primitives only: the `density` rename, and the former `editMode` styles now owned
by their features. The product-picker table is additionally extracted out of the
398-line `select-products-dialog.tsx` into its own module.

The variation library is a special case among the eight: its list is entirely local
with no server paging, so its feature filters the rows itself before supplying them
and disables paging.

## Capabilities

### New Capabilities

- `non-list-tables`: Which tables are list tables and which are not — the criteria
  that put an editor grid, a display table or a locally-held list outside the list
  table's remit, and what those tables must do instead so that one primitive layer
  still serves every table in the app.

### Modified Capabilities

(none — the eight list tables come into compliance with `data-table` and
`list-table-composition` rather than changing either contract)

## Impact

- **Migrated to DataTable**: `features/brands/components/brand-table/`,
  `features/categories/components/category-table/`,
  `features/tags/components/tag-table/`,
  `features/collections/components/collection-table/`,
  `features/customers/pages/customer-table/`,
  `features/customers/pages/customer-groups/`,
  `features/inventory/pages/inventory-table/`,
  `features/settings/essentials/pages/variation-library/variation-table/`
- **Deleted**: the `single-row.tsx` in each of brands, categories, tags,
  collections, customers, inventory and variation library
- **Simplified**: `features/{brands,categories,tags,collections,customers,inventory}/pages/*.tsx`
  lose their `useListParams` call, `loaded` gate, `Card`/`CardContent` wrapper,
  `Pagination` and `PaginationData` cast
- **New per feature**: a `*ListOptions` constant, and a `columns.tsx`
- **Rewritten against the new primitives only**:
  `features/bulk-edit/pages/bulk-edit-table/`,
  `features/products/components/product-form/sections/variants/variation-table/`,
  `features/orders/pages/order-details/items-table.tsx`,
  `features/orders/pages/order-create/components/product-selection-card.tsx` and
  its row, `features/products/components/select-products-dialog.tsx`
- **Extracted**: the product-picker table out of `select-products-dialog.tsx`
- **Depends on**: `table-pagination-primitives`, `data-table-tanstack`,
  `data-table-migrate-catalog`
- **Enables**: `table-stack-cleanup` — after this change nothing imports
  `useMarkList`, `BulkActionHandler`, `components/sorting.tsx` or
  `components/pagination.tsx`
- **Behavioural changes users will notice**: these eight tables gain a loading
  state that no longer blanks the screen, an explicit empty state, and a pagination
  bar that stays put during a refresh. Customer groups remains mock data — it gains
  the new appearance and working local selection, but no server behaviour
- **Out of scope, flagged**: legacy search boxes omit the debounce delay that
  products, orders and coupons pass, so their search fires per keystroke; the
  customers and collections toolbars render a disabled date filter and a
  non-functional filter button. Both predate this change and are left alone
