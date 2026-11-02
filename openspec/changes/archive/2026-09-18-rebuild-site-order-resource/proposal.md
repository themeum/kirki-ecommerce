## Why

The storefront order-details `OrderResource` (`app/Resources/Site/Order/OrderResource.php`) extends the admin `OrderResource` and inherits its single-coupon-shaped output, even though orders have supported multiple item-level and order-level coupons for a while (`order-coupon-attribution`). It also has no pricing-breakdown structure at all — the checkout summary (`CartResource`) and the post-purchase order-details summary should read as the same UI, but today they expose completely different shapes. Separately, shipping tax is being computed as if it could be tax-inclusive-priced, which it never is — only product prices are ever quoted tax-inclusive — so a store with tax-inclusive pricing on silently undercharges or misreports shipping tax.

## What Changes

- **BREAKING**: Rewrite `app/Resources/Site/Order/OrderResource.php` as an independent class (no longer extends `app/Resources/Order/OrderResource.php`), with its own `to_array()` built from persisted order data.
- Drop every `base_*` field from the storefront order payload — the storefront only ever shows `invoiced_*` amounts (an order's invoiced currency *is* its display currency; there is no display-currency conversion step like Cart has).
- Restructure the payload into a `pricing` breakdown block shaped like `CartResource`'s (`invoiced_items_subtotal`, `invoiced_order_discount`, `invoiced_order_total`, `invoiced_tax_total`, `coupons[]`, `invoiced_shipping_amount`, `invoiced_total`, merged `tax_lines[]`), built from persisted `order_coupons` / `order_item_coupons` / `order_taxes` rows instead of a live recalculation.
- Support multiple coupons at both item and order scope in the output (one entry per `order_coupons` row, per-item `applied_product_coupons` sourced from that item's `order_item_coupons`), replacing the old single-coupon assumption inherited from the admin resource.
- Each item's own `invoiced_subtotal`/strikethrough price is net of only its product-scoped coupon share (order-scoped coupons stay a root-level `invoiced_order_discount`, mirroring Cart's item/order split).
- Keep the storefront-only extras currently added by the subclass (`shipping_country`, `billing_country`, `formatted_status`, `payment_next_step`, `item_product_data`, `customer`) — folded directly into the new class.
- Fix shipping tax to always be computed tax-exclusive (added on top of the shipping fee), regardless of the store's tax-inclusive-price setting for products:
  - `app/Tax/Strategies/AbstractTaxStrategy.php`: add an exclusive-only tax amount calculation for shipping, distinct from `calculate_tax_amount()` (which stays inclusive-aware for products).
  - `app/Tax/Strategies/DefaultTaxStrategy.php` and `app/Tax/Strategies/EUTaxStrategy.php`: use it for every shipping tax line.
  - `app/Actions/Cart/RecalculateCartAction.php`: `build_shipping_result()` must always add shipping tax on top of the shipping total; stop reusing the product `$is_inclusive_tax` flag for shipping.
- No changes to `app/Resources/Order/OrderResource.php` (admin) or its consumers.

## Capabilities

### New Capabilities
- `storefront-order-pricing-breakdown`: the storefront order-details resource's independent pricing/coupon/item breakdown, shaped to match the cart's checkout breakdown but built from persisted invoiced order data.

### Modified Capabilities
- `tax-calculation-strategy`: shipping tax is no longer computed as inclusive-aware; it is always additive on top of the shipping fee, independent of the store's tax-inclusive-price setting for products.

## Impact

- `app/Resources/Site/Order/OrderResource.php` — full rewrite.
- `app/Tax/Strategies/AbstractTaxStrategy.php`, `DefaultTaxStrategy.php`, `EUTaxStrategy.php` — new/changed shipping-tax calculation path.
- `app/Actions/Cart/RecalculateCartAction.php` — `build_shipping_result()` no longer takes/uses `$is_inclusive_tax` for the add-tax-on-top decision.
- Any storefront frontend/template consuming the current site order-details payload shape needs its field references updated (this is the noted **BREAKING** change) — out of scope here since it lives outside `app/`, but flagged for follow-up.
- Order creation/edit totals (`CreateOrderAction`, `UpdateOrderAction`) are unaffected in structure, but a store with tax-inclusive pricing and taxable shipping will now see a (correct) small increase in shipping tax collected and in the order/cart total, since shipping tax was previously being silently absorbed instead of added.
