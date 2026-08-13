## Context

See proposal.md — Why. Constraints and existing facts that shape the approach:

- **`use-list-params.ts` is the established list-state owner** and is not being
  replaced. URL search params are the single source of truth; it already handles
  auto page-reset on search/sort/limit/filter change, deletes params equal to
  their defaults, and keeps `setSearchParams` in a ref because react-router
  rebuilds it on every URL change and feeds a stale copy to functional updaters.
  Its returned setters are stable **only if the options object is a stable
  reference** — which is why features hoist options to module scope.
- **`keepPreviousData` is in use**, which is exactly why the current `isLoading`
  wiring is dead. Any design that keeps taking `isLoading` from the query's
  `isLoading` field reproduces the bug.
- **`useMarkList`'s handlers are recreated every render** (they close over
  `results`), which is why the current selection provider stashes it in a ref.
  Building on TanStack's `rowSelection` removes the need for that trick.
- **`resolveBulkDeletePayload(isSelectAll, selectedItems)`** in `libs/bulk-delete`
  is the existing API contract for bulk operations and already takes exactly the
  two pieces of information the new selection model exposes. It does not change.
- **Row `id` is `string | number`** across the app's entities (`DataTableItem`).
- eslint: `consistent-type-definitions: 'error'` requires `type` over `interface`,
  but module augmentation of a third-party `interface` requires `interface`.
  `global.d.ts` already augments Emotion's `Theme` this way.
- Vitest already has a `dom` project (jsdom + testing-library) matching
  `**/*.test.tsx`, so component tests need no config work.

## Goals / Non-Goals

**Goals:**

- One state machine for paging, sorting, selection, pinning and visibility.
- The loading requirement actually satisfied: a search shows a spinner without the
  layout moving.
- A component that works both for the 11 URL-driven list tables and for the
  dialog table whose state is local.
- Columns addressable by id, so pinning/visibility/sizing are configuration rather
  than new code.

**Non-Goals:**

- Not migrating any call site. This change lands the component, the bridge hook
  and their tests; the 3 current consumers are migrated in the next change and do
  not compile against the new API until then.
- Not adopting TanStack's client-side row models (`getFilteredRowModel`,
  `getSortedRowModel`, `getPaginationRowModel`). Everything is server-driven, and
  including them risks double-filtering. The one exception (the client-side
  variation-library list) is handled in the migration change, not here.
- No virtualization, no column resizing, no drag-to-reorder columns, no
  multi-column sort. The backing services take a single `sort_by`/`sort_order`
  pair, so multi-sort would have nowhere to go.
- Not removing `useMarkList`, `BulkActionHandler`, `sorting.tsx` or
  `components/pagination.tsx` — 13 unmigrated tables still use them.

## Decisions

### Manual mode only, with `pageCount` from the caller

`useReactTable` is configured with `manualPagination: true`,
`manualSorting: true`, `manualFiltering: true`, and only `getCoreRowModel()`.
`data` is the current page's rows; `pageCount` comes from the API's `last_page`.
In this mode TanStack is a state machine and a renderer, not a data pipeline —
which is what makes it safe to hand it already-server-processed rows.

*Alternative considered:* let TanStack own pagination client-side and feed it all
rows. Rejected outright — the API is paginated and lists run to thousands of rows.

### Fully controlled; the component never reads the URL

`pagination`, `sorting`, `columnPinning` and `columnVisibility` are controlled
props with `onChange` handlers. The hidden `useListParams()` call inside the
selection context is deleted rather than moved.

This is what makes the component testable without a Router, usable in
`select-products-dialog`, and honest about its inputs. The cost — each feature
must convert URL params to TanStack shapes — is paid once by the bridge hook
below rather than 11 times.

*Alternative considered:* keep the URL read inside the component so features pass
less. Rejected: it is the direct cause of the current wrong-defaults bug, and it
would permanently exclude the dialog table.

### `use-data-table-params` owns the two representation mismatches

The hook wraps `useListParams` and returns TanStack-shaped state. It exists to
own two conversions that are easy to get wrong and pointless to repeat:

1. **1-based URL pages ↔ 0-based `pageIndex`.** The single most likely bug in this
   whole change; centralising it means it can be wrong in only one place, and the
   spec pins both directions.
2. **`sort_by`/`sort_order` ↔ `SortingState`.** Made trivial by the decision below
   that a column's `id` *is* the sort field.

It also derives `selectionResetKey` — a signature over the search term and filter
keys only, with page/limit/sort excluded — reproducing today's clear-on-filter
semantics without the component knowing what a filter is.

Handlers must be stable, so they are `useCallback`s over `setParams`, which
`useListParams` already keeps stable via its ref. The hook inherits the
"options must be a module-scope constant" requirement; the spec states it rather
than pretending it can be enforced.

### A column's `id` is the API sort field

`{ id: 'name', enableSorting: true }` and the reported sort field is `'name'`.
This deletes the `sortable: { sort_by }` sub-object, deletes the snake_case-inside-
camelCase awkwardness of `SortableConfig`, and makes `sorting[0].id → sort_by` a
one-line mapping in the bridge hook.

The constraint it imposes — a sortable column's id must match the backend field
name — is a feature of the design, not an accident: it makes a mismatch a visible
naming error rather than a silently ignored sort.

*Alternative considered:* keep a separate `meta.sortKey`. Rejected as a second
name for one thing, and it re-opens the possibility of the two disagreeing.

### `getRowId` from the entity id, defaulted

