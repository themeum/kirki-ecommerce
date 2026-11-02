## Purpose

Guarantees that the refunds of one order never add up to more than the refundable total, even when refund requests arrive at the same time.

## ADDED Requirements

### Requirement: Concurrent refunds never exceed the refundable total
When a refund is requested, the system SHALL calculate the refundable amount from all pending and completed refunds of the order at the moment the refund is recorded. When two refund requests for one order run at the same time, the system MUST make them run one after the other, so the second request sees the first one.

#### Scenario: Two full refund requests at the same time
- **WHEN** an order has a refundable amount of 100 and two requests each ask to refund 100 at the same time
- **THEN** exactly one refund is recorded, the other request fails with the "Refund amount exceeds refundable amount" error, and the payment gateway receives one refund request

#### Scenario: Two partial refunds that fit together
- **WHEN** an order has a refundable amount of 100 and two requests each ask to refund 40 at the same time
- **THEN** both refunds are recorded and the remaining refundable amount is 20

#### Scenario: Two partial refunds that do not fit together
- **WHEN** an order has a refundable amount of 100 and two requests each ask to refund 60 at the same time
- **THEN** one refund is recorded, the other fails with the refundable amount error, and the total refunded is 60

#### Scenario: A failed gateway call leaves no refund
- **WHEN** the payment gateway rejects the refund request
- **THEN** no refund record remains, and the refundable amount is the same as before the request
