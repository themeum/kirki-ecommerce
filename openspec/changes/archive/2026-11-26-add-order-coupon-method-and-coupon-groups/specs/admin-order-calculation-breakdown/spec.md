## ADDED Requirements

### Requirement: The calculation payload exposes the code coupons and the order-targeted coupons as separate lists

The calculation payload SHALL expose, at the root next to the full `coupons` list, an `applied_coupons` list and an `order_targeted_coupons` list, with the same rules as the cart `pricing` block (see `cart-pricing-breakdown`). Each coupon entry SHALL expose its `method`. When the calculation previews an edit, a coupon that is on the stored order SHALL use its stored method, and any other coupon SHALL use its live method.

#### Scenario: A calculation with a code coupon that targets the order

- **WHEN** a manual order calculation has a code coupon that targets the whole order
- **THEN** the coupon is in `coupons`, `applied_coupons` and `order_targeted_coupons`

#### Scenario: A calculation with an item-scoped code coupon

- **WHEN** a manual order calculation has a code coupon that targets specific products
- **THEN** the coupon is in `coupons` and `applied_coupons`, and not in `order_targeted_coupons`

#### Scenario: An edit preview with a stored automatic coupon

- **WHEN** an edit preview includes an automatic coupon that is on the stored order and targets the whole order
- **THEN** the coupon is in `order_targeted_coupons` and not in `applied_coupons`
