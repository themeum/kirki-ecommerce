# checkout-customer-provisioning Specification

## Purpose

Ensures every authenticated shopper who completes checkout ends up linked to a `Customer` record, so their orders, saved addresses, and repeat-purchase history are tied to their account from the first order onward — without changing guest checkout behavior.

## Requirements

### Requirement: Auto-provision customer for authenticated checkout without an existing record
When `POST /checkout` is submitted by an authenticated user who has no `Customer` record linked to their `user_id`, the system SHALL create one as part of placing the order, and link the resulting order to it.

#### Scenario: Logged-in user with no customer record places an order
- **WHEN** an authenticated user with no existing `Customer` row for their `user_id` submits a valid checkout request
- **THEN** a new `Customer` record linked to that `user_id` is created
- **AND** the created order's `customer_id` references that new `Customer` record

#### Scenario: Logged-in user with an existing customer record places an order
- **WHEN** an authenticated user who already has a `Customer` row for their `user_id` submits a valid checkout request
- **THEN** no new `Customer` record is created
- **AND** the created order's `customer_id` references their existing `Customer` record

#### Scenario: Guest places an order
- **WHEN** an unauthenticated (guest) checkout request is submitted
- **THEN** no `Customer` record is created
- **AND** the created order's `customer_id` is null, as it is today

### Requirement: New customer profile is sourced from the WordPress user first, checkout billing info as fallback
When provisioning a `Customer` record for an authenticated checkout user, the system SHALL populate the customer's name, email, and phone from the shopper's WordPress user profile wherever available, and fall back to the checkout request's billing fields for anything the WordPress profile does not provide.

#### Scenario: WordPress profile has the needed fields
- **WHEN** the authenticated user's WordPress profile has a first name, last name, email, and phone
- **THEN** the new `Customer` record uses those WordPress profile values

#### Scenario: WordPress profile is missing some fields
- **WHEN** the authenticated user's WordPress profile is missing a field the new `Customer` record needs (e.g. phone)
- **THEN** the missing field is populated from the corresponding billing field submitted in the checkout request

### Requirement: Shipping and billing addresses are created for the new customer
When a `Customer` record is auto-provisioned during checkout, the system SHALL also create shipping and billing `Address` records for that customer, populated from the shipping and billing fields submitted in the checkout request.

#### Scenario: Addresses created from checkout payload
- **WHEN** a new `Customer` record is provisioned during checkout
- **THEN** a shipping `Address` record is created for that customer from the request's shipping fields
- **AND** a billing `Address` record is created for that customer from the request's billing fields (or duplicated from shipping when the request marks billing as same as shipping)

### Requirement: Customer provisioning and order creation are atomic
Auto-provisioning a `Customer` record during checkout SHALL succeed or fail together with the order it is being created for.

#### Scenario: Order creation fails after customer provisioning would occur
- **WHEN** checkout fails validation performed during order creation (e.g. insufficient stock, invalid shipping method) after the system would have provisioned a new `Customer` record
- **THEN** no `Customer` record, address, or order is persisted

### Requirement: At most one customer record exists per WordPress user
The system SHALL prevent more than one `Customer` record from ever being linked to the same `user_id`, including under concurrent checkout requests.

#### Scenario: Concurrent first-time checkouts for the same user
- **WHEN** two checkout requests for the same authenticated user who has no existing `Customer` record are submitted concurrently
- **THEN** at most one `Customer` record ends up linked to that `user_id`
- **AND** every order from both requests that succeeds is linked to that single `Customer` record
