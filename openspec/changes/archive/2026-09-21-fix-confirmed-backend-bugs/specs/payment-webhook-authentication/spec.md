## Purpose

Guarantees that a payment webhook can only change an order when the payment provider itself sent it, so a forged request cannot mark an order as paid or refunded.

## ADDED Requirements

### Requirement: Webhooks are verified with the provider before they change any order

The store SHALL verify every incoming PayPal webhook with PayPal, using the request's signature headers and the store's configured Webhook ID, before acting on its contents. A webhook that is not verified SHALL be rejected with a client error and SHALL NOT change any order, payment status, transaction ID or fee.

#### Scenario: Genuine webhook is processed

- **WHEN** PayPal sends a `PAYMENT.CAPTURE.COMPLETED` webhook with valid signature headers for an unpaid order
- **THEN** the webhook is verified with PayPal
- **AND** the order is marked as paid

#### Scenario: Forged webhook is rejected

- **WHEN** a request to the PayPal webhook URL carries a well-formed payload naming an existing order but no valid PayPal signature
- **THEN** the request is rejected with a client error
- **AND** the order's payment status is unchanged

#### Scenario: Signature headers are missing

- **WHEN** a request to the PayPal webhook URL has none of the PayPal transmission headers
- **THEN** the request is rejected with a client error
- **AND** no order is changed

#### Scenario: Webhook ID is not configured

- **WHEN** PayPal is enabled but its Webhook ID setting is empty and a webhook arrives
- **THEN** the request is rejected with a client error
- **AND** no order is changed

#### Scenario: PayPal cannot be reached for verification

- **WHEN** the verification call to PayPal fails or returns anything other than a success status
- **THEN** the request is rejected
- **AND** no order is changed
