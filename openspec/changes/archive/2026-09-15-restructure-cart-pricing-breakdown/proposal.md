## Why

The checkout page's redesigned order summary needs a pricing breakdown the
current Cart/Order-calculation API can't cleanly provide: a per-item
subtotal that reflects only that item's own coupon, an order-wide coupon
shown as its own line (not blended into per-item discounts), a shipping
amount separate from shipping tax, and one merged tax-lines list that can
show multiple simultaneous rates (e.g. EU VAT at 5% and 10% in the same
cart) without collapsing them into one misleading row.

## What Changes

- Root `pricing` gains `display_items_subtotal_money_object` (sum of each
  item's own post-product-coupon subtotal), `display_order_discount_money_object`
  (order-wide coupon only, excluding product-scoped coupons and shipping
  discount), and `display_order_total_money_object` (items subtotal minus
  order discount, before shipping and tax).
- Root `pricing` gains `display_shipping_amount_money_object` (shipping
  subtotal minus shipping discount, tax-free) and drops the dedicated
  `display_shipping_tax_money_object` field. **BREAKING**
- Root `pricing` exposes a single merged `tax_lines` array combining item
  tax lines and shipping tax lines, grouped by name + rate so two lines
  sharing a name but not a rate stay distinct. Replaces the separate
  `tax_lines` / `shipping_tax_lines` root fields. **BREAKING**
- Per-item pricing: the field holding the actual charged subtotal (net of
  that item's own product coupon) is renamed from `display_line_price_money_object`
  to `display_subtotal_money_object`. The old pre-coupon
  `display_subtotal_money_object` (sale-or-regular total before any coupon)
  is renamed to `display_pre_discount_subtotal_money_object`, kept only as
  the strikethrough-price source. **BREAKING**
- `DefaultTaxStrategy`'s shipping tax line is renamed from `'Tax'` to
  `'Shipping Tax'` so, once merged into the root `tax_lines` list, it reads
  as its own distinguishable row rather than merging with item-level
  `'Tax'` lines. `EUTaxStrategy` is unchanged — its shipping tax already
  shares the `'VAT'` name with item tax by design, so it correctly merges
  with matching-rate item lines instead of standing apart.
- Scoped to `CartResource` only. `OrderCalculationResource` (the order-edit
  recalculation preview) currently duplicates `CartResource`'s formatting
  logic line for line and will get the same restructuring in a follow-up
  change — left untouched here.

## Capabilities

### New Capabilities
- `cart-pricing-breakdown`: the shape and computation rules for the
  cart/order-calculation pricing breakdown — per-item subtotal vs.
  strikethrough vs. discount, the root-level items subtotal / order
  discount / order total split, the shipping amount vs. shipping tax
  split, and the merged tax-lines breakdown.

### Modified Capabilities
(none — `tax-calculation-strategy` and `order-tax-lines` govern line
count/composition and persistence, not display naming; this change only
touches the API-facing Resource layer and one strategy's line label)

## Impact

- `app/Resources/Cart/CartResource.php` — pricing block restructured.
- `app/Tax/Strategies/DefaultTaxStrategy.php` — shipping tax line name
  changed from `'Tax'` to `'Shipping Tax'`.
- `app/Resources/Order/OrderCalculationResource.php` — deliberately NOT
  changed in this change; still has the pre-restructuring shape and the
  duplicated formatting code. Follow-up change to mirror this.
- Any frontend consumer of the Cart or Order-calculation API response
  (checkout summary, cart drawer) will need to move to the new/renamed
  fields — out of scope for this change's tasks unless flagged during
  implementation.
