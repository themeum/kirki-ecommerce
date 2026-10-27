## Context

`DataTable` is controlled and router-free (spec `data-table`, "does not depend on routing"). It
receives `data`, `total`, `pagination`, `isLoading` and `emptyState`, and it has no notion of
filters. Filters live in the URL and are read by `useDataTableParams`, which already splits `params`
into paging/sort and "the rest" (search, dates, filter keys) to build `selectionResetKey`.

Today, no table passes `emptyState`, so every table shows the default "No items found" row inside
`TableBody`, under the toolbar and header. `DataTableEmptyState` is used only by `DataTable`.

Failed requests are not signalled to `DataTable`. Consumers pass `data?.results ?? []` and
`total={data?.total}`, so an error looks like an empty list with `total` undefined.

See proposal.md for motivation and the specs for requirements.

## Goals / Non-Goals

**Goals:**

- Choose between first-use and filtered-empty inside `DataTable` from declared inputs only.
- Keep the first-use screen free of layout shift: it renders in the same card, in the same slot.
- One line per table to opt in.

**Non-Goals:**

- Per-table copy. Every wired table uses the product wording for now; each table's own title,
  description and button are set later by hand.
- Customer groups and the settings tables (page, variation). Customer groups is mock data with no params hook.
- An explicit `isError` input or an error screen. The `total` guard keeps errors out of the
  first-use screen; a real error presentation is a separate change.
- Copy for each table's first-use screen, or an Import flow for products.

## Decisions

### D1. `hasActiveFilters` is a prop, not read from the URL

`DataTable` takes `hasActiveFilters?: boolean`, default `false`.

- **Why:** the spec forbids reading the address, and `data-table.test.tsx` renders without a router.
- **Alternative:** `useSearchParams` inside `DataTable`. Rejected: breaks the spec and the tests, and
  would need a list of "which params are filters" that `DataTable` does not have.

### D2. The signal comes from `useDataTableParams`

The hook returns `hasActiveFilters`, computed from the same "everything except page, limit,
sort_by, sort_order" set that feeds `selectionResetKey`. A value counts when it is defined and is
not `''`, `null` or `[]`.

- **Why:** one definition of "what is a filter" for both stale-selection and empty-state logic.
- **Alternative:** each table computes its own flag. Rejected: 12 tables, 12 chances to disagree.
- **Alternative:** compare `params` to `options.defaults`. Rejected: defaults hold sort and paging,
  which are not filters, and a non-empty default search would hide a real search.

### D3. Selection logic stays in `DataTable`

```
isEmptyResult   = !isLoading && rows.length === 0
isFirstUse      = isEmptyResult && !hasActiveFilters && hasReportedTotal && total === 0
isFilteredEmpty = isEmptyResult && hasActiveFilters
```

`hasReportedTotal` is `props.total !== undefined`. The destructured `total = data.length` default
makes "not provided" indistinguishable from "zero", so the check reads `props.total`.

- `isFirstUse`: inside the existing `Card`/`CardContent`, render only the message. The toolbar row,
  `Table` and `Pagination` are skipped. `DataTableSelectionBar` cannot be active with zero rows.
- `isFilteredEmpty`: keep everything; the existing empty `TableRow` shows
  `emptyFilterState ?? <DataTableEmptyFilterState />`.
- Neither: the current row with the default `DataTableEmptyState`. Tables that do not pass a total
  (customer groups, pages) keep today's behaviour.
- Page index is not part of the rule. `total === 0` with no filters means no data, on any page.

**Correction during implementation:** the first plan left a supplied `emptyState` visible in the plain
fallback row. That would show "Add your first product" after a failed request on any table that supplies one,
which defeats the guard. A supplied `emptyState` now shows only on the first-use path; the fallback row is
always the default. The existing test that supplied `emptyState` without a `total` now passes `total: 0`.

**Why the `total` guard over an `isError` prop:** it costs no new input, and it fails safe. A
consumer that never reports a total cannot reach the first-use screen by accident.
**Trade-off:** a table must pass `total` to opt in; this is implicit. The spec and docs state it.

### D4. Two components, one layout

`DataTableEmptyState` takes `{ icon, title, description, actions, cssOverride }` and renders a
centred column. `DataTableEmptyFilterState` wraps it with a default icon (`EmptySearchIcon`),
title and description. Both are exported from `components/data-table/index.ts`.

- **Why:** the user asked for two shared components with the same four inputs. A wrapper keeps one
  layout to maintain.
- **Alternative:** extend `components/ui/empty-state.tsx`. Not chosen: it has a `text`-only API
  and inner-dark card styling meant for settings panels, not a table body. Left untouched.
- Default titles: "No record created yet" for first use, "No record found" for filtered-empty.
  The plain fallback row passes "No items found" explicitly, so a failed request does not claim nothing was created.
- The card chrome of the first-use screen must match the screenshot (plain, no inner dark card),
  so the component does not wrap its content in `EmptyState`.

### D5. `clearFilters` keeps sort and page size

`useDataTableParams` returns `clearFilters`, built on `setParams` with the filter keys and
`search`, `from_date`, `to_date` set to `undefined`. `setParams` already resets the page when those
keys change.

- **Why not `resetParams`:** it replaces the whole query string, dropping sort and page size, which
  the user did not ask to change.
- It uses the stable `setParams`, so it is stable across URL changes (spec "Bound handlers are
  referentially stable").
- The key list comes from `useListParams`, which returns `clearableKeys`: `search`, `from_date`
  and `to_date`, plus `options.filter.keys`, without duplicates.

**Correction during implementation:** the first draft built the list in `useDataTableParams` from
`options.filter?.keys` plus a local constant. `from_date` and `to_date` are in no table's options, and
tables without a `filter` config (brand, tag, category) do not list `search`. Putting them in every
table's `filter.keys` was rejected: `useListParams` spreads parsed filter values last, so they would
override the start-of-day and end-of-day formatting of the two dates. The three base keys now live in
`use-list-params.ts`, where the page-reset list already used them, and that list reuses the same constant.

## Risks / Trade-offs

- **[Toolbar disappears on first use]** If a table holds state in its toolbar (for example a
  search box with unsent text), it is unmounted when the first-use screen shows. → The screen only
  shows with no filters and total 0, where there is nothing to search. Verify the search box
  clears its local text when `clearFilters` removes the URL param.
- **[Search box text after "Clear Search"]** The searchbox may keep its own debounced local state
  and not follow the URL. → Check `searchbox.tsx` and the table filter components during build;
  fix at the call site if it does not sync.
- **[Order `status` default]** If the orders list writes `status=all` to the URL, it would count
  as an active filter and the empty store would show the filtered-empty screen. → Verify the order
  parser and defaults before wiring orders. Out of scope here (orders are not wired).
- **[Icon sizes]** Entity icons are 56px, `EmptySearchIcon` is 30px. → Pass an explicit size, or
  accept the difference seen in the design (the search icon looks smaller there too).
- **[Implicit total opt-in]** → Documented in the spec scenario and in `docs/data-table.md`.

## Migration Plan

No data or API change. `DataTableEmptyState`'s props change from `text` to `title`/`description`;
there is no other consumer. Other tables adopt it one at a time by passing `hasActiveFilters`,
`emptyState` and `emptyFilterState`. Rollback is a revert of the change.
