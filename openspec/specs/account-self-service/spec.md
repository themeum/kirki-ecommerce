# account-self-service Specification

## Purpose

Lets a logged-in shopper manage their own account — profile details, password, and shipping/billing addresses — through dedicated endpoints scoped strictly to their own record, without going through the admin customer-management API.

## Requirements

### Requirement: Only an authenticated user may access account endpoints
The system SHALL reject any request to an account self-service endpoint (`PUT /account/profile`, `PUT /account/password-change`, or any `/account/addresses` endpoint) from a user who is not logged in.

#### Scenario: Unauthenticated request
- **WHEN** a request to any account self-service endpoint is made without a logged-in session
- **THEN** the request is rejected as unauthorized and no data is read or changed

### Requirement: Account endpoints always act on the requester's own record
The system SHALL resolve which customer, addresses, and WordPress user an account request applies to entirely from the authenticated session — never from a client-supplied identifier. No account endpoint SHALL accept or honor a customer id or user id in the request. Where an `/account/addresses` endpoint references a specific address by id in its path, that id SHALL be scoped to addresses owned by the resolved customer rather than honored as a global lookup (see the address-book capability for the resulting not-found behavior).

#### Scenario: Client attempts to target another customer via customer id
- **WHEN** an authenticated user submits an account request that includes a customer id or user id referencing a different customer's record
- **THEN** the id is ignored and the update is applied only to the requester's own record

### Requirement: Account request fails cleanly when no customer record exists
When an authenticated user has no `Customer` record linked to their WordPress account, the system SHALL reject a `PUT /account/profile` request with a not-found error rather than creating one implicitly.

#### Scenario: Logged-in user with no customer record
- **WHEN** an authenticated user with no linked `Customer` record submits `PUT /account/profile`
- **THEN** the request fails with a not-found error and no `Customer` record is created

### Requirement: Customer can update their own profile
`PUT /account/profile` SHALL let the authenticated customer update their own first name, last name, phone, and WordPress display name. Email is not editable through this endpoint.

#### Scenario: Successful profile update
- **WHEN** an authenticated customer submits valid profile fields including a display name
- **THEN** their `Customer` record is updated with the submitted first name, last name, and phone
- **AND** their linked WordPress user's display name is updated to match

#### Scenario: Invalid profile submission
- **WHEN** an authenticated customer submits a profile update missing a required field (e.g. no first name or no display name)
- **THEN** the request is rejected with a validation error and no fields are changed

#### Scenario: Email in the request body is ignored
- **WHEN** an authenticated customer submits a profile update that includes an email value
- **THEN** the email value is ignored and neither the `Customer` record's email nor the linked WordPress user's email is changed

### Requirement: Customer can change their own password
`PUT /account/password-change` SHALL let the authenticated user change their WordPress password by supplying their current password and a new password. The current password SHALL be verified before the change is applied. The requester's session SHALL remain valid after a successful change.

#### Scenario: Successful password change
- **WHEN** an authenticated user submits their correct current password and a valid new password
- **THEN** their WordPress password is updated
- **AND** the requester remains logged in after the change

#### Scenario: Incorrect current password
- **WHEN** an authenticated user submits an incorrect current password
- **THEN** the password change is rejected and the existing password remains unchanged

#### Scenario: New password too short
- **WHEN** an authenticated user submits a new password shorter than the minimum allowed length
- **THEN** the request is rejected with a validation error and the existing password remains unchanged
