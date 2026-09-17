## Why

Code review of `chore/multi-coupon` found bugs that shipped with the multi-coupon-stacking and checkout-display-pricing changes: editing an order desyncs coupon usage accounting, the reconciliation safety net those changes promised doesn't actually cover the failure modes it claims to, and cart/order coupon responses are inconsistent with project money-field conventions. These need fixing before the branch is safe to merge.

## What Changes

- Order edit (`UpdateOrderAction`) now adjusts `coupons.current_usage_count` (increment/decrement) when its coupon sync adds or removes a coupon, matching `CreateOrderAction`.
- `sync_order_coupons()` preserves an existing `order_coupons.usage_reversed_at` across the delete/recreate cycle instead of always resetting it to null, so editing a cancelled/refunded order doesn't resurrect reversed coupon usage as active.
- `Order::with(...)` calls in `OrderService` use the real `order_coupons` relation name instead of the removed `coupons` alias, restoring the intended eager load.
- `assert_order_coupons_reconcile()` / `assert_order_taxes_reconcile()` also check `invoiced_*` sums (not just `base_*`), catching per-currency rounding drift.
- `sync_order_coupons()` asserts each coupon's item-level attribution sum reconciles to that coupon's own total discount, and throws instead of silently skipping when an order item's variant can't be resolved. Attribution lookup keys on order item id, not variant id, so items sharing a variant no longer collapse.
- `CartResource::format_coupon_results()` and `get_applied_product_coupons_for_item()` emit a `display_discount_amount_fixed_money_object` alongside `base_discount_amount_fixed`, matching every other `base_*` field's Resource convention. **BREAKING**: adds a field, does not remove any.
- `docs/ecommerce/carts/{apply-coupon,get-cart,update-cart,remove-coupon}.yml` updated to match the current request/response shape (`coupon_codes`, `coupons`, current money-object keys; `remove-coupon.yml`'s example body includes `code`).
- `openspec/changes/multi-coupon-stacking/design.md`'s Risks section corrected to describe the shipped first-come-first-served `clamp_item_discounts()` behavior instead of the never-built proportional-scaling description.
- Minor cleanup: `OrderCoupon::item_attributions()` renamed to `order_item_coupons()` for naming consistency with `OrderItem::order_item_coupons()`; redundant per-coupon free-shipping lookup removed from `validate_against_other_applied_coupons()` in the batch path (already covered by `calculate()`'s `$has_free_shipping_applied` tracking); `DiscountService`'s exception messages consistently use `__()` (not a mix of `__()`/`esc_html__()`); `OrderResource` eager-loads `items.taxes` and passes preloaded `shipping_taxes` instead of lazy-loading per item.

Out of scope (explicitly not fixed here): the storefront pricing-key mismatch (`cart-summary.php`, `checkout.ts`, `PageInlineScript.php`, `types.ts` vs. the renamed `CartResource` pricing block), the admin `order-details.tsx` reading the removed `discount_details` field, and the `base_*`/`display_*` naming gaps on `CalculationContextDTO`/`TaxCalculationContextDTO`/`TaxableItemDTO`/`CouponDiscountResultDTO` — tracked separately. `CartResource.pricing.tax_lines` (merged) vs. `OrderCalculationResource`'s separate `tax_lines`/`shipping_tax_lines` is left as-is: the two Resources serve different consumers and unifying the shape wasn't asked for and risks breaking one of them for no reported bug. Also deferred for now: reporting why an auto-removed invalid coupon was dropped (`DiscountCalculationResultDTO::$invalid_coupons` keeps discarding the `ValidationException` message, unchanged) and de-duplicating `format_coupon_results`/`get_product_coupon_discount_for_item`/`get_applied_product_coupons_for_item`/`format_tax_breakdown`/`flatten_item_tax_lines`/`prepare_strikethrough_price` into a shared trait — the duplication between `CartResource` and `OrderCalculationResource` stays as-is.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `order-coupon-attribution`: order edit must keep `coupons.current_usage_count` and `usage_reversed_at` accurate across coupon re-sync, and reconciliation must cover invoiced-currency sums and per-coupon item-level attribution, not just base-currency order totals.
- `cart-coupon-stacking`: every `base_*` coupon discount amount in `CartResource` ships with a matching money object.

## Impact

- Backend: `app/Services/OrderService.php`, `app/Concerns/PersistsOrderCoupons.php`, `app/Actions/Order/CreateOrderAction.php`, `app/Actions/Order/UpdateOrderAction.php`, `app/DTO/Order/CreateOrderCouponDTO.php`, `app/Resources/Cart/CartResource.php`, `app/Services/DiscountService.php`, `app/Models/OrderCoupon.php`, `app/Resources/Order/OrderResource.php`, and the `order_coupons.item_attributions`/`order_coupons.order_item_coupons` eager-load call sites in `CreateRefundAction.php`/`UpdateRefundAction.php`/`PerformOrderAction.php`/`DeleteRefundAction.php`.
- API response shape: `CartResource.pricing.coupons[].display_discount_amount_fixed_money_object` added (additive).
- Docs: `docs/ecommerce/carts/*.yml`.
- Tests: `tests/Unit/Resources/CartResourceCouponFormattingTest.php` updated for the new money object; add coverage for order-edit usage-count sync and reconciliation edge cases (missing variant, multi-currency rounding).
