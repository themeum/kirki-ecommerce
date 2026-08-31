## Why

Carts and orders can only ever hold one coupon today — `carts.discount_details` and `orders.discount_details`/`coupon_code` are single-value columns, and `DiscountService`/`RecalculateCartAction` are hard-wired to one `Coupon`. There's no way to combine a product-specific coupon with a cart-wide coupon, no per-item record of which coupon caused which discount (so refunds and reports can't reconcile which coupon paid for what), and the single JSON snapshot on `orders` makes multi-coupon checkout impossible without a schema change. This introduces a relational, multi-coupon architecture so customers can stack several coupons (item-scoped and cart-wide) on a single cart/order, with exact per-coupon-per-item attribution recorded at checkout.

## What Changes

- Cart gains a `cart_coupons` join table (cart_id + coupon_id) replacing the single `carts.discount_details` JSON column — any number of coupons can be applied to a cart at once, each validated independently against the currently-applied set.
- `DiscountService`/`RecalculateCartAction` are rewritten to compute discounts for N coupons in one pass: item-scoped coupons (`discount_target = products`) apply first (multiple item-scoped coupons on the same item both apply, summed), then cart-wide coupons (`discount_target = order`) apply sequentially against the remaining subtotal, each allocated proportionally across items by subtotal weight. Per-coupon-per-item rounding remainders are assigned deterministically so each coupon's item-level sum reconciles exactly to that coupon's total discount, and the sum across coupons reconciles exactly to the cart/order discount total — no cent is dropped or invented.
- Checkout freezes the cart's applied coupons into two new order-side tables: `order_coupons` (one row per applied coupon, with a snapshot of the coupon's rules and its total discount amount) and `order_item_coupons` (exact attribution of how much of each order item's discount came from which coupon). **BREAKING**: `orders.coupon_code` and `orders.discount_details` are dropped — a project in alpha with no production data to preserve — in favor of the `order_coupons` relation. `order_items.base_discount_amount`/`invoiced_discount_amount` remain as denormalized rollups, now sourced by summing `order_item_coupons` instead of a single coupon's calculation.
- **BREAKING**: `coupon_usage` is dropped as a separate table — it recorded the same fact as `order_coupons` ("coupon X was used on order Y"), just without the discount amount. `order_coupons` takes over its job: a denormalized `customer_id` column preserves the same single-indexed-query customer-usage-limit check `coupon_usage` provided, and order cancellation now decrements usage (marking the row reversed) instead of deleting it — an improvement over today, where cancelling an order destroys its only coupon usage record.
- `ApplyCouponAction`/`RemoveCouponAction`/`CartController` change from "the one coupon" semantics to "one of several applied coupons," so `remove_coupon` now takes a coupon identifier.
- `CartResource`/`OrderResource` replace the singular `discount_details` field with a `coupons` array.
- Combinability/stacking restrictions (whether specific coupons are allowed to combine) are explicitly **out of scope** for this change: any two valid, applicable coupons stack unconditionally. The calculation and validation code is structured so a future combinability check is a single additional validation step, not a rearchitecture — the existing (currently unused) `coupons.combinations` column is left untouched for that future work.
- `automatic`-method coupons and `buy-x-get-y` discount type remain unimplemented stubs, as they are today — this change only makes `code`-method `amount-off`/`free-shipping` coupons stackable. The multi-coupon-resolution pipeline is structured so automatic coupons can later feed the same coupon list that manually-applied codes populate today.

## Capabilities

### New Capabilities
- `cart-coupon-stacking`: applying, validating, and removing multiple coupons on a cart, and computing their combined discount live (item-scoped then cart-wide, with exact rounding reconciliation).
- `order-coupon-attribution`: freezing a cart's applied coupons into immutable per-order and per-order-item discount records at checkout, and recording coupon usage per applied coupon.

### Modified Capabilities
(none — no existing spec in `openspec/specs/` currently describes coupon/discount behavior)

## Impact

- **Database**: new migrations only (no existing migration file edited) — create `cart_coupons`, `order_coupons`, `order_item_coupons`; drop `coupon_usage`; alter `carts` to drop `discount_details`; alter `orders` to drop `coupon_code` and `discount_details`.
- **Backend**: `DiscountService`, `RecalculateCartAction`, `CalculationContextDTO`/`CalculationResultDTO`/`DiscountCalculationResultDTO`, `ApplyCouponAction`, `RemoveCouponAction`, `CartController`, `CreateOrderAction`, `CouponService`, `OrderManager::mark_as_cancel()`, new `CartCoupon`/`OrderCoupon`/`OrderItemCoupon` models and relations on `Cart`/`Order`/`OrderItem`; removal of the `CouponUsage` model.
- **API surface**: `CartResource`, `OrderResource`/`OrderCalculationResource`, cart coupon apply/remove endpoints (remove now needs a coupon identifier).
- **Frontend**: out of scope for this change. Admin order-create/order-details (`resources/app`) and the storefront checkout coupon UI (`resources/site`) currently assume a single applied coupon and will need updating to a list, but that work is not part of this change — see "Frontend Follow-Up" in tasks.md for a guide to hand off separately.
- **No backfill**: existing/historical carts and orders are not migrated into the new tables (alpha stage, no production data).
