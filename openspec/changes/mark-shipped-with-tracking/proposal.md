## Why

Tracking is added in a second step, after the order is already shipped. The merchant picks
**Mark as shipped** in the Take an Action card, saves, and then has to find the separate
**Add tracking No.** link in the Items card header to open a second dialog. Most merchants
ship and add tracking in the same moment, so the split doubles the work and leaves orders
shipped without tracking by accident. The tracking itself is also hard to find later: the
order only says "Edit tracking No."; it never shows the carrier or the number.

The approved design (Kirki eCommerce prototype, Orders › order details, settled
2026-11-18) makes shipping one step with optional tracking, and shows the tracking where
the order's status is.

## What Changes

- **Mark as shipped** in the Take an Action card opens a **Mark as shipped** dialog instead
  of shipping right away. The dialog marks the order as shipped and can add tracking in the
  same step. Tracking stays optional.
- The tracking fields in that dialog start closed as an **+ Add tracking details · Optional**
  slot, unless the merchant added tracking the last time they shipped (then they start
  open, with the last carrier picked).
- In the carrier select, the carrier the merchant used last for this shipping zone shows a
  **Last used** badge and is preselected.
- A shipped order shows its tracking inside the Take an Action card, under the status line:
  carrier logo, carrier name, tracking number, and one **⋯** menu with Copy tracking number,
  Edit tracking, and Track on <carrier> site.
- A shipped order without tracking shows **No tracking added** with an **Add tracking**
  button in the same place.
- The **Add tracking No.** / **Edit tracking No.** link in the Items card header is removed;
  the Take an Action card is the one place to add, see, and edit tracking.
- The Add tracking / Edit tracking dialog keeps its fields and rules
  (`order-tracking-carriers`). Its width is reduced to fit a short form.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-tracking-carriers`: tracking can be added while marking an order as shipped, the
  stored tracking is shown in the Take an Action card, and the last-used carrier is
  remembered per zone.

## Impact

- Frontend, in `resources/app/features/orders/`:
  - Changed: `components/order-details/take-action-card.tsx`, `pages/order-details.tsx`,
    `components/order-details/add-tracking-dialog.tsx`.
  - New: a Mark as shipped dialog (or a `mode` on the existing tracking dialog; see
    design.md, Open questions) and a tracking summary inside the Take an Action card.
- Backend: see design.md, Open questions — Q1 decides whether shipping with tracking is one
  request or two, and Q2 decides which customer email is sent.
- No change to the carrier settings, to the tracking URL rules, or to stored tracking.