`getRowId` defaults to `String(row.id)`. Without it TanStack keys `rowSelection`
by array index, so selection would silently follow *positions* — select row 2,
change page, and row 2 of the new page appears selected. Because the failure is
silent and looks like a data bug, the default is built in rather than left to each
feature to remember, and a test covers it.

### Cross-page select-all is a separate flag, not a sentinel row id

TanStack's `rowSelection` can only describe loaded rows, so the existing `'*'`
sentinel has no home in it. Instead `isAllMatchingSelected` is a boolean the
component owns alongside `rowSelection`, and the reported selection is
`{ selectedIds, isAllMatchingSelected, selectedCount }`.

Two properties this preserves: `resolveBulkDeletePayload` keeps its existing
two-argument shape, and `row.getIsSelected()` keeps working normally. Choosing
select-all-matching clears the per-row map (it is now redundant) and reports
`selectedCount` as the total; toggling any row leaves the mode.

*Alternative considered:* keep `useMarkList` as the selection engine. Rejected —
two selection models, and TanStack's row APIs go unused in the one component
built on TanStack.

### `isLoading` is the prop name, `isFetching` is what call sites pass

The component keeps one boolean meaning "results are in flight; show the loading
treatment". Call sites feed react-query's `isFetching`, not `isLoading`, because
`keepPreviousData` makes `isLoading` false after the first fetch.

This is deliberately *not* solved by adding an `isFetching` prop: the component
does not care which query flag produced the value, and two props would invite
passing both and getting a third behaviour. What matters is that the migration
tasks say `isFetching` explicitly at every call site, and that the spec describes
the observable outcome ("shows the loading indicator rather than the stale rows")
so it is testable without naming a library field.

*Alternative considered:* skeleton rows preserving the previous row count instead
of a spinner. A nicer result, but it contradicts the stated requirement and needs
a skeleton component; the spinner-in-a-spanning-row keeps headers and layout
intact, which was the actual ask.

### Loading and empty share one spanning row, spanning visible columns only

Both use `colSpan={table.getVisibleLeafColumns().length}`. Deriving the span from
the table instance rather than the `columns` array is what keeps it correct once
columns can be hidden — the current code's `columns.length + 1` is already only
right by coincidence of the checkbox column always existing.

### Pinning offsets come from the table instance, applied via `style`

Sticky offsets are computed from `column.getStart('left')` /
`column.getAfter('right')` and applied through the `style` prop. These are
runtime-computed pixel values that change with column widths, so they cannot live
in a static `defineStyles` object — this is the sanctioned dynamic-value use of
`style` in this codebase, and the rest of the pinned-cell styling
(`position: sticky`, background, z-index) still goes through `scopedMerge`.

### Column extras go in `ColumnMeta`, augmented in `global.d.ts`

`alignment` and `cssOverride` are declared by augmenting TanStack's `ColumnMeta`
interface in `global.d.ts`, which already houses the Emotion `Theme` augmentation.
Putting it there keeps the `interface` keyword out of linted `.ts`/`.tsx` files,
where `consistent-type-definitions` would reject it, without needing an inline
eslint disable.

### Typed region props instead of `children` inspection

`toolbar`, `filterBar` and `emptyState` are `ReactNode` props. The current
`findSlot` walk is replaced outright: it silently ignores a slot wrapped in a
fragment, silently prefers the last of two duplicates, and is invisible to the
type checker. Named props make each region required-or-not at the type level and
removes the `DataTable.Filter`/`.Pagination` namespace.

Pagination is rendered internally rather than as a region, because the component
already owns `pageCount` and the paging handlers, and every design places it at
the bottom. `hidePagination` covers the one list that has no pages.

### The actions column belongs to the feature

Now that columns are addressable and pinnable, an actions column is just a column
with `id: 'actions'` pinned right. The `rowActions` resolver prop is therefore
removed — it was a second, parallel way to define a column. `DataTableRowActions`
survives as a presentational component features render inside that cell, so the
edit-button-plus-dropdown appearance stays consistent.

## Risks / Trade-offs

- **[The 3 current DataTable consumers do not compile after this change]** →
  Accepted and explicit: this change is not independently shippable, and
  `data-table-migrate-catalog` must land with or immediately after it. Do not
  merge this alone to a branch that must stay green.
- **[The 1-based/0-based page conversion is the single likeliest defect, and an
  off-by-one here looks like a backend paging bug]** → Both directions are pinned
  by scenarios in `data-table-params-binding` and covered by tests in the bridge
  hook, not only in the component.
- **[Passing `isLoading` from the query's `isLoading` field reproduces the exact
  bug this change exists to fix, and it is the natural thing to type]** → The
  migration tasks name `isFetching` at every call site, and a test asserts the
  loading treatment appears while rows are still present (the `keepPreviousData`
  shape).
- **[Forgetting `enableSorting` on a column silently makes it unsortable, whereas
  a mistyped `id` silently makes the sort a no-op server-side]** → Sortable
  columns are opt-in and their ids are the API field names; the migration change
  should check each sortable column's id against the service's accepted sort
  fields.
- **[Selection reported via a callback can loop if a caller stores it in state
  that feeds back into the table]** → Report from an effect keyed on the selection
  state, not during render, and document that the callback is an output only.
- **[`selectionResetKey` moves a correctness concern from hidden-but-automatic to
  explicit-but-forgettable]** → A feature that omits it keeps a stale selection
  across a filter change. It is defaulted to undefined (no clearing) rather than
  guessed at, and the migration tasks pass it for every list table; the bridge
  hook returns it so the cost of using it is one prop.
- **[TanStack is a new dependency and a new mental model for the team]** →
  It is confined to `components/data-table/` plus the bridge hook; features see
  `ColumnDef` and nothing else.
