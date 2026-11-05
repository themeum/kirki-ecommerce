## Context

See `proposal.md` for the motivation.

- Create flow: `OrderCreateProvider` owns one `useForm` with an `items` field array of `{variant_id, quantity}`. Rows are built by `getOrderRows` from the picker `selections`. Calculation items are matched to form items by array index. The stepper ceiling comes from picker data (`getQuantityLimit`).
- Details flow: `useOrderDetails` fills a form with `pickFormValues` and `toOrderFormAddresses`, and saves with `useUpdateOrderMutation`. The details page uses `CustomerCard mode="view"`.
- Backend: `OrderCalculationRequest` accepts `order_id` and `items.*.id`. `OrderUpdateRequest` accepts `items.*.id`. The calculation item has `id`, `is_reachable` and the stock and limit fields. Both schema changes are already in `schemas/catalog/order.ts`.
- Constraints: Zod v3. `prepareFormSchema` and `.transform()` only on the terminal schema. One payload test per form schema.

## Goals / Non-Goals

**Goals:**
- One page and one provider for create and edit.
- The client applies the same line, stock and limit rules the server enforces, so the admin sees the problem before saving.

**Non-Goals:**
- No backend change.
- No new editing of stored prices, stored coupon terms or the exchange rate.
- No change to how create works.

## Decisions

**1. One provider, a mode from the route.**
`OrderCreate` reads `useParams().id`. With an `id` it is edit mode. The provider takes an optional `orderId`. In edit mode it loads the order with `useOrderQuery`, resets the form once the order arrives, and submits with `useUpdateOrderMutation`. In create mode nothing changes.
Alternative: a separate `OrderEdit` page and provider. Rejected: it copies about 250 lines and the two flows would drift apart.

**2. Gate on `order.is_editable`.**
The client does not recompute the rule from status fields. The server decides it from payment status, cancellation date and fulfillment status, and enforces it with a 422. A client copy of the rule would drift. The Edit action on the details page reads the same field.
Alternative: check `payment_status` and `fulfillment_status` on the client. Rejected for the drift risk.

**3. Line identity: add `id` to the form item.**
`OrderFormShape.items` gets an optional `id`. Both the save transform and the calculation request pass it through. A line from the picker has no `id`. The calculation request also gets `order_id`, which is null in create.

**4. Rows from the order lines in edit.**
`OrderItem.display` is built from the picker. In edit, a mapper in `lib/order-items.ts` builds the same `OrderRowDisplay` shape from an `OrderLineItem` (name, variant name, image, stored unit prices). Lines added with the picker keep using picker data. A `Map` keyed by `variant_id` holds display data for both sources, so `getOrderRows` and the row component stay as they are.
Alternative: a second row component for edit. Rejected: the layout is the same.

**5. Stock ceiling from the calculation item.**
`getQuantityLimit` takes the stock and limit fields from the calculation item of the line, not from the picker, because the preview data is live and the picker data is a snapshot from when the dialog opened. It keeps the rule: stock applies only with `track_inventory` and no `allow_back_order`; the per-order limit is independent; the smaller wins.
For a stored line the ceiling is `max(stored quantity, ceiling)`. This follows the server rule that a quantity which is not an increase is never rejected by stock or limit. The decrease button is never blocked by the ceiling.
`in_stock` is false only when no unit can be sold. It does not set a ceiling by itself. It is used for the reason text when the ceiling is reached with zero available.
Alternative: clamp a stored quantity down to the limit. Rejected: it changes the order silently, and the server keeps the stored quantity.

**6. Reconciliation by line identity.**
The effect that applies server-corrected quantities pairs form items to calculation items by index. In edit it pairs stored lines by `id` and new lines by order among the new lines. The server returns `id` on stored lines and null on new ones.
Alternative: keep index pairing. Rejected: it works only while the server keeps the same order, and removing a stored line in the middle is the case that breaks.

**7. Unreachable line.**
When `is_reachable` is false the row renders the quantity as text and the remove button only. The line's `id` is still sent when it is kept, with its stored quantity, so the server leaves it unchanged.

**8. Blocked and error states.**
A non-editable order shows a blocked state with a link back to the order. A load failure reuses `QueryErrorState` as the details page does. The details page hides the Edit action when `is_editable` is false.

## Risks / Trade-offs

- [Calculation item order differs from form order] → pair by `id` and new-line position, and cover it with a unit test.
- [Preview not yet loaded, so no stock data] → show the stored quantity and use no ceiling until the first preview arrives. The server still checks on save.
- [Prefilled form triggers a preview before the order loads] → do not start previews until the form is filled.
- [Form reset on refetch loses the admin's changes] → reset only on the first load of the order, and after a successful save.
- [Shared provider grows complex] → keep edit-only code in small helpers in `lib/order-items.ts`, not inline.

## Open Questions

- The exact text of the blocked state. It can be settled while building and does not change the tasks.

## Corrections during implementation

- `useFieldArray` uses `id` as its own row key, which hides the line `id`. The provider sets `keyName: 'key'` so the real `id` stays on each item.
- `mergeSelections` dropped every picked item that the picker did not hold, and it removed `id`. A stored line is never in the picker, so it now keeps every line that has an `id`, with its `id`.
- Decision 4 (rows from the order lines) also needed `storedQuantity` on the row display, so the ceiling can use it as a floor.
- The coupon form field holds full coupon list items, but the order stores only its own coupon terms. `toSelectedCoupon` builds a list item from the stored terms, with status `active`. It is for display and for sending the code only.
- The first preview is started by the fill step, because a form reset does not reliably start one. Fill and preview only run for an order where `is_editable` is true.
- `in_stock` is used for the message ("Out of stock") only, as planned. The ceiling itself comes from `available_quantity`.
- Two existing test files had fixtures without the new required `is_editable` and `is_reachable` fields. They were updated.
- Known gap: the customer card in edit still lists *Remove customer*. See `docs/order-editing.md`, section 11.
