# order-base-currency-amounts Specification

## Purpose

Makes every base-currency amount of an order payload use the base currency the order was placed in, so a later change of the store's base currency does not relabel the amounts of old orders.

## Requirements

### Requirement: Order detail base amounts use the order's own base currency
Every `base_*` money object in the admin order detail payload SHALL carry the order's stored base currency, not the store's current base currency. This covers the totals, the items, the item and order coupon discounts, the coupon's fixed amount, and the tax lines. The amounts themselves SHALL NOT change.

#### Scenario: Base currency changed after the order was placed
- **WHEN** an order was placed with base currency `USD`, the store's base currency is now `GBP`, and an admin opens the order
- **THEN** every `base_*` money object in the payload has currency `USD` and the same raw amount as before the change

#### Scenario: Order with coupons and tax
- **WHEN** the order has an order coupon, a product coupon and tax lines
- **THEN** their base-currency money objects also carry `USD`

#### Scenario: Base currency not changed
- **WHEN** the store's base currency is still the order's base currency
- **THEN** the payload is the same as before this change

### Requirement: Order list rows state the total in the order's own base currency
Each row of the admin order list and of the storefront order list SHALL give `base_total` and its money object in the order's stored base currency.

#### Scenario: Admin order list after a base currency change
- **WHEN** an order was placed with base currency `USD`, the store's base currency is now `GBP`, and an admin lists orders
- **THEN** the row's `base_total_money_object` has currency `USD`

#### Scenario: Storefront order list after a base currency change
- **WHEN** a customer lists their orders after the store's base currency changed
- **THEN** each row's `base_total` and `base_total_money_object` use that order's own base currency
