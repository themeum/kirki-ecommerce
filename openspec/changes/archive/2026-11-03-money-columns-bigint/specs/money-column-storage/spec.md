# Spec Delta

## Purpose

Makes sure the database stores every money amount in full. No supported currency and no realistic amount is clipped, rounded or lost by the column type.

## ADDED Requirements

### Requirement: Money columns use a 64-bit integer type

Every column that stores a monetary amount in minor units on the order, order item, order tax, order coupon, order item coupon, refund, coupon and variant tables SHALL be a signed 64-bit integer column. Quantity, stock, count, limit, ordering and percentage columns are not money columns and are not covered.

#### Scenario: Schema of a fresh install
- **WHEN** the plugin is installed fresh and its tables are created
- **THEN** each money column of those tables has the database type `bigint`
- **AND** each keeps its name, default value, nullability and comment

#### Scenario: Quantity and count columns keep their type
- **WHEN** a reader inspects `quantity`, `items_count`, `usage_limit`, `customer_limit` and `max_per_order`
- **THEN** they are not changed to `bigint` by this requirement

### Requirement: A large amount is stored without loss

The system SHALL store and return any money amount up to the largest value a 64-bit signed integer holds, with no clipping and no error. An amount above 2,147,483,647 minor units SHALL be returned exactly as it was written.

#### Scenario: Order total above the old limit
- **WHEN** an order is saved with an `invoiced_total` of 5,000,000,000 minor units
- **THEN** reading the order returns 5,000,000,000
- **AND** the stored value is not 2,147,483,647

#### Scenario: Large line item and discount
- **WHEN** an order item with a unit price of 3,000,000,000 minor units and a discount of 1,000,000,000 minor units is saved
- **THEN** the price, subtotal, discount and total of that line are returned exactly
- **AND** the order totals that sum the line are exact

#### Scenario: Large catalog price
- **WHEN** a variant is saved with a `base_price` above 2,147,483,647 minor units
- **THEN** the same value is returned when the variant is read

### Requirement: Negative money amounts are kept

A money column SHALL keep its sign, so that an amount below zero is stored and returned as a negative value.

#### Scenario: Negative amount round trip
- **WHEN** a money amount of -2,500,000,000 minor units is written to a money column that allows it
- **THEN** the value read back is -2,500,000,000
