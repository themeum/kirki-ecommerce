## ADDED Requirements

### Requirement: Viewing an order does not start a payment

The system SHALL start a gateway payment only as part of the order placement response. Rendering
an order on a storefront page, including the checkout success and failed pages, the order tracking
page, and the account order page, SHALL NOT call the gateway and SHALL NOT change the payment data
stored on the order.

#### Scenario: Order placement starts the payment

- **WHEN** a shopper places an order with an online provider
- **THEN** the response includes the payment next step from that provider

#### Scenario: Customer opens the order tracking page

- **WHEN** a customer opens the tracking page of an unpaid order
- **THEN** no call goes to the gateway
- **AND** the payment data stored on the order does not change

#### Scenario: Customer reaches the failed page

- **WHEN** a customer reaches the checkout failed page for an unpaid order
- **THEN** no call goes to the gateway
- **AND** the payment data stored on the order does not change

#### Scenario: Customer opens the account order page

- **WHEN** a customer opens the account page of an unpaid order
- **THEN** no call goes to the gateway
