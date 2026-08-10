## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Customer is resolved before cart calculation
The system SHALL resolve the checkout customer — finding their existing `Customer` record or auto-provisioning one — before calculating cart totals and validating any applied coupon, so the resolved `customer_id` is available to coupon eligibility rules.

#### Scenario: First-time-buyer coupon on a shopper's first order
- **WHEN** an authenticated user with no existing `Customer` record applies a coupon restricted to first-time buyers during checkout
- **THEN** the coupon is validated using their resolved (auto-provisioned) `customer_id`
- **AND** the coupon is not rejected with a "please login" error merely because a `customer_id` was unavailable

Note: this requirement covers only `customer_id` availability. Whether a `first_time_buyer_only` coupon correctly checks prior order count is a separate, pre-existing gap (`customer_order_count` is never populated by this code path) and is out of scope for this change.

#### Scenario: Per-customer-usage-limit coupon on a shopper's first order
- **WHEN** an authenticated user with no existing `Customer` record applies a coupon with a per-customer usage limit during checkout
- **THEN** the coupon is validated using their resolved (auto-provisioned) `customer_id`
- **AND** the coupon is not rejected with a "please login" error merely because a `customer_id` was unavailable

Note: a customer-include-list coupon has the same underlying `customer_id`-availability dependency, but can't usefully target a customer who doesn't exist yet, so it has no observable manifestation of this bug for a genuinely first-time buyer specifically — not covered by a separate scenario here.
