## MODIFIED Requirements

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
