# payment-processing-integrity Specification

## Purpose

Defines what the store guarantees when a payment gateway reports, or repeats, a
payment event: the money received is checked against the order, repeated events
and repeated payment attempts have no extra effect, and handling is atomic and
leaves a trace when it fails.

## Requirements

### Requirement: A captured payment must match the order before it marks the order paid

The system SHALL compare the amount and currency of a captured payment reported
by a gateway with the order's total and currency before marking the order paid.
When they do not match, the system SHALL NOT mark the order paid, SHALL record
the gateway's payload on the order, SHALL put the order on hold where its status
allows it, SHALL log the mismatch, and SHALL acknowledge the webhook so the
gateway does not redeliver it.

#### Scenario: Captured amount and currency match

- **WHEN** a verified PayPal capture-completed event reports the order's exact
  total in the order's currency
- **THEN** the order is marked as paid

#### Scenario: Captured amount is lower than the order total

- **WHEN** a verified capture-completed event reports an amount below the
  order's total
- **THEN** the order is not marked as paid
- **AND** the order is put on hold where its status allows it
- **AND** the mismatch is logged
- **AND** the webhook request succeeds

#### Scenario: Captured currency differs from the order currency

- **WHEN** a verified capture-completed event reports the right number in a
  different currency
- **THEN** the order is not marked as paid and the webhook request succeeds

### Requirement: Repeated gateway events have no additional effect

The system SHALL treat a webhook delivered more than once as equivalent to
delivering it once. A repeated approval event for an order that is already
captured SHALL succeed without error, and a repeated completed-refund event for
a refund that is already completed SHALL NOT change the refund or log it again.

#### Scenario: Approval event delivered twice

- **WHEN** PayPal delivers the same order-approved event twice and the second
  capture attempt is answered with "already captured"
- **THEN** the second delivery succeeds
- **AND** the order is captured once

#### Scenario: Refund-completed event delivered twice

- **WHEN** PayPal delivers the same refund-completed event twice
- **THEN** the refund is completed once
- **AND** the order's activity log records the refund once

#### Scenario: Capture-completed event delivered twice

- **WHEN** PayPal delivers the same capture-completed event twice
- **THEN** the order is paid once and its payment activity is recorded once

### Requirement: Starting payment for an order is idempotent

The system SHALL send the gateway an idempotency key, derived from the order,
when it creates a payment for an order, so that starting payment again for the
same order does not create a second payment with the gateway.

#### Scenario: Opening an unpaid order twice

- **WHEN** payment is started twice for the same unpaid order
- **THEN** both create-payment requests carry the same idempotency key

#### Scenario: Two different orders

- **WHEN** payment is started for two different orders
- **THEN** the create-payment requests carry different idempotency keys

### Requirement: Webhook handling is atomic and failures are logged

The system SHALL apply all order changes caused by one webhook event in a single
transaction, so a failure part-way leaves the order unchanged. A webhook that
fails while handling SHALL be logged with its event type, event id and error
message, SHALL NOT log secrets or the full payload, and SHALL be rejected so the
gateway redelivers it.

#### Scenario: Handling fails part-way

- **WHEN** an order update inside a verified webhook throws after an earlier
  update in the same event succeeded
- **THEN** none of that event's order changes remain
- **AND** the failure is logged with the event type and event id
- **AND** the webhook request fails

#### Scenario: Unhandled event types

- **WHEN** a verified webhook carries an event type the store does not handle
- **THEN** the request succeeds and no order is changed
