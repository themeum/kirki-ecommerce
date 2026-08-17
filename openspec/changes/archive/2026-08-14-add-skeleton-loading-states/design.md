## Context

See proposal.md — Why.

Four facts about the current code shape the approach:

- `components/data-table/data-table.tsx` renders loading as one `TableRow` with a
  single `colSpan` cell holding `<Spinner/>`. All eleven consumers already pass
  `isLoading={isFetching}`, so the whole Tier-1 behaviour lives behind one prop
  that is already wired.
- Every list query sets `placeholderData: keepPreviousData`. While a new page or
  filter is fetching, `data` still holds the rows that were on screen a moment
  ago — which is exactly the row count a placeholder needs.
- Emotion styles in this app must be scoped under
  `#wpbody-content .kirki-ecommerce-root` via `scoped`/`scopedMerge`, or WordPress
  admin CSS and `theme/normalize.ts` win. This applies to the new primitive.
- `components/ui/separator.tsx` already solves "caller passes `string | number`,
  component emits a CSS length": a module-local `toCssLength`, values pushed
  through CSS custom properties, token fallbacks baked into `defineStyles`.

## Goals / Non-Goals

**Goals:**

- One primitive, composed everywhere — no second placeholder abstraction.
- Table placeholders derive themselves from the live table instance, so column
  visibility, pinning and alignment need no duplication and cannot drift from
  `columns.tsx`.
- Zero call-site churn for the eleven `DataTable` consumers.

**Non-Goals:**

- No shared `toCssLength` utility. `separator.tsx` keeps its own copy; extracting
  it would be a refactor of working code outside this change's reach.
- No `prefers-reduced-motion` handling. Nothing in this codebase has it —
  `spinner.tsx`, `dialog.tsx`, `accordion.tsx`, `overlay-motion.ts` and
  `unsaved-toast.tsx` all animate unconditionally — so introducing it here would
  set a convention for one component while the rest of the app ignores it. Worth
  doing app-wide, as its own change.
- No `count` prop on the primitive, and no per-column placeholder hints in
  `ColumnMeta`. Both were considered and rejected as speculative.

## Decisions

### The table placeholder reads the table instance, not a column list

`DataTableSkeleton` takes the TanStack `table` object and walks
`getVisibleLeafColumns()`. Alternative considered: a per-feature skeleton file
for each of the eleven tables, giving per-column fidelity (thumbnail squares,
badge pills, right-aligned price bars). Rejected — eleven files that must be kept
in step with eleven `columns.tsx` files, and every one of them silently wrong the
day a column is added. Deriving from the instance also inherits
`meta.alignment`, `meta.cssOverride` and pinning for free.

The cost is uniform placeholder bars where the loaded row has varied shapes. The
one exception worth special-casing is the selection column: it is `size: 40` and
`onlyCheckbox`, so it gets a 16×16 placeholder instead of a full-width bar, or
the column collapses.

### Row count comes from `data.length`, falling back to page size

`data.length || pagination.pageSize`. Because of `keepPreviousData`, `data` is the
outgoing page during a refetch, so the placeholder matches the height being
replaced exactly — including a partial last page. `pageSize` alone was the
alternative; it over-reserves on partial pages, which is the very shift this
change exists to remove.

### `isFetching` stays the trigger

Keeping the existing flag means the whole Tier-1 change lands inside
`data-table.tsx` with no consumer edits. The trade-off is that a post-mutation
invalidation also shows placeholders — deleting a row briefly replaces the table.
The alternative, `isPending || isPlaceholderData`, keeps rows visible across
mutations but costs a new prop plus eleven call-site edits, and would stop the
placeholder appearing on the plain refetch cases users see most.

### Loading is announced by `aria-busy`, not `role="status"`

`aria-busy="true"` on the `<Table>` while fetching; every skeleton is
`aria-hidden`. `role="status"` on the `<tbody>` would override its
`rowgroup` role and break table semantics, and a hidden live-region node inside a
`<td>` exists only to keep three test assertions unchanged. Those three
assertions in `data-table.test.tsx` currently select the loading state through
`Spinner`'s `role="status"`; they move to `aria-busy` and placeholder counts.

### Skeleton directories exist only where they hold a file

Because the table placeholder is generic, `brands`, `categories`, `tags`,
`coupons` and `inventory` have nothing feature-specific to place in a
`skeletons/` directory — their only loading surface is a `DataTable`. Git cannot
track an empty directory, so those five features get none. Every other feature,
and each of the ten settings sub-features, gets one alongside its existing
`pages/`, `schemas/` and `services/`.

### Composed skeletons mirror layout, not pixels

Each composed skeleton reuses the real `Card`, `CardContent`, `Flex` and
`cardStyles` wrappers of the view it stands in for, and places skeletons only
where text and controls go. Rebuilding the chrome out of skeletons would drift
from the real layout the first time a card's padding changed; reusing the chrome
means only the content shapes can drift.

