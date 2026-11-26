## ADDED Requirements

### Requirement: The admin order payload exposes the code coupons and the order-targeted coupons as separate lists

The admin order payload SHALL expose, at the root next to the full `coupons` list, an `applied_coupons` list and an `order_targeted_coupons` list, with the same rules as the cart `pricing` block (see `cart-pricing-breakdown`). Each coupon entry SHALL expose its `method`. The lists SHALL be built from the method recorded on the order coupon, and a coupon with no recorded method SHALL read as `code`.

#### Scenario: An order with a code coupon and an automatic coupon, both order-wide

- **WHEN** an admin views an order with one code coupon and one automatic coupon, both targeting the whole order
- **THEN** `applied_coupons` has the code coupon only and `order_targeted_coupons` has both

#### Scenario: An order with an item-scoped automatic coupon

- **WHEN** an admin views an order with an automatic coupon that targets specific products
- **THEN** the coupon is in `coupons` only

#### Scenario: A pre-existing order coupon

- **WHEN** an admin views an order whose order coupon has no recorded method
- **THEN** the coupon shows the method `code` and is in `applied_coupons`
