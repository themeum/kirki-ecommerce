# customer-wordpress-user-email-sync Specification

## Purpose

Keeps a customer's email and its linked WordPress user consistent after creation, in both directions, without requiring an administrator to manually reconcile them when either side changes independently.

## Requirements

### Requirement: Customer email follows its linked WordPress user's email
When the email of a WordPress user that is linked to a customer changes by any means, the system SHALL update that customer's email to match the new value.

#### Scenario: Linked WordPress user's email is changed
- **WHEN** the email of a WordPress user linked to a customer is changed
- **THEN** the linked customer's email is updated to the new value

#### Scenario: A WordPress user's profile is updated without changing the email
- **WHEN** a WordPress user linked to a customer has their profile updated, but their email is unchanged
- **THEN** the linked customer's email is left unchanged

### Requirement: A newly created WordPress user attaches to a matching unlinked customer
When a new WordPress user is created with an email that matches an existing customer that has no linked WordPress user, the system SHALL link that customer to the newly created user.

#### Scenario: New WordPress user matches an existing unlinked customer
- **WHEN** a new WordPress user is created with an email matching an existing customer that has no linked WordPress user
- **THEN** that customer becomes linked to the newly created WordPress user

### Requirement: An already-linked customer is never relinked
When a new WordPress user is created with an email matching an existing customer that already has a linked WordPress user, the system SHALL NOT change that customer's existing link.

#### Scenario: New WordPress user matches an already-linked customer
- **WHEN** a new WordPress user is created with an email matching an existing customer that already has a different linked WordPress user
- **THEN** the existing customer's WordPress user link is unchanged
