## MODIFIED Requirements

### Requirement: Starting payment for an order is idempotent

When the gateway API supports an idempotency key, the system SHALL send the gateway
an idempotency key, derived from the order, when it creates a payment for an order,
so that starting payment again for the same order does not create a second payment
with the gateway.

When the gateway API has no idempotency key, the system SHALL make sure that only the
latest payment created for an order can complete, so that starting payment again for
the same order cannot charge the customer twice.

#### Scenario: Opening an unpaid order twice

- **WHEN** payment is started twice for the same unpaid order through a gateway that
  supports an idempotency key
- **THEN** both create-payment requests carry the same idempotency key

#### Scenario: Two different orders

- **WHEN** payment is started for two different orders through a gateway that supports
  an idempotency key
- **THEN** the create-payment requests carry different idempotency keys

#### Scenario: Gateway without an idempotency key

- **WHEN** payment is started twice for the same unpaid order through a gateway that
  has no idempotency key, and the customer approves the first payment
- **THEN** the store does not complete the first payment
- **AND** the order payment status does not change
