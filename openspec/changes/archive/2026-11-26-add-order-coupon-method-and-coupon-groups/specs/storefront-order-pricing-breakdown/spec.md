## ADDED Requirements

### Requirement: The storefront order pricing exposes the code coupons and the order-targeted coupons as separate lists

The storefront order `pricing` block SHALL expose, next to the full `coupons` list, an `applied_coupons` list and an `order_targeted_coupons` list, with the same rules as the cart `pricing` block (see `cart-pricing-breakdown`). Each coupon entry SHALL expose its `method`. The lists SHALL be built from the method recorded on the order coupon. An order with no coupon, or with order coupons from before the method was recorded, SHALL produce valid lists (empty, or with those coupons read as `code`).

#### Scenario: An order with a code coupon and an automatic coupon, both order-wide

- **WHEN** a customer views an order with one code coupon and one automatic coupon, both targeting the whole order
- **THEN** `applied_coupons` has the code coupon only and `order_targeted_coupons` has both

#### Scenario: A pre-existing order coupon

- **WHEN** a customer views an order whose order coupon has no recorded method
- **THEN** the coupon shows the method `code` and is in `applied_coupons`

#### Scenario: An order with no coupon

- **WHEN** a customer views an order with no coupon
- **THEN** both lists are empty
