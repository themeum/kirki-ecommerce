## Why

`resources/app/components/ui/table.tsx` is a design-system primitive that owns
~110 lines of bulk-edit-specific spreadsheet CSS (`editMode: 'multiCell'` —
drag grabbers, `data-bulk-cell`, `data-bulk-edge` fill states), which violates
the repo's own eslint boundary rule that `components/**` must not know about
features. It is also missing the parts a table needs to be complete (`<tfoot>`,
`<caption>`), has no horizontal-overflow container, and applies `cssOverride`
**unscoped** on three of its six parts — so overrides on `TableHeader`,
`TableBody` and `TableRow` silently lose to wp-admin's CSS.

Separately, `components/pagination.tsx` is a single monolithic component with no
composable parts, an inconsistent `css` prop (the rest of the repo uses
`cssOverride`), and a `PaginationData` type that is structurally incompatible
with the `PaginatedData<T>` the API actually returns — every call site casts
across the gap, and `data-table-pagination.tsx` needs a double
`as unknown as` cast.

This change lays the foundation for the table stack rewrite: a complete,
feature-agnostic set of table primitives and a composable pagination component,
both following the shadcn v4 component architecture. Nothing consumes the new
pagination yet — that lands with the DataTable rewrite.

## What Changes

- Rewrite `resources/app/components/ui/table.tsx` to the full shadcn v4 part
  list: `Table` (now wrapped in an `overflow-x: auto` container div),
  `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, plus the
  new `TableFooter` and `TableCaption`.
- **BREAKING**: rename the `type` prop to `density`, and its `variation` value
  to `compact` (`'default' | 'compact' | 'wide'`). Only 4 call sites pass `type`
  today — 3 as `variation` (brands, categories, product-form variations) and 1 as
  `wide` (customer groups).
- **BREAKING**: remove the `editMode` prop. Its two consumers are the bulk-edit
  grid (`multiCell`) and the inventory table (`singleCell`); the `multiCell`
  styles move to a feature-local style module under `features/bulk-edit/`, the
  6-line `singleCell` block to `features/inventory/`, both passed back in via
  `Table cssOverride`.
- **BREAKING**: remove the `scrollable` prop — the new container div handles
  horizontal overflow. Its single consumer is the bulk-edit grid.
- Keep `fixed`, `alignment`, `active`, `disabled`, `onlyCheckbox` and
  `cssOverride`. `onlyCheckbox` is not a shadcn part prop, but it is purely
  presentational and used 23 times across 22 files; dropping it would scatter the
  same `width: 1%` / `40px` rule across features.
- Fix the scoping bug: all parts merge `cssOverride` through `scopedMerge`, not
  just `Table` / `TableHead` / `TableCell`.
- Add `resources/app/components/ui/pagination.tsx` following the shadcn v4
  pagination architecture: `Pagination` (`<nav>`), `PaginationContent` (`<ul>`),
  `PaginationItem` (`<li>`), `PaginationLink`, `PaginationPrevious`,
  `PaginationNext`, `PaginationEllipsis`. Links render as `<button>` rather
  than shadcn's `<a href>`, so pagination stays decoupled from react-router and
  usable inside dialogs.
- Add one repo-specific part, `PaginationPageSelect`, for the "Page ⌄ of N"
  jump control the admin design requires.
- Extract the sibling/ellipsis page-window math out of the old pagination
  component into `resources/app/utils/pagination.ts` as a pure, unit-tested
  `getPageItems()`.
- `components/pagination.tsx` is left in place and untouched; it is deleted in
  a later cleanup change once nothing imports it.

## Capabilities

### New Capabilities

- `table-primitives`: The presentational table element layer — which parts
  exist, what each renders, how density/alignment/row-and-cell state are
  expressed, the `data-*` contracts other components style against (notably
  the hover-revealed row-actions contract), how style overrides compose, and
  the rule that this layer stays feature-agnostic.
- `pagination-controls`: The composable pagination element layer — its parts,
  the page-window/ellipsis computation, active and disabled page semantics, and
  its accessibility contract.

### Modified Capabilities

(none — no existing main spec covers the table or pagination element layers)

## Impact

- **Rewritten**: `resources/app/components/ui/table.tsx`
- **New**: `resources/app/components/ui/pagination.tsx`,
  `resources/app/utils/pagination.ts`, `resources/app/utils/pagination.test.ts`,
  `resources/app/components/ui/pagination.test.tsx`
- **New feature-local styles**: a bulk-edit table style module holding the
  former `multiCell` block, and an inventory one holding `singleCell`
- **Call sites**: 27 files import `@/components/ui/table`, but there are only 14
  `<Table>` elements and just **6 need editing** — `type="variation"` in
  `brands/.../brand-table.tsx`, `categories/.../category-table.tsx` and
  `products/.../variants/variation-table.tsx`; `type="wide"` in
  `customers/pages/customer-groups/customer-group-table.tsx`;
  `scrollable editMode="multiCell"` in `bulk-edit/.../bulk-edit-table.tsx`; and
  `editMode="singleCell"` in `inventory/.../inventory-table.tsx`. The remaining
  files only use the row/cell parts, which keep their prop names.
- **Types**: `TableType` in `types/components/common.ts` becomes
  `TableDensity` (`variation` → `compact`); `TableEditMode` is removed from
  `ui/table.tsx`
- **Unchanged**: `components/pagination.tsx`, `components/sorting.tsx`, and all
  data-fetching, query and list-param behaviour. This change is presentational
  only — no table gains or loses a feature.
- **Behavioural risk, one file**: scoping `cssOverride` on the row/section parts
  can change rendered output where an override was previously being beaten by
  wp-admin CSS. There is exactly one such call site today —
  `products/.../variation-table/single-group.tsx:82`,
  `<TableRow cssOverride={styles.hoverParent}>` — which needs a visual check.
