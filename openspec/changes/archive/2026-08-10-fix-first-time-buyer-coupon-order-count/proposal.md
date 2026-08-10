## Why

`DiscountService::validate_coupon()`'s `first_time_buyer_only` check has two conditions: the shopper must have a `customer_id` (fixed by `decouple-checkout-customer-provisioning`), and `$context->customer_order_count` must be `0`. `CreateOrderAction::prepare_calculation_context_dto()` never populates `customer_order_count` — it stays at the `CalculationContextDTO` default of `0` for every checkout, regardless of the customer's actual order history. So today, a `first_time_buyer_only` coupon is accepted for any authenticated customer with a resolved `customer_id` during checkout, including repeat customers with dozens of prior orders. This was discovered and deliberately deferred while implementing `decouple-checkout-customer-provisioning` (see that change's archived design.md).

## What Changes

- `CreateOrderAction::prepare_calculation_context_dto()` populates `context->customer_order_count` from the resolved customer's non-cancelled, non-returned order count, matching the same query already used by `CalculationContextDTO::from_cart()` and `OrderCalculationController::get_order_count()`.
- `first_time_buyer_only` coupons no longer incorrectly apply their discount for customers who have placed a prior order, during actual order creation (not just the cart-calculation preview endpoint, which already worked). Note: an ineligible coupon does not fail checkout either way — order creation proceeds without the discount, silently (pre-existing, unrelated behavior of `RecalculateCartAction::get_discount_result()`).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `checkout-customer-provisioning`: the "Customer is resolved before cart calculation" requirement's `first_time_buyer_only` scenario is completed — `customer_order_count` is now populated too, so the coupon's prior-order check is actually enforced, not just its `customer_id`-availability check.

## Impact

- `app/Actions/Order/CreateOrderAction.php` — `prepare_calculation_context_dto()` gains one order-count lookup, gated on `context->customer_id` being truthy (guest checkouts unaffected, since `customer_order_count` stays `0` for them, same as today).
- No API contract or request/response shape changes; no migrations.
- One additional DB query per checkout for authenticated customers (order count by customer_id), same cost the cart-calculation preview endpoint already pays.
- Found and fixed a related bug while writing this change's tests: the two coupon-eligibility tests added by `decouple-checkout-customer-provisioning` only asserted `HTTP 201`, which — given the swallow-and-drop behavior above — passes regardless of whether the coupon was actually applied, so they never actually proved that fix worked. Strengthened in `tests/Integration/OrderApiTest.php` to assert on `totals.base_shipping` instead.
- Found, but left unfixed (separate, out of scope): `DiscountService::calculate()` sets `discount_details` to a raw `Coupon` model object; that value is lost (persists as `null`) when the order is saved and re-read, so `order.totals.discount_details` cannot be used to tell whether a coupon was applied.
