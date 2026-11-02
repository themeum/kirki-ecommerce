## Purpose

Makes sure that when a shopper's earlier guest orders are attached to their account, the customer record that may be created for them carries their real name.

## ADDED Requirements

### Requirement: A customer created during guest-order merge uses the user's own first and last name

When guest orders are attached to a user who has no customer record yet, the store SHALL create the customer with the user's first name as the first name and the user's last name as the last name. The last name SHALL NOT be copied from the first name.

#### Scenario: User with both names

- **WHEN** a user named Ada Lovelace verifies their email and has earlier guest orders under that email
- **THEN** a customer is created with first name Ada and last name Lovelace
- **AND** the guest orders are attached to that customer

#### Scenario: User without a last name

- **WHEN** the user has a first name but no last name
- **THEN** the created customer's last name is empty, not the first name

#### Scenario: Customer already exists

- **WHEN** the user already has a customer record
- **THEN** no new customer is created and the guest orders are attached to the existing one
