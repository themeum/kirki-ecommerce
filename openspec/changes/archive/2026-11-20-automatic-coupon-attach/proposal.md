# Proposal

## Why

The `coupons.method` column already allows the value `automatic`, but nothing reads it. A merchant can create an automatic coupon, and no cart ever gets it. Merchants also have no way to say that a coupon must not stack with other coupons.

## What Changes

- The backend generates the code of an `automatic` coupon when none is sent, so every automatic coupon has a code. An update that sends no code keeps the stored code.
- Storefront carts get valid `automatic` coupons attached on their own. The attach step runs during cart calculation, and it uses the same validation as a coupon code that a shopper types.
- A shopper cannot remove an `automatic` coupon from the cart. The remove-coupon request is rejected for it.
- An attached `automatic` coupon is checked again on each cart calculation, up to order creation. A coupon that is no longer valid is detached without an error.
- A manual (admin-created) order does not get automatic coupons. The admin picks coupons by hand, as today.
- On order edit, an admin can remove an `automatic` coupon. Order edit never attaches automatic coupons again.
- New column `coupons.is_combinable` (default `true`) for all coupons, code and automatic. A coupon with `is_combinable = false` cannot be applied together with another coupon. When two coupons conflict, the coupon that is already applied stays and the new coupon is rejected.
- Coupon create and update requests, DTOs and resources carry the new field. Backend only: the admin and storefront frontend changes are out of scope and go in a later spec.
- The existing `coupons.combinations` column is not changed and not used.

No change to the cart response shape other than the new `method` and `is_combinable` values on coupons. No change to existing coupons: they keep stacking, because the default is `true`.

## Capabilities

### New Capabilities
- `automatic-coupon-application`: when automatic coupons attach to a cart, why a shopper cannot remove them, when they are detached, and where they do not apply (manual order, order edit).
- `coupon-combinability`: the `is_combinable` flag and the rule that decides if a coupon can be applied with the coupons already applied.

### Modified Capabilities
- `cart-coupon-stacking`: applying a coupon can now be rejected because of `is_combinable`; removing a coupon is not allowed for an automatic coupon.

## Impact

- Migration: new alter migration `AddIsCombinableToCouponsTable` (target 1.0.1), registered last in `config/migrations.php`. `CreateCouponsTable` is released and is not edited.
- PHP: `Coupon` model (`$fillable`, `$casts`), `CreateCouponDTO` and `UpdateCouponDTO`, coupon create and update requests, `CouponResource` and `CouponListResource`, `RecalculateCartAction` (attach and detach), `RemoveCouponAction` (block), `DiscountService::validate_against_other_applied_coupons()` (combinability rule), `CouponService` (find automatic coupons, generate the code on create and update), `CartService`, and the seeded automatic coupon (gets a code).
- Docs: a coupons doc update for automatic coupons and combinability, with a "Where this differs from WooCommerce" section.
- Backward compatibility: additive. The new column defaults to the old behavior. Existing REST responses only gain fields. The change to the database schema is approved by the user.
