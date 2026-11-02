## Why

Merchants cannot control the order in which payment methods appear. The order is the
registration order (offline methods first, then PayPal), and checkout shows the same order.
The admin list also hides its actions behind a three-dots menu and uses separate cards, which
does not match the new settings design built on the `StackedItems` primitive.

## What Changes

- Add a persisted, merchant-defined order for payment methods:
  - New endpoint `PUT /payment-methods/order` with body `{ "ids": string[] }`. Each ID must be a
    registered provider ID.
  - The order is stored as `methods_order` (a list of provider IDs) in the `payment` settings
    option.
  - The provider registry is sorted by the stored order. Providers that are not in the list (new
    offline methods, newly installed gateways, providers from the
    `kirki_ecommerce_payment_providers` hook) go to the end in registration order. Stored IDs that
    match no provider are ignored.
  - `GET /payment-methods` and the checkout payment list both follow this order.
- Rebuild the admin **Payment methods** list on `StackedItems`:
  - Rows have no dividers. The hovered row gets a top and bottom border and the alternate surface
    background. This style is local to the payment list; other `StackedItems` consumers do not
    change.
  - On hover, keyboard focus, and always on touch screens, a grip handle replaces the method icon,
    and delete, edit and enable/disable controls show at the right.
  - **BREAKING (UI only)**: the three-dots dropdown is removed. Edit and delete become icon buttons.
  - The delete button does not show for PayPal. Offline methods keep the current confirm-delete
    flow.
- Drag-to-reorder with `@dnd-kit`:
  - Only the grip handle starts a drag, by pointer or keyboard. Movement is locked to the vertical
    axis.
  - A `DragOverlay` with rounded corners shows the dragged row. The original row stays in place at
    low opacity as the drop placeholder.
  - Each drop saves the new order at once with an optimistic update. On error, the list rolls back
    and an error toast shows.
- Add `docs/payments.md` for the payment methods feature, including the reorder behaviour.

## Capabilities

### New Capabilities

- `payment-method-order`: how the merchant-defined order of payment providers is stored, written
  through the API, and applied to the admin list and checkout.
- `payment-methods-list`: the admin Payment methods list — row layout, hover-revealed actions,
  per-provider delete visibility, and drag-to-reorder interaction.

### Modified Capabilities

- `payment-providers`: the combined `/payment-methods` surface is no longer listing-only. It also
  accepts an order write at `/payment-methods/order`, and its listing returns providers in the
  stored order.

## Impact

- **Backend**: `routes/api.php`, `PaymentMethodController`, `PaymentMethodService`,
  `PaymentManager` (registry sort), a new request class under `app/Http/Requests/`, payment
  settings rules/defaults for `methods_order`, `tests/Integration/PaymentMethodApiTest.php`,
  `tests/Integration/CheckoutPaymentProviderTest.php`, and the Bruno API docs under
  `docs/ecommerce/payment-methods/`.
- **Frontend**: `features/settings/payment/components/list/payment-methods.tsx` (rewrite), new
  sortable row component in the payment feature, `services/payment.ts` (reorder mutation),
  `config/endpoints.ts`, tests under `features/settings/payment/tests/`.
- **Dependencies**: none new. `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers` and
  `@dnd-kit/utilities` are already installed.
- **Not changed**: `components/ui/stacked-items.tsx` and its spec.
