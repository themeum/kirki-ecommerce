## Why

The admin's shared list table renders a sort affordance that almost nothing uses: a column's
identifier is sent verbatim as the backing service's sort field, but only the taxonomy tables and
one customer column opt in — and three of those identifiers are absent from their service's
allowlist, so they present as sortable and silently do nothing. Six toolbars work around this with
an ad-hoc direction toggle that flips the sort order of a field no table displays.

Three neighbouring systems have meanwhile drifted into per-feature copies: a bulk-action bar that
makes a merchant pick from a list of one and then confirm, a column-visibility control built
privately by one feature because the table cannot host one, and a filter popup plus active-filter
chip bar rebuilt three times over.

## What Changes

- **Sorting becomes real.** Every data-bearing column across the nine server-driven tables becomes
  sortable, including derived ones — product price (held on variants), taxonomy product counts,
  customer order counts, lifetime spend, last order date and location, order line quantity. A
  single shared backend concern replaces the sort clause duplicated across seventeen services and
  the allowlist duplicated across fourteen controllers, and becomes the one place a column
  identifier is resolved to a column, alias or subquery.
- **Sorting gains a third state.** A column now cycles ascending → descending → unsorted, returning
  the list to its default order.
- **BREAKING** The ad-hoc sort-direction toggle is removed from all six toolbars that carry one.
- **A single bulk action is a single button.** When a table offers exactly one bulk action, the bar
  presents that action as one button rather than a picker plus a confirm. Bulk actions gain a way to
  declare themselves destructive so the button can say so. A failed bulk action now keeps the
  selection instead of discarding it, and the control reports that it is working.
- **Column visibility becomes built-in and persistent.** Every table offers a column show/hide
  control by default, positioned consistently, staying open across several toggles, and remembering
  each merchant's choices between visits. A table may opt out explicitly.
- **BREAKING** Inventory's private column-visibility control is removed in favour of the shared one.
- **The filter popover is shared and states what it is doing.** One shell replaces three copies. Its
  trigger reports how many filters are applied and offers to clear them all.
- **BREAKING** The active-filter chip bar is removed from the three tables that carry one, along
  with the table's filter-bar region, which no caller then supplies.
- Documentation: a `docs/data-table.md` covering how to add a listing table, with the
  column-identifier-to-service-field contract stated explicitly, since a mismatch fails silently.

## Capabilities

### New Capabilities
- `list-sorting-api`: The backend contract for sorting a list endpoint — how a request's sort field
  is resolved to a real column, alias or subquery, how derived columns are made sortable, and how
  an unrecognised field or direction is handled.
- `data-table-column-visibility`: The table's built-in column show/hide control — which columns it
  offers, how it is labelled, how it stays open across several toggles, and how a merchant's
  choices persist per table.
- `data-table-filter-popover`: The shared filter popover — its draft-then-apply behaviour, and a
  trigger that reports the applied filter count and clears all of them.

### Modified Capabilities
- `data-table`: sorting gains an unsorted third state; the bulk-action bar collapses to a single
  button when only one action exists and no longer discards a selection on failure; the table hosts
  the column-visibility control itself; the filter-bar region is removed.
- `data-table-params-binding`: the binding must translate the table's "no sort" state back into
  cleared address state rather than ignoring it.
- `list-table-composition`: every list table declares a stable table identifier; a feature no longer
  supplies its own sort-direction toggle or active-filter chip bar.
- `inventory-table`: its column-visibility control is the shared one rather than a private control
  in its toolbar.

## Impact

- **Backend**: a new sorting concern under `app/Concerns/`; the sort clause in ~17 services under
  `app/Services/`; the sort allowlist in ~14 controllers under `app/Http/Controllers/Api/`. Fixes a
  live fault where a malformed sort direction reaches the query builder and raises a 500.
- **API**: the set of accepted sort fields widens on every list endpoint; no existing field is
  withdrawn.
- **Frontend**: `resources/app/components/data-table/` (props, selection bar, two new modules);
  `resources/app/hooks/use-data-table-params.ts`; all 11 table wirings, their column modules and
  their toolbars under `resources/app/features/`; six deleted filter-bar and toolbar controls.
- **Tests**: `tests/Integration/*ApiTest.php` for the newly sortable fields, especially derived ones
  where a wrong alias fails silently rather than erroring; the Vitest suites for the table and its
  params binding.
- **Docs**: new `docs/data-table.md`.
