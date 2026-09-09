# Data Table

The admin's shared listing table. It renders rows, delegates paging, sorting and
filtering back to the caller, and hosts row selection, bulk actions and column
show/hide. Every list screen in `resources/app/features/` uses it.

- [1. Quick start](#1-quick-start)
- [2. Defining columns](#2-defining-columns)
- [3. Sortable columns](#3-sortable-columns)
- [4. Bulk actions](#4-bulk-actions)
- [5. Column visibility and `tableId`](#5-column-visibility-and-tableid)
- [6. Filtering](#6-filtering)
- [7. Where this differs from TanStack defaults](#7-where-this-differs-from-tanstack-defaults)

---

## 1. Quick start

A feature's list table is three modules: the column definitions, the toolbar, and
the wiring. `useDataTableParams` binds the browser address to the state the table
consumes, and the whole `params` object is both the react-query key and the axios
query string, so any change refetches.

```tsx
const BrandTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(brandListOptions);
  const { data, isFetching } = useBrandsQuery(params);

  return (
    <DataTable
      tableId="brands"
      data={data?.results ?? []}
      columns={brandColumns}
      pageCount={data?.last_page ?? 0}
      total={data?.total}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isFetching}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActions={brandBulkActions}
      onBulkApply={handleBulkApply}
      toolbar={<BrandTableFilters />}
    />
  );
};
```

`isLoading` must be `isFetching`, not `isLoading` — the table should show its
skeleton on every refetch, not only the first load.

---

## 2. Defining columns

Column definitions live in their own `columns.tsx` and are a **module-scope
constant**, never rebuilt during render — rebuilding them repaints the header on
every keystroke. A cell that needs hooks renders a component that holds them.

```tsx
const brandColumns: ColumnDef<Brand>[] = [
  {
    id: 'name',
    header: __('Name', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => <BrandNameCell item={row.original} />,
  },
];
```

`meta` carries presentation: `alignment` (`'right' | 'center'`) and `cssOverride`.
A column of per-row actions uses `header: ''` and `enableSorting: false`.

---

## 3. Sortable columns

**A column's `id` is the field name the backing service sorts by.** There is no
separate sort-key declaration, and the two names must agree across the stack:

```
columns.tsx        id: 'count', enableSorting: true
       │
       ▼  ?sort_by=count&sort_order=asc
BrandService::sortable_columns()   'count' => 'products_count'
```

### Declaring the backend side

Each service that backs a list uses `HasSortableColumns` (`app/Concerns/`) and
declares one map. That map is the **sole** authority on what may be sorted by —
controllers no longer carry an allowlist.

```php
class BrandService
{
    use HasSortableColumns;

    protected function sortable_columns()
    {
        return [
            'name' => 'name',                 // a stored column
            'count' => 'products_count',      // a with_count() alias
            'base_price' => function ($direction) {   // a correlated subquery
                return Variant::where_raw('pid = product_id')
                    ->order_by('base_price', $direction)
                    ->limit(1)
                    ->select('base_price');
            },
        ];
    }
}
```

A value is a stored column, the alias of something the list query already selects
(`with_count('products')` ⇒ `products_count`, `with_max('orders','created_at')` ⇒
`orders_max_created_at`), or a callable receiving the resolved direction and
returning anything `order_by()` accepts. Override `default_sort_by()` /
`default_sort_order()` where the resource's default is not `id` / `desc`.

> **A mismatch fails silently.** An unrecognised `sort_by` returns results in the
> resource's default order with a 200 — it does not error. So a column marked
> `enableSorting: true` whose id is missing from the service map renders a
> clickable header that does nothing at all. Three columns were in exactly this
> state before this contract existed. When you make a column sortable, add the
> map entry in the same change, and prefer an integration test that asserts row
> **order**, not just a 200 — a wrong alias also returns 200.

### What is not sortable

Values computed outside the database. Products' `availability_status` and
coupons' `status` are resolved in PHP at serialization time from several columns
plus configuration; ordering by them would mean a third copy of rules already
held by the PHP resolver and the SQL filter predicates. They stay
`enableSorting: false`.

---

## 4. Bulk actions

```tsx
const brandBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce'), destructive: true },
];
```

- **One action** — the bar renders it as a single button that applies directly.
  `destructive: true` styles it as such.
- **Two or more** — the merchant picks one and confirms with Apply.
- **None** — the bar reports the selection and offers no action control.

`onBulkApply(action, selection)` receives both `selectedIds` and
`isAllMatchingSelected`; when the latter is true the ids are empty and the action
must address the whole matching set — that is what `resolveBulkDeletePayload` and
its siblings in `libs/` are for. If the returned promise rejects, the selection
is kept so the merchant can retry; reporting the failure is the caller's job,
since its mutation already surfaces it.

---

## 5. Column visibility and `tableId`

Every table gets a column show/hide control automatically. `tableId` is required
and is the key the merchant's choices are stored under
(`kirki-ecommerce:table-columns:<tableId>`), so it must be stable across releases
and independent of the route.

The menu offers every column with a non-empty string header, excluding the
selection column and anything marked `enableHiding: false`. It stays open across
several toggles and never lets the last visible column be hidden.

```tsx
<DataTable tableId="customer-groups" enableColumnVisibility={false} ... />
```

Passing `columnVisibility` yourself puts the table in controlled mode and
suppresses its own control.

---

## 6. Filtering

Filter overlays share one shell. A feature supplies only its own filter controls
and the mapping to and from the address:

```tsx
<DataTableFilterPopover
  appliedCount={appliedCount}
  onOpen={seedDraftFromParams}
  onClose={resetDraft}
  onApply={writeDraftToParams}
  onClear={clearAllFilters}
>
  <CategoriesFilter ... />
  <StatusFilter ... />
</DataTableFilterPopover>
```

Edits are a draft until Apply; the shell seeds it on open and resets it on
dismiss. `appliedCount` counts **one per filter control holding a non-default
value** — six selected categories count as one, and a control left at `all`
counts none. It excludes the search term and the date range, which have their own
toolbar controls, so the trigger's ✕ does not wipe them.

---

## 7. Where this differs from TanStack defaults

- **Everything is manual.** `manualPagination`, `manualSorting` and
  `manualFiltering` are all `true`, always. The table never slices, reorders or
  filters rows; it renders exactly what it is given. There is no client-side
  sorting mode, including for the two tables whose rows are already in memory.
- **Single-column sort only.** The address holds one `sort_by` and one
  `sort_order`, so `sorting[0]` is the whole story. Activating a different header
  replaces the sort rather than adding to it.
- **Sorting has three states.** `enableSortingRemoval` is on: ascending →
  descending → unsorted. "Unsorted" is reported as an empty sorting array, which
  `useDataTableParams` translates into clearing both address params — so the list
  falls back to the default declared in the feature's list options. Because most
  defaults are `sort_by: 'id'`, a field no table displays, no header is
  highlighted in that state.
- **Column pinning and visibility are not TanStack-managed.** Their change
  handlers are no-ops; pinning comes from the caller and visibility from the
  table's own persisted state.
- **Row identity is `row.id`.** `getRowId` returns `String(row.id)`, so selection
  survives a refetch that reorders rows. Every item must have an `id`.
- **Only the rows go to skeletons.** The column headers stay rendered through a
  refresh, so the merchant keeps the column labels and the current sort direction
  in view. Sorting is inert for the duration of the request, like the pagination
  control.
- **Loading geometry is measured, not guessed.** Column widths otherwise come
  from the widest cell, so placeholders — which have no intrinsic width — would
  resize every column on the way into loading and back out again. Row height and
  per-column widths are read from the last populated render and reapplied while
  loading, with `table-layout: fixed` holding them exactly. Nothing is frozen on
  a first load, since there is no prior geometry to preserve, and the widths are
  released once real rows return.
