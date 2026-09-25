## Why

`App\Resources\Order\OrderResource` (the admin/merchant order detail
payload) and `App\Resources\Order\OrderCalculationResource` (the manual
order creation pricing preview) both predate multi-coupon support. They
still expose a single flat discount/tax total per order and a per-coupon
`item_attributions` shape that cannot represent multiple item-scoped and
order-scoped coupons stacking on the same order, and their tax lines are
unaggregated per-row dumps instead of one merged breakdown per rate. The
storefront equivalents (`App\Resources\Site\Order\OrderResource` and
`App\Resources\Cart\CartResource`) were already rebuilt for multi-coupon and
per-item coupon attribution; the admin-side resources need the same
backend rework so the merchant portal can render correct multi-coupon order
detail and manual-order pricing once its frontend is updated to match.

## What Changes

- **BREAKING**: `OrderResource` (admin order detail) payload shape changes:
  - Every money field now returns a `*_money_object` key only — bare scalar
    amount keys (e.g. `invoiced_subtotal`, `base_subtotal`) are removed,
    since the money object already carries the raw value.
  - `totals` is restructured to mirror the storefront's computed breakdown:
    items subtotal net of each item's own product-scoped coupon share,
    order-wide coupon discount and order total kept as their own root
    figures, computed before shipping and tax — but keeping **both**
    `invoiced_*` and `base_*` twins for every figure (the storefront
    payload only carries `invoiced_*`; admin needs the store-currency
    figure too).
  - `coupons` moves from a flat list with nested `item_attributions` to the
    storefront's shape: order-level coupon summaries (with discount-type
    snapshot fields) plus a per-item `applied_product_coupons` list on each
    line item.
  - Line items gain a strikethrough price (`*_strikethrough_price_money_object`)
    and their subtotal becomes net of that item's own product-coupon share.
  - `shipping_tax_lines` and per-item `tax_lines` are replaced by one merged,
    aggregated tax breakdown per tax name+rate (matching the storefront's
    `format_tax_breakdown`), still with both `invoiced_*` and `base_*`
    money objects.
- **BREAKING**: `OrderCalculationResource` (manual order creation pricing
  preview) payload shape changes, brought to parity with `CartResource`'s
  already-updated pattern:
  - Root `pricing` block computes `items_subtotal` net of the order-wide
    coupon discount (not just raw calculation totals), matching Cart's
    `get_items_subtotal` / `get_order_coupon_discount` pattern.
  - `tax_lines` and `shipping_tax_lines` merge into one aggregated
    `pricing.tax_lines` breakdown.
  - Line items drop the raw, non-coupon-adjusted subtotal keys, keeping
    only the coupon-net `*_subtotal_money_object` (both `base_*` and
    `display_*` twins, since this resource can target a currency other
    than the store's base currency).
  - Coupon entries and per-item `applied_product_coupons` gain a
    `*_discount_amount_fixed_money_object` (currently a bare, unconverted
    int with no money object).
  - `available_shipping_methods` drops bare `base_cost`/`display_cost`
    scalars, keeping only their `*_money_object` versions.
  - Naming stays `base_*`/`display_*` (not `invoiced_*` — nothing has been
    invoiced yet at calculation time).
- No frontend changes in this change. The React admin/merchant portal
  consumers of these two resources will be updated in a follow-up change
  once this backend shape ships.

## Capabilities

### New Capabilities

- `admin-order-pricing-breakdown`: Defines the pricing, coupon, and item
  breakdown the admin/merchant order-detail payload exposes for a placed
  order — mirroring the storefront order breakdown's multi-coupon and
  merged-tax-line shape, but carrying both invoiced and base-currency
  amounts.
- `admin-order-calculation-breakdown`: Defines the pricing, coupon, and
  item breakdown the manual order creation calculation preview exposes —
  mirroring the cart pricing breakdown's multi-coupon and merged-tax-line
  shape, with both base and display-currency amounts.

### Modified Capabilities

_(none — `order-coupon-attribution` and `order-tax-lines` govern the
persisted data model, which is unchanged by this proposal; only the API
resource shapes reading that data change)_

## Impact

- `app/Resources/Order/OrderResource.php` — full rewrite of `to_array()`
  and its helpers, following `app/Resources/Site/Order/OrderResource.php`'s
  pattern.
- `app/Resources/Order/OrderCalculationResource.php` — rework to match
  `app/Resources/Cart/CartResource.php`'s current pattern.
- Any admin/merchant REST controller or endpoint returning these two
  resources is unaffected at the routing level, but its response body
  shape changes.
- React admin/merchant portal code consuming these payloads (order detail
  page, manual order creation flow) will break until updated in a
  follow-up change — out of scope here per the user's request.