## Correction during implementation

**The three embedded settings list views share one skeleton, not three.**
Tasks 5.3 assumed `variation-library` and `schema-profile` would get a skeleton
under `settings/essentials/skeletons/` and `shipping-box` one under
`settings/shipping/skeletons/`. In the code all three render the identical
`StackedItems` → `StackedItem` → media / title / actions shape, so three files
would have been three copies of the same twenty lines. They share
`features/settings/skeletons/stacked-list-skeleton.tsx` instead, parameterised by
`rowCount`, `hasMedia` and `actionCount`. That leaves
`settings/essentials/skeletons/` non-existent rather than empty, consistent with
the "directories exist only where they hold a file" decision above.

**Two pinning helpers moved out of `data-table.tsx`.** `getPinningStyle` and
`getPinnedCss` (with their `stickyStyles`) were module-local to
`data-table.tsx`. The skeleton needs the identical logic to keep pinned columns
aligned, and importing them back from `data-table.tsx` would have been a circular
import. They now live in `components/data-table/column-styles.ts`, imported by
both. This is an extraction the change itself forced, not opportunistic
refactoring — the alternative was passing both helpers down as props.

**`SettingsPageSkeleton` renders no `Container`.** The first draft wrapped
itself in one, then the settings pages turned out to place their
`<Container size="sm">` *outside* the `loaded ? … : …` branch, so the skeleton
would have nested a second container and double-padded the pane. The skeleton
renders the inner `Flex` column only and inherits the page's container. Each
sub-feature skeleton also passes its page's real `SettingsPageHeader` — that
component takes only a static icon and title, so the page title can be shown
immediately rather than as a placeholder bar.

## Corrections after review

**Placeholder row height is measured, not assumed.** The first implementation
gave each placeholder row only the height of the 12px bar inside it — about 40px
with cell padding, against a 58px product row — so the very shift this change
exists to remove survived at reduced amplitude. A single constant cannot fix it:
row height is set by the tallest cell content, which ranges from a line of text
(~43px) through a 32px thumbnail (~57px) to a brand table's 48px logo (~73px).
`data-table.tsx` therefore measures the real header row and the first real body
row from a ref on `<table>` after each non-loading render, and hands both to
`DataTableSkeleton`. Alternatives rejected: a `rowHeight` prop on `DataTable`
(eleven call-site edits, and each consumer would be guessing about its own
rendered output) and a per-column height hint in `ColumnMeta` (already rejected
as speculative when the skeleton was first designed). A measurement is only
missing before a table has ever displayed a row, which is the one case with no
prior layout to preserve; 42px / 58px serve as the fallback there.

**Route transitions render no fallback at all.** `withSuspense` in every
`features/*/routes.tsx` used `fallback={<LoadingSpinner />}`, which was excluded
from the original scope because a lazy chunk load is not an API request. That
reasoning held in isolation but not in sequence: every navigation showed a
spinner, then the destination's skeletons, then content — three states where the
change was meant to establish one. The fallback is now `null`, so the skeletons
are the only loading treatment a navigation presents, and
`components/loading-spinner.tsx` is deleted as orphaned.

**Three list views derive their rows during render.** Task 5.3 added an
`isLoading` gate to `variation-library`, `schema-profile` and `shipping-box`,
which fixed the empty state showing *during* the request but not the frame after
it. Each view copied the resolved query data into component state inside a
`useEffect`; because passive effects run after paint, the first render with
`isLoading === false` still saw an empty local array and drew the "nothing here
yet" card, which was then replaced. The lists are now derived with `useMemo`
during render, and the optimistic-delete-with-undo each view offers is tracked as
a `removedIds` array filtered out of the derived list — which is what the local
copy was really for.

## Risks / Trade-offs

- **Sorting is unavailable during every fetch** → Accepted deliberately: the
  requirement to replace the whole `<table>` was chosen with this consequence
  stated. Requests are short and the header returns as soon as data lands. This
  narrows the previously specified behaviour, so `data-table`'s existing
  requirement is rewritten rather than extended.
- **Post-mutation refetches flash placeholders** → Accepted with `isFetching`
  above. If it proves annoying in practice, the fix is one prop plus eleven
  call-site edits, and does not disturb the primitive or the composed skeletons.
- **Composed skeletons drift from their pages** → Mitigated by reusing the real
  card and layout wrappers, so drift is limited to the bars inside them. Not
  fully preventable; these are duplicated layouts by nature.
- **Twenty-odd skeleton compositions is a wide diff** → Mitigated by ordering
  tasks so the primitive and the table land and verify first; the composed
  skeletons are independent of each other and can be reviewed in groups.
- **A skeleton inside a table row sits on a hovered background** →
  `tbody tr:hover` repaints the cell background; the placeholder fill is a
  distinct token from the hover surface, so it stays visible.
