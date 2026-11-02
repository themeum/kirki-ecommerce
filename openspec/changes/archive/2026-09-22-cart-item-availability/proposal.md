## Why

A cart line references a variant that was available when added, but the admin can later set its product to `draft`/`trashed` or the variant to not visible. Today nothing in the cart or checkout path checks this: `CartResource` reports the line normally, and `CreateOrderAction` will happily create an order for it as long as stock is sufficient. A shopper can view, and even pay for, a product the store no longer intends to sell.

## What Changes

- Cart responses (`CartResource`) flag each line item with its current availability (product published + variant visible), the same way stock is already flagged today.
- Checkout (`CreateOrderAction`) rejects order creation if any cart line has become unavailable since it was added, mirroring the existing insufficient-stock rejection.
- Unavailable lines are never auto-removed from the cart by the backend — they stay until the shopper (or a cart-clearing action) removes them, consistent with how out-of-stock lines are already handled.
- No change to `AddToCartAction`/`UpdateCartItemAction` — storefront listings already only expose published products, so this only affects lines added before a product became unavailable.

## Capabilities

### New Capabilities
- `cart-item-availability`: defines how a cart line's availability (product status + variant visibility) is surfaced on the cart and enforced at checkout.

### Modified Capabilities
(none — no existing spec currently covers product-status/visibility enforcement in cart or checkout)

## Impact

- `app/Resources/Cart/CartResource.php` — add an availability flag per line item.
- `app/Actions/Order/CreateOrderAction.php` — add an availability check in `prepare_context_items()`, alongside the existing variant-not-found and stock checks.
- No database migration, no frontend contract change beyond a new response field (frontend consumption of the new flag is out of scope for this change).
