# variant-per-order-limit Specification

## Purpose

Defines how a variant's per-order limit is validated and stored, so that a variant with the limit turned on always carries a usable maximum and shoppers are never blocked by an empty or zero limit.

## Requirements

### Requirement: An enabled per-order limit always stores a maximum of at least 1
When a variant is created or updated with the per-order limit turned on and no usable maximum (empty, null, or less than 1), the system SHALL store a maximum of 1. A maximum the merchant supplied that is 1 or more SHALL be stored unchanged.

#### Scenario: Limit turned on with no maximum
- **WHEN** a variant is saved with the per-order limit turned on and no maximum given
- **THEN** the stored maximum is 1

#### Scenario: Limit turned on with a maximum
- **WHEN** a variant is saved with the per-order limit turned on and a maximum of 5
- **THEN** the stored maximum is 5

#### Scenario: Limit turned on with a maximum of 0 through a save that skips request validation
- **WHEN** a variant is saved by code that does not pass through request validation, with the per-order limit turned on and a maximum of 0
- **THEN** the stored maximum is 1

#### Scenario: Shopper can add one unit of a limited variant saved without a maximum
- **WHEN** a variant was saved with the limit turned on and no maximum, and a shopper adds 1 unit to the cart
- **THEN** the addition is accepted
- **AND** adding a second unit is rejected as exceeding the limit

### Requirement: A disabled per-order limit does not require a maximum
When the per-order limit is turned off, the system SHALL accept an empty maximum and SHALL NOT replace it with 1. The limit SHALL NOT affect cart or order quantities while it is turned off, whatever maximum is stored.

#### Scenario: Limit turned off with no maximum
- **WHEN** a variant is saved with the per-order limit turned off and no maximum given
- **THEN** the save succeeds
- **AND** the stored maximum stays empty

#### Scenario: Limit turned off keeps a previously stored maximum without enforcing it
- **WHEN** a merchant turns the limit off on a variant that had a maximum of 3
- **THEN** shoppers can add more than 3 units of that variant to the cart

### Requirement: The maximum must be a whole number of at least 1 when given
The system SHALL reject a variant payload whose maximum is given and is not a whole number of at least 1. An empty maximum SHALL NOT be rejected on these grounds. This applies to product creation, product update, single variant update, and bulk variant update.

#### Scenario: Zero maximum is rejected
- **WHEN** a payload gives a maximum of 0
- **THEN** the system rejects it with a validation error on the maximum

#### Scenario: Negative maximum is rejected
- **WHEN** a payload gives a maximum of -2
- **THEN** the system rejects it with a validation error on the maximum

#### Scenario: Empty maximum is accepted
- **WHEN** a payload gives no maximum or a null maximum
- **THEN** validation passes
