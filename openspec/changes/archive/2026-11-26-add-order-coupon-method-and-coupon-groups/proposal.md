# Proposal

## Why

The cart, order and calculation payloads list every coupon in one flat `coupons` list. A client cannot tell which coupons the shopper entered and which the store attached, and cannot find the coupons that discount the whole order. The order also does not record how a coupon was redeemed (`code` or `automatic`), so an order payload cannot make this split.

## What Changes

- Add a `method` column to `kirki_ecommerce_order_coupons` with a new migration (default `code`). Orders placed before the migration keep `code`, which is correct because automatic coupons are not released yet.
- Store `method` on every new order coupon, copied from the coupon at checkout and kept on order edit.
- Return `method` on each coupon in the order, storefront order and calculation payloads (the cart already returns it).
- Add two lists next to the existing `coupons` list:
  - `applied_coupons`: coupons with `method` not `automatic` (any target).
  - `order_targeted_coupons`: coupons with `discount_target` `order` (any method). Item-specific (`products`) coupons are not in this list.
- The lists sit in `pricing` for the cart and the storefront order, and at the root next to `coupons` for the admin order and the calculation (these two have no `pricing` block).
- The existing `coupons` list does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `order-coupon-attribution`: an order coupon records the method of the coupon.
- `cart-pricing-breakdown`: the cart `pricing` block adds `applied_coupons` and `order_targeted_coupons`.
- `storefront-order-pricing-breakdown`: the storefront order `pricing` block adds both lists and `method` on each coupon.
- `admin-order-pricing-breakdown`: the admin order payload adds both lists and `method` on each coupon.
- `admin-order-calculation-breakdown`: the calculation payload adds both lists and `method` on each coupon.

## Impact

- Database: one new alter migration on `kirki_ecommerce_order_coupons`, registered under "Since v1.0.3". `CreateOrderCouponsTable` is not edited.
- PHP: `OrderCoupon` model, `CreateOrderCouponDTO`, `PersistsOrderCoupons`, the `ResolvesLineItemPricing` concern, and the four resources (`CartResource`, `Order\OrderResource`, `Order\OrderCalculationResource`, `Site\Order\OrderResource`).
- REST: new response fields only. No field is removed or changed.
- Docs: `docs/coupons.md` and `docs/order-data-and-calculations.md`.
- Out of scope: the admin React app (zod strips unknown keys, so it keeps working).
