## Why

"First time buyer only" coupons currently reject every guest with "Please login to use this coupon.", because the check can only count orders for a customer record. The admin form even hides the option unless the coupon targets registered customers. Guests always give an email at checkout, and orders already store it (`orders.customer_email`, indexed), so the store can tell whether a guest has ordered before.

The current check also has these problems:
- **Three different definitions of "prior orders".** The cart and the admin calculation endpoint count by `order_status`, while order creation counts by `fulfillment_status`. A coupon can pass on the cart and fail at checkout.
- **Admin orders check the wrong person.** The login guard reads `user()`, the signed-in admin, instead of the customer the order is for.
- **The per-customer usage limit has the same problems.** It rejects every guest with "Please login", has the same `user()` guard, and counts the edited order's own usage, so editing an order whose coupon has a limit of 1 drops the coupon.
- **Extra query on every cart render.** Every cart render for a signed-in shopper runs a count query, even when no first-time-buyer coupon is applied.

## What Changes

- The cart gets a `customer_email` (new nullable column, accepted by the cart update endpoint, returned by the cart resource). The storefront checkout syncs the guest contact email into it, so a guest can apply a first-time-buyer coupon before placing the order.
- The first-time-buyer check identifies the buyer by **customer ID or email**, for guests and registered customers alike:
  - A guest is checked by the email they entered.
  - A registered customer is checked by their customer ID and by their account email. This catches orders they placed as a guest before signing up.
  - Emails are compared case-insensitively.
- If there is neither a customer nor an email yet, the coupon is rejected with "Please enter your email address to use this coupon." instead of "Please login to use this coupon.".
- The **per-customer usage limit** ("limit uses per customer") uses the same buyer identity. A guest's earlier uses of the coupon are counted by email. A registered customer's are counted by customer ID or account email. Without either, the coupon is rejected with the same email message. Editing an order doesn't count that order's own use of the coupon.
- "Prior orders" is defined once (orders not failed-cancelled and not refunded) in a single `OrderService` method. The cart, admin calculation, order create and order edit flows all use it. The count runs only when a first-time-buyer coupon is being validated.
- Admin-created and admin-edited orders check the selected customer or the entered `customer_email`, never the signed-in admin. Editing an order does not count that order against itself.
- The admin coupon form shows "First time buyer only" for every eligibility option, not just registered customers.
- **BREAKING (internal):** `CalculationContextDTO::$customer_order_count` is removed. Its three callers stop computing it. No public API exposes it.

## Capabilities

### New Capabilities
- `cart-customer-email`: the cart stores the shopper's contact email, accepts it on update, returns it, and the storefront checkout keeps it in sync with the guest contact field.

### Modified Capabilities
- `coupon-customer-eligibility`: adds the first-time-buyer rule and the per-customer usage-limit rule. Both identify guests by email and registered customers by ID or email, and both apply on the cart, at checkout, and for admin-created and admin-edited orders.

## Impact

- **Database:** a new alter migration adds `customer_email` to `kirki_ecommerce_carts` and is registered in `config/migrations.php`.
- **PHP:**
  - `Cart` model, `CartUpdateRequest`, `CartResource`
  - `CalculationContextDTO`
  - `DiscountService` (gains an `OrderService` constructor dependency)
  - `CustomerService` (new buyer-email resolver used by every context builder)
  - `OrderService` (new prior-order and coupon-usage count methods)
  - The context builders in `OrderCalculationController`, `CreateOrderAction` and `UpdateOrderAction`
  - `DiscountServiceTest`
- **Storefront** (`resources/site/ts`): checkout sends the contact email on cart update, pre-fills it from the cart, and syncs it before applying a coupon.
- **Admin SPA** (`resources/app`): the coupon targeting tab shows "First time buyer only" for every eligibility option.
- **API docs:** `docs/ecommerce/carts/update-cart.yml` and `get-cart.yml` gain `customer_email`.
