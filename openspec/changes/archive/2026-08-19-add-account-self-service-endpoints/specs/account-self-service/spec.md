## Purpose

Lets a logged-in shopper manage their own account — profile details, password, and shipping/billing addresses — through dedicated endpoints scoped strictly to their own record, without going through the admin customer-management API.

## ADDED Requirements

### Requirement: Only an authenticated user may access account endpoints
The system SHALL reject any request to an account self-service endpoint (`PUT /account/profile`, `PUT /account/password-change`, `PUT /account/addresses`) from a user who is not logged in.

#### Scenario: Unauthenticated request
- **WHEN** a request to any of the three account endpoints is made without a logged-in session
- **THEN** the request is rejected as unauthorized and no data is read or changed

### Requirement: Account endpoints always act on the requester's own record
The system SHALL resolve which customer, addresses, and WordPress user an account request applies to entirely from the authenticated session — never from a client-supplied identifier. No account endpoint SHALL accept or honor a customer id, address id, or user id in the request.

#### Scenario: Client attempts to target another customer
- **WHEN** an authenticated user submits an account request that includes an id referencing a different customer's record
- **THEN** the id is ignored and the update is applied only to the requester's own record

### Requirement: Account request fails cleanly when no customer record exists
When an authenticated user has no `Customer` record linked to their WordPress account, the system SHALL reject `PUT /account/profile` and `PUT /account/addresses` requests with a not-found error rather than creating one implicitly.

#### Scenario: Logged-in user with no customer record
- **WHEN** an authenticated user with no linked `Customer` record submits `PUT /account/profile` or `PUT /account/addresses`
- **THEN** the request fails with a not-found error and no `Customer` or `Address` record is created

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

### Requirement: Customer updates one address at a time
`PUT /account/addresses` SHALL let the authenticated customer update either their shipping address or their billing address in a single request — never both — discriminated by a required `type` field (`shipping` or `billing`). Updating one address type SHALL NOT change the other address type's record.

#### Scenario: Successful shipping address update
- **WHEN** an authenticated customer submits a request with `type` set to shipping and valid address fields
- **THEN** their existing shipping `Address` record is updated with the submitted fields
- **AND** their billing `Address` record is unchanged

#### Scenario: Invalid address submission
- **WHEN** an authenticated customer submits an address update missing a required field (e.g. no city) for the selected type
- **THEN** the request is rejected with a validation error and no address record is changed

#### Scenario: Invalid type value
- **WHEN** an authenticated customer submits a request with a `type` value other than shipping or billing
- **THEN** the request is rejected with a validation error and no address record is changed

### Requirement: Billing address update also sets whether billing mirrors shipping
A billing address update (`type` set to billing) SHALL require an `is_billing_same_as_shipping` flag in the request. That flag SHALL be persisted on the customer's own record. When the flag is true, the customer's billing `Address` record SHALL be set to match their current shipping address instead of any address fields submitted in the request. When the flag is false, the billing `Address` record SHALL be updated from the submitted address fields, which are required in that case.

#### Scenario: Billing update with is_billing_same_as_shipping true
- **WHEN** an authenticated customer submits a billing address update with `is_billing_same_as_shipping` set to true
- **THEN** the customer's `is_billing_same_as_shipping` value is stored as true
- **AND** their billing `Address` record is set to match their current shipping address, regardless of any address fields submitted

#### Scenario: Billing update with is_billing_same_as_shipping false
- **WHEN** an authenticated customer submits a billing address update with `is_billing_same_as_shipping` set to false and valid address fields
- **THEN** the customer's `is_billing_same_as_shipping` value is stored as false
- **AND** their billing `Address` record is updated with the submitted address fields

#### Scenario: Billing update missing is_billing_same_as_shipping
- **WHEN** an authenticated customer submits a billing address update without an `is_billing_same_as_shipping` value
- **THEN** the request is rejected with a validation error and no customer or address record is changed

#### Scenario: Shipping update does not require is_billing_same_as_shipping
- **WHEN** an authenticated customer submits a shipping address update
- **THEN** the request does not require an `is_billing_same_as_shipping` value, and the customer's existing `is_billing_same_as_shipping` value is left unchanged
