## Purpose

Ensures every order carries a persisted snapshot of who placed it — first name, last name, email, and phone — resolved consistently at creation time instead of being partially missing or recomputed differently on every read.

## ADDED Requirements

### Requirement: Order stores a customer first and last name
The system SHALL persist `customer_first_name` and `customer_last_name` on every order, in addition to the existing `customer_email` and `customer_phone`, matching the shape already used for the order's shipping and billing names.

#### Scenario: Order created
- **WHEN** an order is created
- **THEN** the order has stored `customer_first_name` and `customer_last_name` values (or null for either if no name could be resolved from any source)

### Requirement: Customer contact fields resolve with a consistent fallback priority
When creating an order, the system SHALL resolve each of `customer_first_name`, `customer_last_name`, `customer_email`, and `customer_phone` independently using the same priority: the placing WordPress user's profile if they have an account, then the request's billing fields. A field only falls through to billing when the WordPress profile does not provide a value for that specific field. The create-order request itself does not accept these fields as input — there is no explicit-value override.

#### Scenario: Authenticated user with a complete WordPress profile
- **WHEN** an authenticated user with a first name, last name, email, and phone on their WordPress profile places an order
- **THEN** the order's `customer_first_name` and `customer_last_name` are taken from the WordPress profile's first and last name
- **AND** the order's `customer_email` and `customer_phone` are taken from the WordPress profile

#### Scenario: Authenticated user with a partial WordPress profile
- **WHEN** an authenticated user places an order and their WordPress profile is missing one of these fields (e.g. no phone on file)
- **THEN** the fields present on the WordPress profile are used for the order
- **AND** the missing field is instead taken from the corresponding billing field on the request (e.g. `billing_phone`)

#### Scenario: Guest checkout
- **WHEN** an unauthenticated (guest) checkout request creates an order
- **THEN** the order's `customer_first_name` and `customer_last_name` are taken from the request's `billing_first_name`/`billing_last_name`
- **AND** the order's `customer_email` and `customer_phone` are taken from `billing_email` and `billing_phone`

#### Scenario: No source provides a value
- **WHEN** an order is created and neither a WordPress profile value nor a billing value is available for a given contact field
- **THEN** that field is stored as null on the order

### Requirement: Order updates do not re-resolve customer contact fields
Updating an existing order SHALL NOT re-run the customer contact resolution or otherwise change the order's stored `customer_first_name`, `customer_last_name`, `customer_email`, or `customer_phone` as a side effect of the update.

#### Scenario: Order updated after creation
- **WHEN** an existing order is updated (e.g. shipping address or order status changes)
- **THEN** the order's stored `customer_first_name`, `customer_last_name`, `customer_email`, and `customer_phone` remain exactly as they were resolved at creation

### Requirement: Order list API exposes a customer name derived from the stored names
The order list API response SHALL include a `customer_name` value for each order, built from that order's stored `customer_first_name`/`customer_last_name` rather than from shipping fields.

#### Scenario: Listing orders
- **WHEN** a client requests the orders list
- **THEN** each order in the response includes a `customer_name` combining its stored `customer_first_name` and `customer_last_name` (the existing `customer_email` field is unaffected; `customer_phone` is not added to the list response)
