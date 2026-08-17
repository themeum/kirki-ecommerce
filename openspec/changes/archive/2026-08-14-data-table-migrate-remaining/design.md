## Context

See proposal.md — Why. The state of the thirteen tables, which is uneven enough that
batching matters:

**Near-identical clones (~158 lines each, differing by roughly 10 lines):**
brands, categories, tags. Same page shape, same toolbar shape, same
`useMarkList` + `BulkActionHandler` + `single-row.tsx` structure, same three-times-
duplicated `useListParams` defaults. Brands and categories also pass
`type="variation"` to the table; tags does not.

**Variations on that shape:** collections (112 lines, a sort-toggle button in the
toolbar rather than sortable headers), customers (127 lines, `formCard` styling
rather than `tableCard`, sorting on only the customer column, plus a disabled date
filter and a dead filter button in its toolbar).

**Genuinely different among the eight:**

- **inventory** (106 lines) — takes no data prop; it reads rows from
  `useInventoryForm()` context, a form-backed store, and its `useMarkList` runs over
  `Object.values(results)` of a keyed object rather than an array. Its bulk action
  navigates to the bulk-edit screen with `?ids=`. It has a column-visibility
  dropdown backed by local `selectedFields` state. Uses `editMode="singleCell"`.
- **customer groups** (55 lines) — mock rows, `noop` checkbox handlers,
  untranslated header strings, no service, no query, no list params. Its page's
  filter UI is also non-functional.
- **variation library** (149 lines) — no server paging and no `useListParams` at
  all; searches client-side via `getSearchedValue(keyword, results)` over a local
  array; `useMarkList({ data: { results, total: results?.length } })`; bulk delete
  goes through `confirmAction` from `useOutletContext<SettingsOutletContext>()`; has
  its own hand-rolled "No data found" block.

**The five non-list tables:** the bulk-edit grid (66-line table + 530-line row,
cell-range drag-fill, `editMode="multiCell"`, `scrollable`), the product-form
variants table (285 + 285 lines, react-hook-form bound, grouped rows), the
order-details items table (46 lines, pure display, no header), the order-create item
rows (96 + 68 lines, `<Table><TableBody>` with no `<thead>` at all), and the
product-picker inside `select-products-dialog.tsx` (398 lines with the table inline,
its own `Set`-based variant-aware selection, its own `Pagination`).

Also relevant: every one of the six list pages already destructures `isFetching` and
passes it to its table; every one of those tables declares `isFetching?: boolean` in
its props type and never destructures it.

## Goals / Non-Goals

**Goals:**

- All eight list tables on the new DataTable, with sorting, loading and empty
  behaviour preserved or gained rather than lost.
- All five non-list tables off the old primitives, so the old `table.tsx` has no
  remaining consumers.
- One `*ListOptions` constant per feature, replacing three duplicated literals.
- Nothing left importing `useMarkList`, `BulkActionHandler`, `sorting.tsx` or
  `components/pagination.tsx`, so the cleanup change can proceed.

**Non-Goals:**

