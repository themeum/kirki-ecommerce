# Spec Delta

## Purpose

Makes the meaning of every stored money column readable from the database schema alone. A reader should know the currency, the unit and the tax treatment without reading the calculation code.

## ADDED Requirements

### Requirement: Money columns state currency and unit

Every column that stores a monetary amount on the order, order item, order tax, order coupon, order item coupon, variant and coupon tables SHALL carry a comment. The comment SHALL state whether the amount is in the order (invoiced) currency or the store base currency, and that it is in minor units.

#### Scenario: Reading an invoiced and a base column
- **WHEN** a reader inspects an `invoiced_*` and its `base_*` sibling in the schema
- **THEN** the `invoiced_*` comment names the order currency and the `base_*` comment names the store base currency
- **AND** both comments state that the value is in minor units

#### Scenario: Percentage and count columns are not commented as money
- **WHEN** a column holds a percentage, rate, quantity or count
- **THEN** it is not described as a money amount

### Requirement: Money column comments state tax treatment

A money column comment SHALL state whether the value includes tax, is net of tax, or depends on `orders.is_tax_inclusive`, wherever that is not obvious from the column name.

#### Scenario: Order item amounts
- **WHEN** a reader inspects the `order_items` price, subtotal and total columns
- **THEN** the comments state that price, regular price and subtotal are always net of tax
- **AND** the total comment states that it always includes tax
- **AND** the discount amount comment states that it includes tax when `orders.is_tax_inclusive` is true

#### Scenario: Catalog and coupon amounts
- **WHEN** a reader inspects `variants.base_price`, `variants.base_sale_price` or `coupons.base_discount_amount_fixed`
- **THEN** the comments state that the value includes tax when the store prices items inclusive of tax

### Requirement: Overloaded value columns document each meaning

A column whose unit depends on another column SHALL have a comment that lists each meaning and the column that selects it.

#### Scenario: Coupon spend condition value
- **WHEN** a reader inspects `coupons.spend_condition_value`
- **THEN** the comment states it is a base-currency minor-unit amount when `spend_condition_type` is `min-cart-amount`, and an item count when it is `min-items`
