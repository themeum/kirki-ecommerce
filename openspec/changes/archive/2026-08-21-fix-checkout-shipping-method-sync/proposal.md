## Why

On the storefront checkout page, when a cart has no `shipping_method` saved yet but shipping methods are available for the shopper's address, the Alpine `checkout()` component defaults `selectedShippingMethod` to the first available method — but only in local component state. It never sends that selection to the server, so the persisted cart and the displayed order summary keep showing $0 shipping even though a method now appears selected in the UI. The mismatch only resolves once some unrelated action (editing an address field, or manually clicking a shipping radio) happens to trigger a cart update. Shoppers who load checkout with a saved address and don't touch anything else see an incomplete/wrong total right up until they click "Place Order" (or place an order with a shipping cost the summary never showed them).

## What Changes

- When `checkout()`'s `init()` defaults `selectedShippingMethod` to the first available shipping method (because the cart has none saved yet), it now also syncs that selection to the server in the same way `setShippingMethod()` does, so `cartData.pricing` reflects shipping cost immediately on page load instead of waiting for an unrelated cart update.
- No change to behavior when the cart already has a `shipping_method` saved, or when there are no available shipping methods.

## Capabilities

### New Capabilities
- `checkout-shipping-selection`: Defines that the checkout page's displayed cart totals must stay consistent with whichever shipping method is selected (including a default auto-selected on load), so the shopper never sees a shipping method marked selected while the summary reflects no shipping cost.

### Modified Capabilities

(none — no existing capability spec covers storefront checkout shipping selection today)

## Impact

- `resources/site/ts/components/checkout.ts` — `init()` method's default shipping-method selection branch.
- No backend changes: `RecalculateCartAction` and `UpdateCartAction` already compute/persist shipping cost correctly once a `shipping_method` is submitted in the update payload; this fix only makes the frontend submit it right away instead of leaving it implicit.
- No API contract changes — reuses the existing cart update endpoint (`cartApi.update`) already used by `updateCart()`/`setShippingMethod()`.
