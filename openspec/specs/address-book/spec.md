# address-book Specification

## Purpose

Lets a logged-in shopper maintain multiple saved addresses (home, office, others) and mark one as the default shipping address and one as the default billing address, replacing the old one-shipping-plus-one-billing-address-per-customer model.

## Requirements

### Requirement: Address endpoints require authentication and are scoped to the requester's own addresses
The system SHALL reject any request to an `/account/addresses` endpoint from a user who is not logged in. Every such endpoint SHALL resolve which customer's addresses it acts on entirely from the authenticated session. Where an endpoint references a specific address by id (`GET`, `PUT`, `DELETE /account/addresses/{id}`, `PATCH /account/addresses/{id}/set-default`), that id SHALL be scoped to addresses owned by the resolved customer — an id that exists but belongs to a different customer SHALL be treated as not found, not acted on.

#### Scenario: Unauthenticated request
- **WHEN** a request to any `/account/addresses` endpoint is made without a logged-in session
- **THEN** the request is rejected as unauthorized and no data is read or changed

#### Scenario: Requesting another customer's address by id
- **WHEN** an authenticated customer requests `GET`, `PUT`, or `DELETE /account/addresses/{id}` for an id that belongs to a different customer
- **THEN** the request fails with a not-found error and no data belonging to the other customer is returned or changed

### Requirement: Customer can list their own addresses
`GET /account/addresses` SHALL return every `Address` record belonging to the authenticated customer, and no addresses belonging to any other customer.

#### Scenario: List returns only the requester's addresses
- **WHEN** an authenticated customer with saved addresses requests `GET /account/addresses`
- **THEN** the response contains every address linked to their own `Customer` record
- **AND** contains no address linked to any other customer

#### Scenario: Customer has no saved addresses
- **WHEN** an authenticated customer with no saved addresses requests `GET /account/addresses`
- **THEN** the response is an empty list, not an error

### Requirement: Customer can retrieve a single address by id
`GET /account/addresses/{id}` SHALL return the full address record when the id belongs to the authenticated customer.

#### Scenario: Successful retrieval
- **WHEN** an authenticated customer requests `GET /account/addresses/{id}` for an id belonging to their own `Customer` record
- **THEN** the response contains that address's full data

### Requirement: Customer can create a new address
`POST /account/addresses` SHALL create a new `Address` linked to the authenticated customer's `Customer` record, provisioning one first if the authenticated user doesn't have one yet. A `type` of `home`, `office`, or `others` is required. `first_name`, `address_line1`, `city`, `state`, `country`, and `postal_code` are required; `last_name`, `email`, and `phone` are optional. `is_default_shipping` and `is_default_billing` are optional booleans, both defaulting to false — creating an address does not make it a default unless explicitly requested.

#### Scenario: Successful creation
- **WHEN** an authenticated customer submits a valid address with a `type` of `home`, `office`, or `others`
- **THEN** a new `Address` record is created and linked to their `Customer` record
- **AND** the response contains the created address

#### Scenario: First address for a user with no customer record yet
- **WHEN** an authenticated user who has no `Customer` record linked to their WordPress account submits `POST /account/addresses`
- **THEN** a `Customer` record is created for them
- **AND** the address is created and linked to that new `Customer` record

#### Scenario: Invalid type value
- **WHEN** an authenticated customer submits an address with a `type` other than `home`, `office`, or `others`
- **THEN** the request is rejected with a validation error and no address is created

#### Scenario: Missing required field
- **WHEN** an authenticated customer submits an address missing a required field (e.g. no `city`)
- **THEN** the request is rejected with a validation error and no address is created

#### Scenario: Address created without contact details
- **WHEN** an authenticated customer submits a valid address with no `email` and no `phone`
- **THEN** the address is created successfully with both fields empty

### Requirement: Customer can update an existing address
`PUT /account/addresses/{id}` SHALL update the address's `type` and contact/location fields, when the id belongs to the authenticated customer, using the same field requirements as creation. This endpoint SHALL NOT accept or change `is_default_shipping`/`is_default_billing` — changing default status is exclusively done through `PATCH /account/addresses/{id}/set-default`, so that updating an address's details (e.g. its city) never has the side effect of unsetting its default status.

#### Scenario: Updating address details does not change default status
- **WHEN** an authenticated customer updates an address that is currently their default billing address, changing only its city
- **THEN** the address's fields are updated
- **AND** it remains the default billing address

#### Scenario: Successful update
- **WHEN** an authenticated customer submits a valid update to an address they own
- **THEN** the address record is updated with the submitted fields

#### Scenario: Invalid update
- **WHEN** an authenticated customer submits an update to an address they own that is missing a required field or has an invalid `type`
- **THEN** the request is rejected with a validation error and the address is unchanged

### Requirement: Customer can delete an address
`DELETE /account/addresses/{id}` SHALL delete the address when the id belongs to the authenticated customer. Deleting an address that was a default shipping and/or billing address SHALL leave that purpose with no default address — no other address is automatically promoted.

#### Scenario: Successful deletion
- **WHEN** an authenticated customer requests deletion of an address they own
- **THEN** the address record is deleted

#### Scenario: Deleting a default address does not promote another
- **WHEN** an authenticated customer deletes an address that was their default billing address
- **THEN** the address is deleted
- **AND** no other address is automatically marked as the new default billing address

### Requirement: At most one address is the default per purpose
For a given customer, at most one address SHALL have `is_default_shipping` set to true at any time, and independently at most one address SHALL have `is_default_billing` set to true at any time. The two purposes are independent: a single address can be both the default shipping and default billing address at once, or each purpose can point to a different address.

#### Scenario: Setting a new default shipping address unsets the previous one
- **WHEN** an authenticated customer has an existing default shipping address and marks a different one of their addresses as `is_default_shipping`
- **THEN** the newly marked address has `is_default_shipping` true
- **AND** the previously default address has `is_default_shipping` false
- **AND** no other address of that customer has `is_default_shipping` true

#### Scenario: Marking default shipping does not affect default billing
- **WHEN** an authenticated customer marks an address as their default shipping address
- **THEN** the customer's existing default billing address (if any), whether the same address or a different one, is unaffected

### Requirement: Customer can set an address as the default address for one purpose
`PATCH /account/addresses/{id}/set-default` SHALL let the authenticated customer mark an address they own as their default address for one purpose at a time, by submitting `purpose` as `shipping` or `billing`. This endpoint only sets a new default for the submitted purpose — the other purpose's current default, if any, is left unchanged, and there is no way to clear a purpose to "no default" through this endpoint (clearing happens only via delete, per the deletion requirement above). To make one address the default for both purposes, call this endpoint twice — once per purpose.

#### Scenario: Set as default shipping
- **WHEN** an authenticated customer submits `PATCH /account/addresses/{id}/set-default` with `purpose` set to `shipping` for an address they own
- **THEN** that address becomes their default shipping address
- **AND** their default billing address is unchanged

#### Scenario: Set as default shipping and billing via two calls
- **WHEN** an authenticated customer submits `PATCH /account/addresses/{id}/set-default` with `purpose` set to `shipping`, then submits it again with `purpose` set to `billing`, both for the same address they own
- **THEN** that address ends up as both their default shipping and default billing address

#### Scenario: Invalid purpose value
- **WHEN** an authenticated customer submits `PATCH /account/addresses/{id}/set-default` with a `purpose` other than `shipping` or `billing`
- **THEN** the request is rejected with a validation error and no default status is changed
