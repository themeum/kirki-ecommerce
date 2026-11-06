## MODIFIED Requirements

### Requirement: Checkout accepts only registered, enabled payment providers

The system SHALL validate the `payment_provider` submitted when an order is
placed. A `payment_provider` that matches no registered provider SHALL be
rejected with a validation error, and no order SHALL be created.

For an order placed by a shopper, a registered provider that is disabled SHALL
also be rejected, so that checkout accepts exactly the providers the storefront
offers. For an order created by an administrator on a customer's behalf (a
manual order), `payment_provider` remains optional and, when given, SHALL match
a registered provider; it is not required to be enabled.

For a shopper order and a manual order, a provider that cannot accept the order
currency SHALL be rejected with a validation error that names the currency and
the accepted currencies, and no order SHALL be created. The same rule SHALL apply
to an order with a zero total.

#### Scenario: Shopper submits an unknown provider

- **WHEN** a shopper places an order with a `payment_provider` that matches no
  registered provider
- **THEN** the request fails with a validation error
- **AND** no order is created

#### Scenario: Shopper submits a disabled provider

- **WHEN** a shopper places an order with the id of a registered provider that
  is disabled
- **THEN** the request fails with a validation error
- **AND** no order is created

#### Scenario: Shopper submits an enabled provider

- **WHEN** a shopper places an order with the id of an enabled provider
- **THEN** the order is created with that provider recorded as its
  `payment_provider`

#### Scenario: Administrator creates a manual order without a provider

- **WHEN** an administrator creates a manual order with no `payment_provider`
- **THEN** the order is created

#### Scenario: Administrator creates a manual order with an unknown provider

- **WHEN** an administrator creates a manual order with a `payment_provider`
  that matches no registered provider
- **THEN** the request fails with a validation error

#### Scenario: Shopper submits a provider that cannot accept the currency

- **WHEN** a shopper places a `USD` order with a provider that accepts only `BDT`
- **THEN** the request fails with HTTP 422 and a message that names `USD` and `BDT`
- **AND** no order is created
- **AND** no call goes to the gateway

#### Scenario: Administrator names a provider that cannot accept the currency

- **WHEN** an administrator creates a manual `USD` order with a provider that
  accepts only `BDT`
- **THEN** the request fails with HTTP 422
- **AND** no order is created

#### Scenario: Administrator names an offline provider

- **WHEN** an administrator creates a manual order in any currency with an offline
  provider
- **THEN** the order is created
