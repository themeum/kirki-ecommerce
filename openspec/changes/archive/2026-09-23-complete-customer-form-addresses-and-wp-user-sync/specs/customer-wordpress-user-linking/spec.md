## Purpose

Defines how a customer being created is linked to a WordPress user account, based on whether a WordPress user already exists for the submitted email and whether the caller requested one be created.

## ADDED Requirements

### Requirement: An existing WordPress user is attached, never duplicated
When a customer is created with an email that already belongs to an existing WordPress user, the system SHALL link the new customer to that existing user instead of creating another one. This SHALL happen regardless of whether the request also asked for a new WordPress user to be created.

#### Scenario: Email matches an existing WordPress user
- **WHEN** a customer is created with an email that already belongs to a WordPress user
- **THEN** the customer is linked to that existing WordPress user
- **AND** no new WordPress user is created

#### Scenario: Email matches an existing WordPress user even when a new one was requested
- **WHEN** a customer is created with an email that already belongs to a WordPress user, and the request also asks to create a WordPress user
- **THEN** the customer is linked to the existing WordPress user
- **AND** no new WordPress user is created

### Requirement: A new WordPress user is created only when requested and none exists
The system SHALL create a new WordPress user for a customer only when no existing WordPress user's email matches the submitted email, and the request explicitly asks for one to be created. The new user SHALL be created with a randomly generated password.

#### Scenario: No matching user, and a new one is requested
- **WHEN** a customer is created with an email that matches no existing WordPress user, and the request asks to create a WordPress user
- **THEN** a new WordPress user is created with that email and a randomly generated password
- **AND** the customer is linked to the newly created user

### Requirement: A customer can be created without any linked WordPress user
When no existing WordPress user matches the submitted email and the request does not ask for one to be created, the system SHALL create the customer with no linked WordPress user.

#### Scenario: No matching user, and none requested
- **WHEN** a customer is created with an email that matches no existing WordPress user, and the request does not ask to create a WordPress user
- **THEN** the customer is created with no linked WordPress user
