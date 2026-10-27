## Why

The backend can already edit an unpaid order (`order-editing`), but the admin has no screen for it. The Edit button on the order detail page is a `@todo`. The calculation response now carries `is_reachable` and the stock and limit fields, and the order payload carries `is_editable`, so the frontend can apply the same rules the server enforces.

## What Changes

- Add an `OrderEdit` route (`/orders/:id/edit`) that renders the same `OrderCreate` page as create. The page reads `:id` to choose create or edit.
- In edit, load the order detail and fill the form from it: items, customer, addresses, shipping method, coupons, notes.
- Send existing lines with their `id` and new lines with `variant_id` only. Send `order_id` in the calculation request. Save with `PUT` on the order.
- Block edit when `order.is_editable` is false. Hide the Edit button on the detail page for such orders, and show a blocked state on the edit route.
- Build item rows in edit from the order's own lines, not from the product picker.
- Lock a line whose `is_reachable` is false: only remove works.
- Apply `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order` and `max_per_order` from the calculation item to the quantity stepper. For an existing line the stored quantity is a floor on the ceiling, so an unchanged line always saves and lowering is always allowed.
- Match calculation items to form items by `id` in edit, not by array index.
- Enable the Edit button on the order detail page and link it to the edit route.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-editing`: add frontend requirements for the edit entry points and the edit gate, form prefill and line identity, the locked unreachable line, and the quantity ceiling from stock and limits.

## Impact

- `resources/app/features/orders/`: `routes.tsx`, `pages/order-create.tsx`, `pages/order-details.tsx`, `contexts/order-create-context.tsx`, `schemas/forms/order-form.ts`, `lib/order-items.ts`, `types.ts`, and the `order-create` row, card and stepper components.
- `resources/app/config/route-config.ts` and `schemas/catalog/order.ts` already have uncommitted edits for this change.
- No backend change. The calculation and update requests already accept `order_id` and `items.*.id`.
- Tests: payload test for the order form schema, and unit tests for the quantity ceiling helper.
- Docs: update `docs/order-editing.md`.
