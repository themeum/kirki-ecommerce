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

### Requirement: Customer provisioning commits independently of order creation
Auto-provisioning a `Customer` record (its WordPress user, customer row, and shipping/billing addresses) during checkout SHALL commit as its own atomic unit before order creation begins, independent of whether the subsequent order creation succeeds.

#### Scenario: Order creation fails after customer provisioning succeeded
- **WHEN** a new `Customer` record is auto-provisioned during checkout, and order creation subsequently fails (e.g. insufficient stock, invalid shipping method)
- **THEN** the provisioned `Customer` record, its WordPress user, and its addresses remain persisted
- **AND** no order is persisted

#### Scenario: Customer provisioning itself fails
- **WHEN** provisioning the WordPress user, `Customer` record, or an address fails partway through
- **THEN** no `Customer` record, WordPress user, or address from that attempt is persisted
- **AND** order creation does not proceed

### Requirement: Customer is resolved before cart calculation
The system SHALL resolve the checkout customer — finding their existing `Customer` record or auto-provisioning one — before calculating cart totals and validating any applied coupon, so the resolved `customer_id` and their order history are available to coupon eligibility rules.

#### Scenario: First-time-buyer coupon on a shopper's first order
- **WHEN** an authenticated user with no existing `Customer` record, or with a `Customer` record but no prior non-cancelled/non-returned orders, applies a coupon restricted to first-time buyers during checkout
- **THEN** the coupon is validated using their resolved `customer_id` and actual order count
- **AND** the coupon is accepted

#### Scenario: First-time-buyer coupon on a repeat customer's order
- **WHEN** an authenticated user with at least one prior non-cancelled/non-returned order applies a coupon restricted to first-time buyers during checkout
- **THEN** the coupon's discount does not apply to the order

Note: an ineligible coupon does not fail the checkout request — order creation silently proceeds without the coupon's discount instead (pre-existing behavior of `RecalculateCartAction::get_discount_result()`, unrelated to and unchanged by this fix). This applies to coupon ineligibility generally, not just this scenario.

#### Scenario: Per-customer-usage-limit coupon on a shopper's first order
- **WHEN** an authenticated user with no existing `Customer` record applies a coupon with a per-customer usage limit during checkout
- **THEN** the coupon is validated using their resolved (auto-provisioned) `customer_id`
- **AND** the coupon is not silently dropped merely because a `customer_id` was unavailable

Note: a customer-include-list coupon has the same underlying `customer_id`-availability dependency, but can't usefully target a customer who doesn't exist yet, so it has no observable manifestation of this bug for a genuinely first-time buyer specifically — not covered by a separate scenario here.

### Requirement: At most one customer record exists per WordPress user
The system SHALL prevent more than one `Customer` record from ever being linked to the same `user_id`, including under concurrent checkout requests.

#### Scenario: Concurrent first-time checkouts for the same user
- **WHEN** two checkout requests for the same authenticated user who has no existing `Customer` record are submitted concurrently
- **THEN** at most one `Customer` record ends up linked to that `user_id`
- **AND** every order from both requests that succeeds is linked to that single `Customer` record
