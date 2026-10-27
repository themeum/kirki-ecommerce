## Context

`InventoryHealthCard` shows 3 counts, each as a bold number with a
`StatusBadge`, then up to 4 variants with the lowest stock as rows with the
quantity on the right, then a plain subdued note. `build_inventory_health()`
keeps the 4 tracked variants with the lowest `available_quantity`, whatever
their status. The status of each variant comes from
`resolve_variant_status()`. The status threshold is per variant, so a variant
with a lower quantity can be in stock while one with a higher quantity is low
stock.

## Goals / Non-Goals

**Goals:**

- Match the shared design: count tiles, a bordered list with status badges,
  and a live indicator with a ripple.
- List only variants that need attention.

**Non-Goals:**

- No change to how a status is calculated or to the 3 counts.
- No change to the API shape. `available_quantity` and `status` stay in each
  item.
- Untracked out-of-stock variants stay out of the list, as today. They have no
  quantity to sort by.

## Decisions

- **Filter on the backend.** In `build_inventory_health()`, add a variant to
  `$tracked` only when its status is `out_of_stock` or `low_stock`. A filter in
  the frontend could show fewer than 4 rows while more low-stock variants
  exist, because in-stock variants can take the 4 places.
- **Row badge shows the status.** The row uses `StatusBadge` with the tone
  `critical` or `warning` and the label "Out of stock" or "Low stock". The
  quantity does not show, as in the design.
- **Tiles.** Each tile is a `div` with `theme.colors.analytics.status
  .neutralBackground` (or the nearest neutral surface token), a medium radius
  and padding. The count uses `Text variant="heading4" weight="bold"` with the
  color from the status tone text (`criticalText`, `warningText`), and the
  default color for in stock. The label uses subdued small text. The 3 tiles
  share the width equally with a grid of 3 columns.
- **List box.** A `ul` with a 1px border, a medium radius and
  `overflow: hidden`. Each `li` has padding and a top border, except the first.
- **Live indicator.** A small green dot (`goodText`) with a pseudo-element ring
  that scales from 1 to 2.5 and fades out, every 2s, made with Emotion
  `keyframes`. The dot is `aria-hidden`. Under
  `@media (prefers-reduced-motion: reduce)` the ring does not animate.

## Risks / Trade-offs

- [The row hides the exact quantity] → The status badge tells what to do. The
  product page shows the quantity.
- [A looping animation can distract] → It is small, slow and stops with reduced
  motion.
