## Purpose

Prevents two customer records from sharing the same email address, surfaced to the caller as a field-level validation error rather than a server failure.

## ADDED Requirements

### Requirement: Creating a customer with a duplicate email is rejected
When a customer is created with an email that already belongs to another existing customer record, the system SHALL reject the request with a validation error on the email field, and SHALL NOT create the customer.

#### Scenario: Email already used by another customer
- **WHEN** a customer is created with an email that already belongs to another customer record
- **THEN** the request is rejected with a field-level validation error on `email`
- **AND** no customer record is created

### Requirement: Updating a customer's email to one already in use is rejected
When an existing customer is updated with an email that belongs to a different customer record, the system SHALL reject the request with a validation error on the email field. Updating a customer while keeping its own current email SHALL NOT be treated as a duplicate.

#### Scenario: Email changed to one used by a different customer
- **WHEN** an existing customer is updated with an email that already belongs to a different customer record
- **THEN** the request is rejected with a field-level validation error on `email`

#### Scenario: Customer is updated with its own unchanged email
- **WHEN** an existing customer is updated and its email is unchanged
- **THEN** the request is not rejected for a duplicate email
