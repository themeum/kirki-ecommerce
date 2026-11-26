# Tasks

## 1. `method` column on order coupons

- [x] 1.1 Add the alter migration `AddMethodToOrderCouponsTable` (`method string(50) NOT NULL default 'code'`, comment "Supported values: code, automatic", `Schema::has_column` guard, `down()`, `@since 1.0.3`). Register it last in `config/migrations.php` under "Since v1.0.3". Do not edit `CreateOrderCouponsTable`. Verify with a migration test: the column exists after a run, and an existing row reads `code`.
- [x] 1.2 Add `method` to `OrderCoupon::$fillable` and to `CreateOrderCouponDTO` (default `CouponMethod::CODE`). Verify with a test that an order coupon created without `method` (the WooCommerce import path) is stored as `code`.
- [x] 1.3 In `PersistsOrderCoupons`, set `method` from the coupon in `prepare_new_order_coupon_dto()` and copy the stored value in `prepare_kept_order_coupon_dto()`. Verify with checkout and order edit tests for the scenarios in the `order-coupon-attribution` delta: code coupon, automatic coupon, and a kept coupon whose live method changed.
- [x] 1.4 In `DiscountService::make_stored_coupon()`, copy `$stored->method`. Verify with an edit preview test: a stored automatic coupon keeps `automatic`.
- [x] 1.5 Verify the group: run the PHPUnit coupon, order and migration tests and `composer phpcs:wporg`.

## 2. Coupon lists in the payloads

- [x] 2.1 In `ResolvesLineItemPricing`, add the helper that builds `applied_coupons` (method not `automatic`) and `order_targeted_coupons` (target `order`) from a formatted coupon list. Verify with a unit test for the four method and target combinations and for an empty list.
- [x] 2.2 `CartResource`: add both keys to `pricing`, after `coupons`. Verify with `CartApiTest` for the scenarios in the `cart-pricing-breakdown` delta (use `AutomaticCouponTest` helpers for the automatic coupon).
- [x] 2.3 `Site\Order\OrderResource`: add `method` to each coupon (read `?? CODE`), and add both keys to `pricing`. Verify with an order API test for the `storefront-order-pricing-breakdown` delta, including an order coupon with no recorded method.
- [x] 2.4 `Order\OrderResource`: add `method` to each coupon (read `?? CODE`), and add both keys at the root after `coupons`. Verify with an admin order API test for the `admin-order-pricing-breakdown` delta.
- [x] 2.5 `Order\OrderCalculationResource`: add `method` to each coupon (read `?? CODE`), and add both keys at the root after `coupons`. Verify with a calculation API test for the `admin-order-calculation-breakdown` delta, including the edit preview with a stored automatic coupon.
- [x] 2.6 Verify the group: run the PHPUnit cart, order and calculation tests and `composer phpcs:wporg`. The admin app is not changed, so `npm run typecheck && npm test` (from `resources/app/`) must still pass unchanged.

## 3. Docs and final checks

- [x] 3.1 Update `docs/coupons.md` and `docs/order-data-and-calculations.md`: the `method` column, the two lists, where each key sits in each payload, and that old orders read `code`. Keep the "Where this differs from WooCommerce" section true. Verify that every behavior in the docs has a test from groups 1 and 2.
- [x] 3.2 Write the "Backward compatibility" note for the final answer: released surfaces touched (`order_coupons` table, order, storefront order and calculation REST responses, cart response) and how each stays compatible (added column with default, added response fields only).
- [x] 3.3 Verify the whole change: `openspec validate add-order-coupon-method-and-coupon-groups --strict`, the full PHPUnit suite, `composer phpcs:wporg`, and `npm run typecheck && npm test` from `resources/app/`.
