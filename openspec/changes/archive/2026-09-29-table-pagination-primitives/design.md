## Context

See proposal.md — Why. Additional constraints that shape the approach:

- **Styles must be scoped or they lose.** `theme/mixins.ts`'s `scoped()` nests
  styles under `#wpbody-content .kirki-ecommerce-root &&`; the doubled `&&`
  raises specificity above `theme/normalize.ts`'s form-control resets and
  wp-admin's own table/button CSS. Anything using a bare `css={cssOverride}`
  is losing that fight today.
- **eslint enforces the boundary this change is fixing.** `no-restricted-imports`
  is `error` and forbids `components/**` from importing `@/features/*`. The
  `editMode` styles do not import a feature, but they encode one — moving them
  out aligns the code with the rule's intent.
- **The primitive layer has 24 direct consumers**, 5 of which are non-list
  editor tables that will keep hand-rolling rows after the wider rewrite. The
  primitives therefore have to remain pleasant to use directly, not just as a
  DataTable substrate.
- `TableAlignment` is `'right' | 'center'` only — start-aligned is the absence
  of a value, not a third member. Keep that.
- Radix `Select` (used by the page-jump control) only mounts its content
  children when open, so enumerating page options is a per-open cost, not a
  per-render one.

## Goals / Non-Goals

**Goals:**

- One feature-agnostic table primitive layer, complete enough that no caller
  needs a raw `<table>` element.
- Pagination composable into the bar the admin design calls for, and reusable in
  a dialog with no routing involved.
- The prop rename lands as a compile error at every call site, never a silent
  no-op.

**Non-Goals:**

- No behavioural change to any table. This change is presentational; no table
  gains sorting, selection, an empty state or a loading state here.
- Not wiring the new pagination into anything. It ships unconsumed; the DataTable
  rewrite adopts it.
- Not deleting `components/pagination.tsx`, `components/sorting.tsx` or
  `bulk-action-handler.tsx` — they still have live consumers until the migration
  changes land.
- No sticky header, column resizing, or virtualization.

## Decisions

### Follow shadcn v4's part list, but keep the repo's own composition idiom

Shadcn's table is a set of `forwardRef` wrappers over the native table elements
with a `data-slot` attribute on each and no variant props. This repo already has
that exact shape in `components/ui/card.tsx` and the current `table.tsx` —
plain-DOM compound, `forwardRef`, explicit `displayName`, named exports, module
scope `defineStyles` block at the bottom of the file. So the migration is:
adopt shadcn's *part list* and the container div, keep the repo's
`cssOverride`/`scopedMerge` styling contract rather than shadcn's
`className`+`cn()`.

*Alternative considered:* import shadcn's table verbatim and add `cn()`/tailwind.
Rejected — this app has no tailwind, and `className` on a primitive would bypass
`scoped()` and lose to wp-admin CSS.

### Keep presentational variant props; drop only the feature-shaped one

Stock shadcn has no variant props at all. Going that pure would push `density`,
`alignment`, `active`, `disabled` and `onlyCheckbox` out to ~24 call sites as
duplicated `cssOverride` objects — worse for consistency, and it would put the
hover-reveal row-actions contract nowhere. The dividing line used instead is
**presentational vs. feature-shaped**: a prop stays if it describes how the cell
looks, and goes if it is named after a screen.

By that test `editMode` fails outright (`multiCell` exists solely for the
bulk-edit grid; `singleCell` solely for inventory) and `scrollable` is redundant
once a scroll container exists. `onlyCheckbox` passes — it is `width: 1%`, plus
`width: 40px` under `fixed` — even though shadcn has no equivalent.

*Alternative considered:* replace `onlyCheckbox` with a generic `width` prop.
Rejected as a bigger diff that reads worse at the call site, and column widths
are about to become TanStack's `size` for list tables anyway.

### Rename `type` → `density`, `variation` → `compact`

`type` on a table part is meaningless — nothing about a table has a "type" — and
`variation` was named after the product-variations table that first needed the
padding. `density` with `default | compact | wide` names the observable result.
This is a **breaking rename by design**: removing the old prop name means every
call site fails `tsc --noEmit` rather than silently rendering at default
density, which is what makes the 24-site sweep safe.

