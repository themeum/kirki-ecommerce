## Context

See proposal.md - Why. Current state before this change:

- `styles.row` in `components/ui/stacked-items.tsx` sets `position: relative` and a hover
  background on the row box.
- `styles.ghostContainer` sets `paddingInline: 0` on each row, so the row box is the content box,
  and the hover background fills only the content box.
- The ghost focus ring is `&:has(a:focus-visible)::after` on the row, with
  `inset: spacing[1] -spacing[2]` and `radius.lg`.
- The ghost container uses `marginInline: -spacing[2]`, `paddingInline: spacing[2]`, and
  `overflow: auto`.
- The divider is a `borderBottom` on the wrapper div around each row (`styles.stackedItem`,
  `&:not(:last-of-type)`).
- All ghost callers are home dashboard cards in `OverviewCard`. `OverviewCard` sets
  `padding: spacing[4]` on `Card` and does not use `CardContent`. `Card`'s header, content, and
  footer sections also use `paddingInline: spacing[4]`.
- Callers pass `padding: 0` to the row through `cssOverride` (one class). A ghost container
  descendant rule (two classes) has a higher specificity, so the ghost padding wins.

## Goals / Non-Goals

**Goals:**

- A ghost row fills the card from edge to edge. The hover color fills the full row.
- The dividers next to the highlighted row grow to the card edges with a transition.
- Hover and focus have the same shape.
- No layout shift, and no change to callers.

**Non-Goals:**

- A change to the `outline` or `card` variants.
- Making the extended area of the row clickable. Callers put the `Link` inside the row content,
  so a click in the extended area does not navigate. This is the same as before this change.

## Decisions

### D1. Extend the row box, not a pseudo-element

The ghost container gets `marginInline: calc(-1 * var(--stacked-items-bleed, spacing[2]))` and no
inline padding. Each ghost row gets `paddingInline: var(--stacked-items-bleed, spacing[2])`. The
row box then reaches the card edges, and the content stays at the same position. The hover
background stays on the row box (`&:hover`), so it fills the full row width and height.

Alternative considered: a `::before` with negative inset (the first version of this change). It
cannot fill the full row height without touching the dividers, and it needs a stacking context.
The extended row box is simpler.

### D2. `--stacked-items-bleed` custom property, set by `Card`

The default (`spacing[2]`) applies outside a card. `Card` sets
`'--stacked-items-bleed': theme.spacing[4]` in its base style, the same value as its inline
padding. Use `Card`, not `CardContent`, because `OverviewCard` puts its padding on `Card` and does
not use `CardContent`. CSS inheritance carries the value, so `StackedItems` does not import
anything from `Card`.

Alternative considered: React context from `Card`. Rejected, because it connects two components
for a value that CSS can carry.

### D3. Dividers as pseudo-elements on the row wrapper

Add `data-slot="stacked-item-wrapper"` to the wrapper div. In the ghost variant:

- The wrapper keeps its 1px `borderBottom`, with a `transparent` color, so the row height and the
  space between rows do not change.
- The wrapper `::after` (not the last wrapper) draws the divider over that border:
  `position: absolute`, `bottom: -1px`, `height: 1px`, `left` and `right` equal to the bleed, and
  `transition` on `left` and `right`.
- `left` and `right` go to `0` when the wrapper is hovered or contains a focus-visible link (the
  divider below the row), and when the next wrapper is in that state
  (`&:has(+ :is(...))`, the divider above the row).

Use `left` and `right` instead of `transform: scaleX`. A scale factor depends on the row width,
and `left` and `right` do not.

### D4. Focus ring fills the row

The ghost focus ring (`&:has(a:focus-visible)::after` on the row) changes to `inset: 0` with no
border radius, so it has the same shape as the hover color.

## Risks / Trade-offs

- [The card padding changes later, and the variable does not] → The variable is set next to the
  padding in `card.tsx`. If a caller changes the card padding with `cssOverride`, it must also set
  the variable.
- [A parent with `overflow: hidden` and no padding clips the default 8px] → Same as the focus ring
  before this change.
- [`left` and `right` transitions cause layout of one 1px element] → Small cost. Only the
  absolute pseudo-element changes.
- [The `0.02` alpha hover color is not a theme token] → Keep the current value and the `@todo`.

## Migration Plan

Style change only. No data or API migration. To roll back, revert the commit.

## Correction during implementation

- The first version (`::before` highlight with an 8px inset, the same as the old focus ring) was
  implemented, and the user did not accept it. The user wants Shopify's behaviour: the full row to
  the card edges, the full row height, and dividers that grow with a transition. D1–D4 above
  replace the first version. The user chose a CSS custom property for the size, growth of the
  dividers above and below the row, and a focus ring with the same shape as the hover.
- The first plan said `CardContent` sets the variable. The ghost callers use `OverviewCard`, which
  puts its padding on `Card` and does not use `CardContent`, so `Card` sets it.