- Not building a customer-groups service. That table stays mock data.
- Not making the dead filter controls work (customers' and collections' disabled
  date filters, customers' non-functional filter button). Migrating them is not the
  same as implementing them.
- Not adding the missing search debounce to the legacy toolbars. It is a real defect
  but a separate one; changing input timing while also changing the table would
  confound any regression.
- Not turning the bulk-edit grid, the variants table, the items tables or the
  product picker into DataTables.
- Not adding sorting where it does not exist today, nor removing it where it does.

## Decisions

### Batch order: brands first, then its two clones, then the divergent ones

brands → categories → tags → collections → customers → inventory → variation
library → customer groups. Brands is the archetype: whatever shape it lands in is
copied twice almost verbatim, so it is worth getting exactly right before touching
anything else. The divergent three (inventory, variation library, customer groups)
come last, when the pattern is settled and their oddities can be handled as
deliberate deviations rather than as competing precedents.

The five non-list tables come after all eight, because their only requirement is the
primitives rename and they cannot teach us anything about the DataTable API.

### `single-row.tsx` becomes column cells, and the edit dialog is hoisted

Each `single-row.tsx` today owns three things: the row's cells, an edit-dialog
`useState`, and a delete mutation. The cells become `cell` renderers in
`columns.tsx`. The dialog and the mutation move up to the table component, driven by
one `editingItem` state.

This is a real improvement, not just relocation: today a ten-row page mounts up to
ten dialog components and ten mutation hooks, one per row. After this there is one
of each per table. It also means `columns.tsx` can stay a module-scope constant,
because the cells no longer need per-row hooks — the row-actions cell just calls
back with its item.

### Preserve sorting exactly where it exists

brands, categories and tags sort on most columns; customers sorts only on its
customer column; collections has a sort-toggle button in its toolbar instead of
sortable headers. Those columns get `enableSorting: true` with an id matching the
service's sort field; everything else stays unsortable.

The important check here is the id: the old `Sorting` config carried an explicit
`sort_by` string (`'name'`, `'description'`, `'slug'`, `'count'`), and those strings
must become the column ids verbatim. A mismatch produces a header that appears
sortable and a sort the server ignores — a silent failure, so each one is verified
against its service rather than inferred from the column heading.

Collections' toolbar sort-toggle is left as it is. Converting it to sortable headers
would be a UI change, not a migration.

### Pages shed their table wiring entirely

Each list page currently owns `useListParams`, the query, `loaded`, the
`Card`/`CardContent` wrapper, `Pagination` and a `PaginationData` cast. All of that
moves into the table component or is absorbed by the DataTable. The page keeps its
heading and its page-level actions.

This deletes the `loaded` gate, which is the specific mechanism by which searching
currently blanks the screen: the page unmounts card, table and pagination together
rather than letting the table show a loading state in place.

Customers is the one to watch — its page uses `cardStyles.formCard` and a bare
`CardContent`, not the `tableCard` / `tableContent` pair the others use, so its
visual result after adopting the DataTable's own card will differ slightly and needs
a look.

### One `*ListOptions` constant per feature

The three duplicated `useListParams({ defaults: {...} })` literals per feature
collapse into one module-scope constant in the feature's `types.ts`, matching
`productListOptions`. This is not tidying: `useListParams` only returns stable
setters when its options argument is a stable reference, and three fresh object
literals per render guarantee it never is. The duplication was quietly defeating the
memoisation the new DataTable's header and toolbar rely on.

### Inventory keeps its form-backed data source

Inventory's rows come from `useInventoryForm()` context, not from a query, and its
`results` is a keyed object rather than an array. The DataTable is fully controlled
and takes an array, so inventory converts (`Object.values(results)`) at the boundary
and supplies its own page count from the same source. Its bulk action continues to
navigate to bulk-edit with `?ids=`, now reading `selectedIds` from the reported
selection state instead of `useMarkList`.

Its column-visibility dropdown moves from local `selectedFields` state to the
DataTable's `columnVisibility`, which is the same information in the shape the table
already understands.

### The variation library filters locally and turns paging off

This is the one list table with no server behind it. Rather than teaching the
DataTable a client-side mode — which would contradict its "does not filter rows
itself" contract — the feature keeps calling `getSearchedValue(keyword, results)` and
supplies the filtered array, with paging disabled. Its hand-rolled "No data found"
block is replaced by the DataTable's empty state, so a local search that matches
nothing looks like every other empty list.

Its bulk delete keeps going through `confirmAction` from the settings outlet context.

### Customer groups is ported as a static mock

It has no service, so there is nothing to wire. It gets the new DataTable with the
mock array as its rows, real local row selection replacing the `noop` handlers, and
its header strings put through the translation function they currently skip. When the
API arrives, swapping the mock array for a query is a small, isolated change.

The alternative — deleting the screen — was rejected because it removes something
currently reachable in the admin. The alternative of leaving it alone was rejected
because the cleanup change deletes the primitives it depends on.

### The five non-list tables move primitives only

They keep their hand-rolled rows. The bulk-edit grid drops `scrollable` and
`editMode="multiCell"` in favour of the feature-owned style module; the variants
table swaps `type="variation"` for `density="compact"`; the two order tables and the
picker need no prop changes at all beyond compiling against the new parts.

The one structural change: the product-picker table is extracted out of the 398-line
`select-products-dialog.tsx` into its own module. It is being touched anyway, it is
the only table in the app defined inline in a dialog, and its `Set`-based
variant-aware selection is worth being able to find.

## Risks / Trade-offs

- **[Eight tables in one change is a large diff, and the three near-clones invite
  copy-paste divergence]** → Land brands completely and verify it before starting
  categories; do the two clones as near-mechanical copies; verify after each group
  rather than at the end.
- **[A sortable column whose id does not match the service's sort field produces a
  header that sorts nothing, with no error]** → The old `Sorting` configs contain the
  exact strings; carry them over verbatim and check each against its service. Do not
  derive an id from the column heading.
- **[Hoisting per-row edit dialogs changes when a dialog mounts and unmounts, which
  can expose state the dialog previously reset by remounting per row]** → Key the
  hoisted dialog on the editing item's id so switching rows still remounts it.
- **[Inventory's data source is a form store, not a query, so "is a request in
  flight" has no obvious value to pass]** → Use the loading signal its form context
  already exposes; do not invent a query for it.
- **[Customers' page card styling differs from the other five, so adopting the
  DataTable's card will shift its appearance]** → Flagged for an explicit visual
  check rather than assumed equivalent.
- **[Customer groups stays mock, so it will look real and do nothing]** → It already
  does. Keep the mock obvious in the code so nobody mistakes it for a wired screen.
- **[The five non-list tables are low-risk but easy to declare done without
  checking, especially the bulk-edit grid whose styles moved files]** → The grid's
  drag-fill, grabber and sticky column are the specific things to exercise; they are
  pure CSS that moved, so a compile success proves nothing about them.
- **[Nothing here has automated coverage — the tests added in `data-table-tanstack`
  cover the component, not these call sites]** → Accepted, consistent with the
  repo's current state; the manual verification list at the end of the tasks is the
  substitute and should be worked through per table, not skimmed.