### Move the two `editMode` blocks to their owning features

`multiCell` (~110 lines: `data-bulk-cell` selected/fill states, `data-bulk-edge`
min/max borders, the `data-grabber` drag handle, sticky first column) becomes a
style module under `features/bulk-edit/`. `singleCell` (6 lines: suppress row
hover, add cell hover) becomes one under `features/inventory/`. Both are plain
`CSSObject`s passed to `Table cssOverride`, which the existing `mergeCss`
pipeline handles.

The data attributes those styles target (`data-bulk-cell`, `data-bulk-edge`,
`data-grabber`, `data-sticky-cell`) are set by feature code already, so nothing
about the runtime contract changes — only where the CSS lives.

*Alternative considered:* a generic `variant` slot on `Table` that features
register into. Rejected as speculative indirection for two known consumers.

### Fix the unscoped-override bug as part of the rewrite

`TableHeader`, `TableBody` and `TableRow` currently do `css={cssOverride}` while
their siblings use `scopedMerge`. That is a latent bug, not a style choice — an
override on those three parts is beaten by wp-admin. All eight parts use
`scopedMerge` after this change. Worth calling out because it can *change
rendered output* at existing call sites that pass overrides to those parts,
which is the one place this "presentational-only" change could surprise someone.

### Pagination targets are `<button>`, not `<a href>`

Shadcn's `PaginationLink` is an anchor, which presumes the page is addressable
and that the component knows how to build the address. Here list state lives in
URL search params managed by `use-list-params`, and one consumer
(`select-products-dialog`) is not URL-driven at all. Buttons that report a page
number upward keep the component decoupled from react-router and usable in both
places; `aria-current="page"` carries the active semantics that an anchor would
otherwise imply.

*Trade-off accepted:* no middle-click or open-in-new-tab on page numbers. Given
this is a wp-admin SPA behind hash routing, that was never really working.

### Extract `getPageItems` to a pure util

The sibling/ellipsis window math is the only genuinely testable logic in the old
pagination component and it is currently trapped inside it. Moving it to
`utils/pagination.ts` verbatim lets it be unit-tested in the `node` vitest
project without a DOM, and lets the new component stay presentational. Copy the
existing implementation rather than rewriting it — its behaviour is already
correct and the spec's window scenarios are written against it.

### Add `PaginationPageSelect` as an explicit repo-local part

The "Page ⌄ of 10" jump control is in the admin design but not in shadcn. Rather
than bending `PaginationLink` into it or leaving it assembled ad-hoc at every
call site, it is a named part alongside the shadcn ones — the same way this repo
already adds `DropdownMenuShortcut` next to Radix-derived parts.

## Risks / Trade-offs

- **[The prop sweep is smaller than it looks, which is its own risk — it is easy
  to assume a file needs no change]** → 27 files import the primitives but only 6
  `<Table>` elements pass a removed or renamed prop. The removed names are type
  errors, so `tsc --noEmit` produces the authoritative list; trust it over
  grepping.
- **[Fixing the unscoped `cssOverride` on header/body/row can change existing
  rendered output]** → There is exactly one live consumer:
  `features/products/components/product-form/sections/variants/variation-table/single-group.tsx:82`
  passes `cssOverride={styles.hoverParent}` to `TableRow`. Those styles are about
  to start winning where they previously lost, so that row's hover behaviour
  needs an explicit visual check.
- **[The scroll container adds a wrapper element, which can break selectors or
  layout that assumed `<table>` was a direct child]** → Grep for descendant/child
  selectors and flex/grid rules targeting tables in feature styles before
  landing.
- **[Extracted feature style modules could drift from the data attributes the
  feature sets]** → They already can; the coupling is unchanged, but it is now
  visible inside the feature that owns both halves, which makes drift *less*
  likely than with the CSS parked in `components/ui/`.
- **[Two pagination components coexist until the cleanup change]** → Accepted
  deliberately: the old one keeps 7 live consumers working. `knip` will flag the
  new one as unused until the DataTable change adopts it — expected, not a
  regression.
