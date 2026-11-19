## Why

In the `ghost` variant of the stacked items primitive, the hover background stops at the content
edge of the row. The left media and the right text touch the edge of the hover color, so the row
looks cramped (see the home dashboard "Restock soon" card). Shopify extends the hovered row to the
full width of the card: the hover color fills the full row from card edge to card edge, the
content stays aligned with the card header, and the dividers above and below the hovered row grow
to the card edges with a transition.

## What Changes

- In the `ghost` variant, each row extends past the content to the edges of the surrounding card.
  The row content stays at the same position.
- The hover color fills the full row: full width (card edge to card edge) and full height.
- On hover, the dividers above and below the row grow from content width to the card edges with
  a transition. They go back to content width when the hover stops.
- The keyboard focus outline of a ghost row has the same shape as the hover color: full width and
  full height. The dividers grow on keyboard focus too.
- The extension size comes from a CSS custom property, `--stacked-items-bleed`. Its default is
  `theme.spacing[2]` (8px). `Card` sets it to its own inline padding (`theme.spacing[4]`), so a
  ghost stack in a card reaches the card edges. Callers do not change.
- The `outline` and `card` variants do not change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `stacked-items`: add requirements for the hover and focus highlight of a `ghost` row (full row,
  to the card edges, no layout shift) and for the dividers that grow on hover and focus.

## Impact

- Code: `resources/app/components/ui/stacked-items.tsx` (ghost styles, a `data-slot` on the row
  wrapper) and `resources/app/components/ui/card.tsx` (one CSS custom property on the card).
- Visual effect on all `ghost` callers. All of them are in home dashboard cards that use
  `OverviewCard`: `needs-attention-card.tsx`, `restock-soon-card.tsx`, `top-products-card.tsx`,
  `recent-orders-card.tsx`.
- No API, prop, or data change.
- Backward compatibility: `stacked-items.tsx` and `card.tsx` are on `origin/main`, but the `ghost`
  variant is not. The new custom property has no effect outside a ghost stack. No released public
  surface changes.
