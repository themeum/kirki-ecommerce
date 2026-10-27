## Why

The storefront order payload exposes `invoiced_strikethrough_price_money_object` per item, but it is only ever set when a product-scoped coupon discounted the item. An item bought on sale never shows its regular price struck through, unlike the same item in the cart. The cause is that an order item stores only the charged unit price (`base_price`/`invoiced_price` = sale-or-regular), so once the order is placed the regular price is gone.

## What Changes

- Add `base_regular_price` and `invoiced_regular_price` (unit amounts, integer minor units, default `0`) to `kirki_ecommerce_order_items` through a new alter migration. No backfill.
- Write both columns when an order item is created in `CreateOrderAction` and when a new item is added in `UpdateOrderAction`. Existing items on an order edit copy the stored values forward, the same way `base_price`/`invoiced_price` are copied today.
- Storefront `OrderResource` computes each item's strikethrough price the way the cart does: the sale-adjusted subtotal when a product-scoped coupon reduced the item, otherwise the regular-price line total when the item was bought on sale, otherwise `null`.
- Orders placed before this change (regular price `0`) show no sale strikethrough.

Out of scope: extracting the duplicated `prepare_strikethrough_price` between `CartResource` and `OrderCalculationResource`, the unit-vs-line comparison in the email order summary, and `UpdateOrderAction` recalculating existing items from live variant prices.

## Capabilities

### New Capabilities

- `order-item-regular-price`: an order item records the regular (pre-sale) unit price in base and invoiced currency at the time it is placed, and keeps it stable across order edits.

### Modified Capabilities

- `storefront-order-pricing-breakdown`: adds the per-item strikethrough price requirement, mirroring `cart-pricing-breakdown`, and its degradation for orders that have no recorded regular price.

## Impact

- **Database**: new migration on `kirki_ecommerce_order_items`, registered in `config/migrations.php`.
- **Backend**: `app/Models/OrderItem.php` (`$fillable`), `app/DTO/Order/CreateOrderItemDTO.php`, `app/DTO/Order/UpdateOrderItemDTO.php`, `app/Actions/Order/CreateOrderAction.php`, `app/Actions/Order/UpdateOrderAction.php`, `app/Resources/Site/Order/OrderResource.php`.
- **API**: the storefront order payload's per-item `invoiced_strikethrough_price_money_object` is now also populated for sale items. No fields are added or removed.
- **Tests**: unit tests for the resource next to `OrderResourceCouponFormattingTest`.
