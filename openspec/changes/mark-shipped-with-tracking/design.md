## Context

See proposal.md - Why. All paths are below `resources/app/`.

This change was written by the design team from the settled prototype. The UI decisions
below are final; the implementation choices (component split, request shape) are the
developer's, and the open questions at the end need an engineering answer before tasks
start. Visual reference: the Kirki eCommerce prototype artifact, Orders › any unfulfilled
order › Take an Action › Mark as shipped (v238).

Observed current state:

- `components/order-details/take-action-card.tsx` shows the state line ("Order shipped" +
  hint), a **Take an Action** select, and **Update**. Choosing Mark as shipped and Update
  changes the status at once.
- `pages/order-details.tsx` shows **Add tracking No.** / **Edit tracking No.** in the Items
  card header and opens `components/order-details/add-tracking-dialog.tsx`.
- `add-tracking-dialog.tsx` already lists the zone's carriers with `logo_url` or
  `TruckIcon`, offers Other, previews the URL, and requires a number to save.

## Goals / Non-Goals

**Goals:**

- Shipping and adding tracking is one step, and tracking stays optional.
- The order shows its tracking (carrier, number) where its status is.
- The merchant's usual way of shipping is remembered, so a repeat shipment is: paste the
  number, press Mark as shipped.

**Non-Goals:**

- No change to carrier settings, tracking URL resolution, or the Other carrier rules.
- No change to which order states allow shipping or tracking.
- No bulk "mark as shipped" from the Orders list.

## Decisions

### D1. Mark as shipped opens a dialog

- Title: **Mark as shipped**. No order number in the title: the order page behind it
  already shows it.
- Width: 440px. Body order, top to bottom:
  1. The tracking area (D2).
  2. Checkbox **Email the customer that it shipped**, checked by default. Disabled with a
     short note when the Order Shipped email is switched off in Email settings.
- Footer: **Cancel** (outline) and **Mark as shipped** (primary).
- Space between title and first field: 16px; between fields: 12px.

### D2. Tracking area: a closed slot or the fields, in the same place

- **Closed**: a full-width dashed slot (44px tall, 10px radius) reading
  **+ Add tracking details** with **Optional** in muted text on the right.
- **Open**: a header row **Tracking details** with a circle-minus icon button on the right
  ("Remove tracking details"), then the same Carrier and Tracking number fields as the
  tracking dialog. No background fill. "Optional" is not shown once open.
- Removing clears the fields and returns to the closed slot.
- When open with a carrier preselected, focus goes to Tracking number.

### D3. Remember how the merchant ships

- After **Mark as shipped** succeeds, store whether tracking was added. The next Mark as
  shipped dialog opens with the tracking area **open** if the last shipment had tracking,
  **closed** if it did not.
- Store the carrier used, per shipping zone. Next time, preselect it and show a small grey
  **Last used** badge after its name, in the list and in the select's value. Show the badge
  only when the zone has more than one carrier.
- Storage is a per-user preference (implementation choice: user meta or `localStorage`; a
  wrong guess here only affects which state the dialog opens in).

### D4. Carrier select shows logos

Unchanged from `order-tracking-carriers`, restated for the new dialog: each carrier shows
its `logo_url` at the left, a carrier without a logo and **Other** show `TruckIcon`, and the
selected value shows the same icon. **Other** gets the secondary line "A carrier that isn't
listed".

### D5. Tracking summary in the Take an Action card

Placed under the state line, above **Take an Action**:

- **With tracking**: a grey rounded box (8px padding, 10px radius): carrier logo 28px,
  then carrier name (13px, weight 500) over the tracking number (12px, muted, single line
  with ellipsis and a tooltip with the full number), then a **⋯** icon button. Its menu:
  - Copy tracking number (copy icon) — shown only when there is a number
  - Edit tracking (pencil icon) — opens the tracking dialog
  - divider
  - Track on <carrier> site (external-link icon) — opens the resolved URL in a new tab
- **Shipped, no tracking**: **No tracking added** with an **Add tracking** button.
- **Not shipped**: nothing.

### D6. Remove the Items card tracking link

The **Add tracking No.** / **Edit tracking No.** link in the Items card header is removed.
The card header is just "Items (n)".

## Open questions (engineering)

- **Q1. One request or two?** Shipping with tracking can call the status update and then
  the add-tracking action, or the status update can accept optional tracking. Two calls
  can leave an order shipped without its tracking if the second fails; if two calls are
  kept, the dialog must say so and keep the tracking fields filled for a retry.
- **Q2. Which email?** Today, shipping sends Order Shipped and adding tracking sends
  Tracking added. When both happen in one step, the customer should get **one** email:
  the Order Shipped email with the tracking details in it. Confirm the template can take
  optional tracking, and that Tracking added is not also queued in that case.
- **Q3. Where to store D3's preference?** User meta (follows the merchant across devices)
  or `localStorage` (no backend change).
