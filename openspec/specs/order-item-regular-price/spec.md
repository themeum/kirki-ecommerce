# order-item-regular-price Specification

## Purpose

Defines how an order item records the regular (pre-sale) unit price alongside the price actually charged, so a placed order can always tell whether an item was bought on sale, whatever the variant's price is later changed to.

## Requirements

### Requirement: An order item records the regular unit price at placement

When an order item is created, the system SHALL record the variant's regular unit price in both the store's base currency and the order's invoiced currency, alongside the unit price actually charged. The regular unit price SHALL be the variant's regular price whether or not a sale price was active, so for an item not bought on sale it equals the charged unit price. The invoiced regular price SHALL be converted from the base regular price using the same exchange rate as the order's other invoiced amounts.

#### Scenario: Item bought while a sale price is active

- **WHEN** an order is placed for a variant whose sale price is lower than its regular price
- **THEN** the order item's charged unit price is the sale price
- **AND** its recorded regular unit price is the variant's regular price

#### Scenario: Item bought with no sale price

- **WHEN** an order is placed for a variant with no sale price
- **THEN** the order item's recorded regular unit price equals its charged unit price

#### Scenario: Order placed in a non-base currency

- **WHEN** an order is placed in a currency other than the store's base currency
- **THEN** the order item's invoiced regular price is the base regular price converted at the order's exchange rate

### Requirement: The recorded regular price is frozen against later changes

An order item's recorded regular unit price SHALL NOT change when the variant's regular or sale price is edited after the order is placed, and SHALL NOT change when an order edit alters the quantity of an existing item.

#### Scenario: Variant price changes after the order is placed

- **WHEN** a variant's regular price is changed after an order containing it was placed
- **THEN** that order item's recorded regular unit price is unchanged

#### Scenario: Quantity of an existing item is edited

- **WHEN** an order edit changes the quantity of an item that already exists on the order
- **THEN** the item keeps its previously recorded regular unit price

#### Scenario: Item added to an existing order

- **WHEN** an order edit adds a variant that was not previously on the order
- **THEN** the new item records the variant's regular unit price as of that edit

### Requirement: Orders without a recorded regular price are treated as not bought on sale

An order item whose regular unit price was never recorded (an item from an order placed before the regular price was recorded) SHALL be treated as not bought on sale. No regular price SHALL be inferred or backfilled for it.

#### Scenario: Pre-existing order item

- **WHEN** an order item was created before the regular price was recorded
- **THEN** it has no recorded regular unit price
- **AND** it is treated as not bought on sale
