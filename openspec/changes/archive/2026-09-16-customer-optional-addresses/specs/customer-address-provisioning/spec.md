## Purpose

Defines the contract for creating a `Customer` record together with zero or more addresses in a single call, including how a default shipping address and a default billing address are chosen and deduplicated among the addresses supplied.

## ADDED Requirements

### Requirement: Customer can be created without any address
The system SHALL allow creating a `Customer` record with no addresses supplied. No `Address` record is created in this case.

#### Scenario: Customer created with an empty address list
- **WHEN** a customer is created with no addresses supplied
- **THEN** the `Customer` record is created
- **AND** no `Address` record is created for that customer

### Requirement: Customer can be created with one or more addresses
The system SHALL allow creating a `Customer` record together with one or more addresses supplied in a single list. Each supplied address SHALL be persisted as an `Address` record linked to the newly created customer.

#### Scenario: Customer created with multiple addresses
- **WHEN** a customer is created with two or more addresses supplied
- **THEN** the `Customer` record is created
- **AND** an `Address` record linked to that customer is created for each supplied address

### Requirement: Default shipping and default billing are each resolved to exactly one address
Among the addresses supplied, the system SHALL resolve exactly one as the default shipping address and, independently, exactly one as the default billing address. For each purpose, the address the caller marked as default for that purpose SHALL win; if no supplied address is marked default for a purpose, the first address in the supplied list SHALL be used as the default for that purpose. The two purposes SHALL be resolved independently — the same address MAY win both, or two different addresses MAY each win one.

#### Scenario: Caller-marked defaults are honored
- **WHEN** a customer is created with two addresses, where the first is marked `is_default_billing` true and the second is marked `is_default_shipping` true
- **THEN** the second address is the default shipping address
- **AND** the first address is the default billing address

#### Scenario: No address marked default falls back to the first address
- **WHEN** a customer is created with two or more addresses, none marked default for either purpose
- **THEN** the first supplied address is the default shipping address
- **AND** the first supplied address is the default billing address

#### Scenario: More than one address marked default for the same purpose
- **WHEN** a customer is created with two addresses both marked `is_default_shipping` true
- **THEN** the first of the two addresses is the default shipping address
- **AND** the second address's `is_default_shipping` is persisted as false

### Requirement: An address that resolves to both defaults is created once
When a single address resolves as the default for both shipping and billing, the system SHALL persist that address as a single `Address` record with both `is_default_shipping` and `is_default_billing` set to true — never as two records.

#### Scenario: A single supplied address is default for both purposes
- **WHEN** a customer is created with exactly one address supplied
- **THEN** exactly one `Address` record is created for that customer
- **AND** it has both `is_default_shipping` and `is_default_billing` set to true

#### Scenario: One address explicitly wins both purposes among several supplied
- **WHEN** a customer is created with multiple addresses supplied, and one of them is marked both `is_default_shipping` and `is_default_billing` true
- **THEN** that address is persisted once, with both flags true
- **AND** no other supplied address is persisted with either flag true

### Requirement: Non-default addresses are persisted without default flags
Any supplied address that does not win the default shipping or default billing resolution SHALL be persisted with both `is_default_shipping` and `is_default_billing` set to false, regardless of what the caller submitted for that address.

#### Scenario: A non-winning address's default flags are forced false
- **WHEN** a customer is created with three addresses, where only one wins default shipping and a different one wins default billing
- **THEN** the third address, which won neither, is persisted with `is_default_shipping` false and `is_default_billing` false
