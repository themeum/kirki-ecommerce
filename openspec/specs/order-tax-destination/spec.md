# order-tax-destination Specification

## Purpose

Records on each order which address its tax was calculated from, so a merchant can explain the tax of an order even when the address used differs by country.

## Requirements

### Requirement: An order records the address its tax was calculated from

The system SHALL store a tax destination on every order whose tax was calculated. The value SHALL be one of `shipping`, `billing` or `store`. The value SHALL be the address the tax calculation really used, not the address the system expected to use.

#### Scenario: Tax calculated from the shipping address

- **WHEN** an order is created and its tax is calculated from the order's shipping address
- **THEN** the order's tax destination is `shipping`

#### Scenario: Tax calculated from the store address

- **WHEN** an order is created with no shipping address country and its tax is calculated from the store address
- **THEN** the order's tax destination is `store`

#### Scenario: Tax calculated from the billing address

- **WHEN** the tax strategy for the order's country uses the billing address
- **THEN** the order's tax destination is `billing`

### Requirement: An order without calculated tax has no tax destination

The system SHALL leave the tax destination empty when no tax was calculated for the order.

#### Scenario: Tax calculation is off

- **WHEN** an order is created while tax calculation is disabled
- **THEN** the order's tax destination is empty

#### Scenario: No tax strategy for the country

- **WHEN** an order is created for a country that has no enabled tax region
- **THEN** the order's tax destination is empty

### Requirement: The tax destination follows the order's recalculation

The system SHALL update the tax destination when an order is recalculated, so it always matches the tax amounts the order now holds.

#### Scenario: The shipping address of an order changes

- **WHEN** an order is updated and its tax is calculated again from a different address source
- **THEN** the order's tax destination shows the new source

### Requirement: The order API exposes the tax destination

The system SHALL include the tax destination in the order data that the admin API and the storefront API return.

#### Scenario: Reading an order

- **WHEN** a client requests an order
- **THEN** the response includes the order's tax destination, or an empty value when none is stored
