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
- [7. Empty states](#7-empty-states)
- [8. Where this differs from TanStack defaults](#8-where-this-differs-from-tanstack-defaults)

---

## 1. Quick start

A feature's list screen is four modules: the column definitions, the toolbar, the
table wiring, and the page. `useDataTableParams` binds the browser address to the
state the table consumes, and the whole `params` object is both the react-query
key and the axios query string, so any change refetches.

The **page** owns the query and passes `data` and `isLoading` down, because it
must also decide whether to show the table at all
([7. Empty states](#7-empty-states)). The **table** is presentational.

```tsx
const Brands = () => {
  const { params } = useDataTableParams(brandListOptions);
  const { data, isFetching } = useBrandsQuery(params);

  const hasRecord = data?.has_records !== false;

  return (
    <Page>
      <PageHeading text={__('Brands', 'kirki-ecommerce')} actions={hasRecord && <NewBrandButton />} />
      <PageContent>
        {!hasRecord ? (
          <NotFoundState ... />
        ) : (
          <BrandTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

const BrandTable = ({ data, isLoading = false }: ListingTableProps<Brand>) => {
  const { pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(brandListOptions);

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
      isLoading={isLoading}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActions={brandBulkActions}
      onBulkApply={handleBulkApply}
      toolbar={<BrandTableFilters />}
    />
  );
};
```

The page passes `isLoading={isFetching}`, not react-query's `isLoading` — the
table should show its skeleton on every refetch, not only the first load.

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

### `useFilterDraft`

Do not hand-write that draft machinery. `useFilterDraft` owns all of it — the
draft state, seeding on open, resetting on dismiss, resolving a control back to
its empty value on apply, `appliedCount`, and clearing. A feature declares its
empty draft and renders its controls; nothing else.

```tsx
const EMPTY_FILTERS = { category_ids: [], status: 'all', brand_id: undefined };

const { draft, appliedCount, setDraftValue, handleOpen, handleClose, handleApply, handleClear } =
  useFilterDraft<ProductListFilter, ProductFilterDraft>(productListOptions, EMPTY_FILTERS);
```

The empty draft is the contract: whatever value a control holds when it is
"unset" (`'all'`, `[]`, `undefined`) goes in it, and the hook treats that value
as not-applied everywhere — in the count, in what reaches the address, and in
what a cleared filter resets to. Pass the same module-level `xListOptions`
constant the table uses, so both read the same address.

A control's own component takes `filterObject={draft}` and calls
`setDraftValue(name, value)`. The product category, collection and brand controls
are shared verbatim by the inventory list and the product-picker dialog — reuse
them rather than writing a fourth copy.

### What each list filters by

| List | Controls |
|---|---|
| Products | Categories (multi), Status, Inventory, Collection, Brand |
| Inventory | Categories (multi), Inventory, Collection, Brand |
| Customers | Country, City |
| Coupons | Status, Method, Type |
| Orders | Status, Payment Status, Delivery Method |

Three of these are worth knowing about before you touch them:

**Orders' Status is a mapping, not a column.** `order_status` is the derived
`(fulfillment_status, payment_status)` pair, so filtering it as a flat enum would
offer three near-identical "shipped" options and let a merchant build
guaranteed-empty combinations against the separate Payment Status control.
Instead `Order::scope_apply_status_filter()` resolves each merchant-facing option
to whichever column defines it — fulfilment for shipped/delivered/on-hold/
cancelled/returned/placed/processing, payment for failed/refunded/refunding, and
`order_status` for the two refund-cluster states. The mapping lives on the model
so the labels and the conditions cannot drift apart across the API boundary.

**The refund options may legitimately match nothing.** `refund requested` and
`refund declined` are the only options resolved against `order_status`, and
`OrderStatus::get_transition_matrix()` carries a TODO saying the refund cluster
is not in the state matrix yet. An empty result there is the feature waiting on
refunds, not a broken filter.

**Customers filter on the default *shipping* address**, while the table's
Location column is rendered from the *billing* address. A customer whose two
differ can therefore be matched by a filter that disagrees with the column shown.
The Country and City options come from `GET /customers/locations`, which returns
only the countries and cities customers are actually in; City is scoped by the
selected Country and resets when Country changes or clears.

---

## 7. Empty states

An empty list is one of two situations, and they are handled in two places:

| Situation | Handled by | Shown | Toolbar, headers, pagination |
| --- | --- | --- | --- |
| The table holds no record (`has_records` is `false`) | The **page** | `NotFoundState` instead of the table | Not rendered; the page card holds only the message |
| Filters active, or any other case with no rows | `DataTable` | `emptyState` in the table body | Kept, so the criteria can be changed |

**First use belongs to the page.** `DataTable` does not know about first use and
has no `total`-based branch for it. The page already holds the query and the
filters, so it makes the call and hides the table. The call reads
`has_records` from the list response:

```tsx
const { params } = useDataTableParams(productListOptions);
const { data, isFetching } = useProductsQuery(params);

const hasRecord = data?.has_records !== false;

<PageHeading text=... actions={hasRecord && <AddProductButton />} />
<PageContent>
  {!hasRecord ? (
    <NotFoundState
      icon={<ProductEmptyStateIcon />}
      text={__('Add a product', 'kirki-ecommerce')}
      description={__('Every great business begins with product number one.', 'kirki-ecommerce')}
      actions={<AddProductButton />}
    />
  ) : (
    <ProductTable data={data} isLoading={isFetching} />
  )}
</PageContent>
```

The page's header action is hidden while `NotFoundState` is shown, so the
screen offers one call to action, not two. Neither the page number nor the
filters play a part: only the server says if the table is empty.

**Filtered-empty belongs to the table.** The table passes `emptyState` to
`DataTable`, which renders it in a single full-width row of the body, with the
toolbar and headers still in place:

```tsx
const { ..., clearFilters } = useDataTableParams(productListOptions);

<DataTable
  emptyState={
    <DataTableEmptyState
      title={__('No products found', 'kirki-ecommerce')}
      actions={
        <Button variant="secondary" onClick={clearFilters}>
          {__('Clear Search', 'kirki-ecommerce')}
        </Button>
      }
    />
  }
  ...
/>
```

`DataTableEmptyState` takes `icon`, `title`, `description`, `actions` and
`cssOverride`, and every part is optional. With no props it shows a search icon,
"No records found" and "Try a different search or clear your filters." When
`emptyState` is omitted, `DataTable` renders that default. The entity icons used
by `NotFoundState` live in `@/icons/empty-state`.

**Only an explicit `false` shows the first-use screen.** While the first request
loads, or after a failed request, `data` is undefined and `has_records` is
undefined. The check `!== false` keeps the table, so an error never reads as "add
your first item", and a refetch never flashes the first-use screen.

**Where `has_records` comes from.** The nine top-level list endpoints (products,
orders, inventory, collections, categories, tags, brands, customers, coupons)
return `has_records` in the `data` object, beside `total`. It is `true` when the
table holds at least one record, whatever the search or filters in the request.
A search that matches nothing therefore gives `total` of `0` and `has_records` of
`true`, and the page keeps the table and shows the filtered-empty message.

The service builds it with `ListPaginator::from( $page, $query )`. The query is a
fresh, unfiltered query, for example `Brand::query()`. It runs only when the page
total is `0`; when the page has rows, no extra query runs. To change which
records count, change that query in the service. Products pass
`Product::query()->where_not( 'status', ProductStatus::TRASHED )`, so a store with
only trashed products gets the first-use screen. The `limit=-1` branch (all
records, for pickers) and storefront lists do not return the key.

**`hasActiveFilters` and `clearFilters`.** `useDataTableParams` returns both.
The flag is true when the search term, a date range or any declared filter holds
a value; page, page size and sort do not count. `clearFilters` removes exactly
those and keeps sort and page size. `DataTable` never reads the address, so the
page calls the hook and the table calls it again for `clearFilters`.

---

## 8. Where this differs from TanStack defaults

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
- **An empty result is not one state.** TanStack has no notion of "no rows".
  Here first use (the server reports `has_records` as `false`) replaces the whole table with a
  page-level `NotFoundState`, while a filtered-empty table keeps its toolbar and
  headers and shows `emptyState` in the body. `DataTable` itself only knows the
  second case. See [7. Empty states](#7-empty-states).
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
