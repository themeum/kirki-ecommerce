## Why

Every list table shows the same plain "No items found" row when it has no rows. A merchant who has
created nothing yet and a merchant whose search matched nothing see the same message, and neither gets a
next step. The first needs a prompt to create the first item. The second needs a way to clear the search.

## What Changes

- `DataTable` tells apart two empty results and presents each one differently:
  - **Empty state** – no filters are active and the server reports a total of 0. The card shows only the
    message; the toolbar, column headers and pagination are not rendered.
  - **Empty filter state** – filters or search are active and no rows match. The toolbar and column
    headers stay rendered; the body shows the message.
- Two shared presentational components, each accepting an icon, a title, a description and actions:
  - `DataTableEmptyState` – its props change from `icon` / `text` to `icon` / `title` / `description` / `actions`.
  - `DataTableEmptyFilterState` – new; defaults to the search icon and a "try a different search or clear
    your filters" message.
- `DataTable` gains two inputs: `hasActiveFilters` and `emptyFilterState`. The existing `emptyState`
  input now supplies the "nothing created yet" presentation.
- `useDataTableParams` returns `hasActiveFilters` and `clearFilters`, so a table passes one flag and wires
  one action.
- The empty state is chosen only when the caller reports a total. A table that gets no total (for
  example a failed request) falls back to the plain empty row, so an error is never shown as "add your first item".
- Every list table under `features/` except settings and customer groups is wired: products, orders,
  customers, collections, coupons, inventory, brands, tags, categories. Each uses its own entity icon and
  its existing create route or dialog. Copy is the product wording for now.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-table`: the empty-result requirement is split into a first-use presentation and a
  filtered-empty presentation, each customisable; the "headers remain rendered" scenario now applies
  to the filtered and fallback cases only; the table accepts a filters-active input.
- `data-table-params-binding`: the binding reports whether any filter is active and offers a way to
  clear filters without touching sort or page size.

## Impact

- `resources/app/components/data-table/data-table.tsx`, `data-table-empty-state.tsx`, new
  `data-table-empty-filter-state.tsx`, `index.ts`, `data-table.test.tsx`.
- `resources/app/hooks/use-data-table-params.ts` and its test.
- `resources/app/hooks/use-list-params.ts` (returns `clearableKeys`).
- The nine list tables under `resources/app/features/*/components/*-table/` (wiring).
- `openspec/specs/data-table`, `openspec/specs/data-table-params-binding`, `docs/data-table.md`.
- No API, backend or dependency change. `DataTableEmptyState` has no consumer outside `DataTable`,
  so the prop change is not breaking in this repository.
