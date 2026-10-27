## Purpose

Defines how updating a customer reconciles its address list against what is already stored — creating, updating, and deleting addresses to match the submitted list — and how default shipping/billing are resolved among them, mirroring how address creation already behaves for a new customer.

## ADDED Requirements

### Requirement: Addresses are optional on update
The system SHALL allow updating a customer with no addresses submitted, or with an empty address list. In either case, all of the customer's existing addresses SHALL be removed and none SHALL remain.

#### Scenario: Customer updated with no addresses field
- **WHEN** a customer is updated without an addresses list in the request
- **THEN** the update succeeds
- **AND** the customer's existing addresses are unaffected

#### Scenario: Customer updated with an empty address list
- **WHEN** a customer is updated with an explicitly empty address list
- **THEN** the update succeeds
- **AND** none of the customer's previously stored addresses remain

### Requirement: Submitted addresses are reconciled against existing ones
When a customer is updated with a list of addresses, the system SHALL treat each submitted address that references an existing address's identifier as an update to that address, each submitted address with no identifier as a new address to create, and each of the customer's existing addresses that is not referenced by any submitted address as one to delete.

#### Scenario: A mix of existing and new addresses is submitted
- **WHEN** a customer with two existing addresses is updated with a list containing one of those addresses (by identifier, with changed fields) and one new address with no identifier
- **THEN** the referenced existing address is updated with the new field values
- **AND** the new address is created and linked to the customer
- **AND** the existing address that was not included in the submitted list is deleted

### Requirement: Default shipping and default billing are resolved the same way as on creation
Among the full set of addresses a customer will have after an update (existing addresses being kept or updated, plus newly created ones), the system SHALL resolve exactly one as the default shipping address and, independently, exactly one as the default billing address, using the same caller-marked-wins-else-first-address resolution already used when a customer is created with addresses.

#### Scenario: Caller marks a different address as default shipping on update
- **WHEN** a customer is updated with two addresses, and the second is marked as the default shipping address
- **THEN** the second address is persisted as the default shipping address
- **AND** the first address's default shipping flag is persisted as false
