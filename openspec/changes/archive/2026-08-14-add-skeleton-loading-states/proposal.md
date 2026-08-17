## Why

Every data-fetching surface in the admin SPA signals loading by collapsing its
content area to a fraction of the height it will occupy once the query resolves —
a single centred spinner row inside the table, a full-page spinner in place of a
detail form, or a bare `Loading ...` string where a settings card belongs. The
result is a visible layout jump on every list page load, every pagination step,
every filter change and every record open. There is no skeleton primitive in the
design system today, so each surface has invented its own placeholder.

## What Changes

- Add a `Skeleton` UI primitive modelled on shadcn v4: a decorative pulsing
  block with caller-supplied width and height (`string | number`) and a radius
  token.
- **BREAKING (spec-level):** the data table's in-flight treatment now replaces
  the entire `<table>` — column headers included — with skeleton rows, instead
  of keeping the headers rendered over a single spinner row. Sorting is
  therefore unavailable for the duration of a fetch. The card, toolbar (search
  and filters) and filter bar remain real and interactive throughout.
- The number of skeleton rows tracks the rows that were just on screen, and each
  skeleton row is as tall as the row it replaces, so a pagination, sort, search
  or filter change reserves exactly the height it is about to fill.
- Route transitions drop their spinner fallback, so a navigation shows the
  destination page's own skeletons rather than a spinner followed by skeletons.
- Replace the full-page spinner on product, order, customer and collection
  record pages with skeletons shaped like the two-column card layout that
  follows.
- Replace the `Loading ...` placeholder on every settings page and on the bulk
  edit table with skeletons shaped like their own field layouts.
- Give embedded lists that fetch their own data — the product picker dialog, the
  customer search dropdown, the variation library, schema profiles, shipping
  boxes and the product form's category panel — repeating row skeletons.
- Loading state is expressed with `aria-busy` on the region being replaced;
  skeletons themselves are decorative and hidden from assistive technology.

Skeletons apply to query requests only. Mutation pending states keep their
existing button spinners, as do queries whose result feeds options into an
already-rendered control and queries that recalculate values already on screen.

## Capabilities

### New Capabilities

- `skeleton-primitive`: the shared skeleton building block — its sizing
  contract, its animation, and its accessibility posture.
- `detail-page-skeletons`: how a single-record page reserves its layout while
  the record loads, including which routes gate on a query at all.
- `settings-page-skeletons`: how settings pages and self-fetching embedded
  lists reserve their layout while their data loads, including when a list view
  may show its empty state.
- `route-transitions`: what a navigation shows between the link being activated
  and the destination page rendering.

### Modified Capabilities

- `data-table`: the requirement *An in-flight refresh replaces only the rows*
  currently mandates that column headers stay rendered during a fetch. It is
  replaced by a skeleton-based requirement covering the header row, the skeleton
  row count, `aria-busy`, and the surrounding controls that must stay real.

## Impact

- New: `resources/app/components/ui/skeleton.tsx`,
  `resources/app/components/data-table/data-table-skeleton.tsx`, and
  `skeletons/` directories under the features that need composed skeletons
  (`products`, `orders`, `customers`, `collections`, `bulk-edit`, and each
  settings sub-feature). Features whose only loading surface is a `DataTable`
  need no skeleton file — the table skeleton derives itself from the column
  definitions.
- Modified: `components/data-table/data-table.tsx` (loading branch, `aria-busy`,
  drops its `Spinner` import) and `components/data-table/index.ts`.
- Modified call sites: the three pages using `LoadingSpinner`, the thirteen
  using a `Loading ...` string, and the embedded lists listed above. The eleven
  `DataTable` consumers are untouched — they already pass `isFetching`.
- Removed: `components/loading-spinner.tsx`, orphaned once every
  `features/*/routes.tsx` drops it from its `Suspense` fallback.
- Tests: three assertions in `data-table.test.tsx` currently select the loading
  state via `getByRole('status')`, which the `Spinner` provided; they move to
  `aria-busy` and skeleton counts. New tests cover the primitive and the table
  skeleton.
- No dependency, API or backend changes.
