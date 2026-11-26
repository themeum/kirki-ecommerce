## ADDED Requirements

### Requirement: The cart pricing lists the code coupons separately

The cart `pricing` block SHALL expose, next to the full `coupons` list, an `applied_coupons` list. It SHALL hold every coupon whose method is not `automatic`, at any target. Each entry SHALL have the same shape as an entry of `coupons`. The list SHALL be empty when no coupon matches.

#### Scenario: A code coupon

- **WHEN** the cart has a code coupon, at any target
- **THEN** the coupon is in `coupons` and `applied_coupons`

#### Scenario: An automatic coupon

- **WHEN** the cart has an automatic coupon, at any target
- **THEN** the coupon is in `coupons` and not in `applied_coupons`

#### Scenario: A cart with no coupon

- **WHEN** the cart has no coupon
- **THEN** `coupons` and `applied_coupons` are empty lists

### Requirement: The cart pricing lists the order-targeted coupons separately

The cart `pricing` block SHALL expose an `order_targeted_coupons` list. It SHALL hold every coupon whose target is the whole order, at any method. A coupon that targets specific products SHALL NOT be in the list. Each entry SHALL have the same shape as an entry of `coupons`. The list SHALL be empty when no coupon matches.

#### Scenario: A code coupon that targets the order

- **WHEN** the cart has a code coupon that targets the whole order
- **THEN** the coupon is in `coupons`, `applied_coupons` and `order_targeted_coupons`

#### Scenario: An automatic coupon that targets the order

- **WHEN** the cart has an automatic coupon that targets the whole order
- **THEN** the coupon is in `coupons` and `order_targeted_coupons`, and not in `applied_coupons`

#### Scenario: A coupon that targets products

- **WHEN** the cart has a coupon that targets specific products
- **THEN** the coupon is in `coupons`, is in `applied_coupons` only if it is a code coupon, and is not in `order_targeted_coupons`
