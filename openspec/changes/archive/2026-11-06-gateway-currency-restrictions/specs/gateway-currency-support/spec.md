## Purpose

Defines how an online payment gateway declares the currencies it can accept, and how
checkout prevents a customer from choosing a gateway that cannot accept the paying currency.

## ADDED Requirements

### Requirement: A gateway can declare the currencies it can accept

The system SHALL let a payment provider declare a list of ISO currency codes that it can accept.
An empty list SHALL mean no currency restriction. A provider that declares nothing, and every
offline provider, SHALL accept all currencies. The system SHALL compare currency codes without
regard to letter case.

A declared list MAY be an upper limit. A currency in the list can still fail for one merchant
account, but a currency outside the list SHALL be treated as not accepted.

#### Scenario: Provider with a declared list

- **WHEN** a provider declares `BDT` and the paying currency is `usd`
- **THEN** the provider does not accept the currency

#### Scenario: Code in a different letter case

- **WHEN** a provider declares `BDT` and the paying currency is `bdt`
- **THEN** the provider accepts the currency

#### Scenario: Provider with no declaration

- **WHEN** a provider declares no currencies
- **THEN** the provider accepts every currency

### Requirement: Built-in gateways declare their published currencies

PayFast SHALL declare `ZAR`, and PayMongo SHALL declare `PHP`. PayPal SHALL declare the currency
codes in the PayPal currency reference. A gateway whose accepted currencies depend on the merchant
account, and that has no account list available to the store, SHALL declare no currencies.

#### Scenario: PayPal and an unlisted currency

- **WHEN** the paying currency is `BDT`
- **THEN** PayPal does not accept the currency

#### Scenario: PayPal and a listed currency

- **WHEN** the paying currency is `USD`
- **THEN** PayPal accepts the currency

#### Scenario: Gateway that depends on the merchant account

- **WHEN** the paying currency is `BDT`
- **THEN** Stripe is listed at checkout
- **AND** the gateway itself can still reject the payment

### Requirement: Authorize.net uses the merchant account list without blocking on an outage

Authorize.net SHALL declare the currencies enabled on the merchant account. The system SHALL reuse
a successful list for 12 hours for one set of credentials and one environment. When the list cannot
be read, the system SHALL treat Authorize.net as accepting all currencies, and SHALL NOT repeat the
lookup for 5 minutes. The currency check when payment starts SHALL stay in place.

#### Scenario: List is cached

- **WHEN** two customers open checkout within 12 hours of a successful lookup
- **THEN** one lookup goes to Authorize.net

#### Scenario: Lookup fails

- **WHEN** the lookup fails and a customer opens checkout
- **THEN** Authorize.net stays enabled
- **AND** a customer who opens checkout within the next 5 minutes causes no new lookup

#### Scenario: Credentials are not configured

- **WHEN** Authorize.net has no saved credentials
- **THEN** no lookup goes to Authorize.net

### Requirement: Checkout hides a gateway that cannot accept the paying currency

The checkout page SHALL NOT list a gateway that cannot accept the paying currency. The page SHALL
pre-select the first listed gateway.

#### Scenario: One gateway is restricted

- **WHEN** the paying currency is `USD`, and the first enabled gateway accepts only `BDT`
- **THEN** that gateway is not listed
- **AND** the first gateway that accepts `USD` is selected

#### Scenario: Customer changes currency

- **WHEN** the customer switches the store to `BDT` and the checkout page reloads
- **THEN** the gateway that accepts only `BDT` is listed

### Requirement: Checkout explains when the currency leaves no payment method

When enabled gateways exist but none can accept the paying currency, the checkout page SHALL say that
no payment method is available for that currency. When another active store currency can use an
enabled gateway, the message SHALL name that currency. It SHALL name at most three currencies, with
the base currency first, and then the store order. The message SHALL be text only. When the store has
no enabled gateway, the page SHALL show the existing "No payment methods found!" message.

#### Scenario: Another currency has a payment method

- **WHEN** the paying currency is `USD`, the only enabled gateway accepts only `BDT`, and `BDT` is an
  active store currency
- **THEN** the page shows "No payment method is available for USD. Switch to BDT to complete your
  order."

#### Scenario: Several currencies have a payment method

- **WHEN** the paying currency is `USD`, and `BDT` and `ZAR` are active store currencies that can use
  an enabled gateway
- **THEN** the page shows "No payment method is available for USD. Switch to BDT or ZAR to complete
  your order."

#### Scenario: No other currency has a payment method

- **WHEN** no active store currency can use an enabled gateway
- **THEN** the page shows "No payment method is available for USD."

#### Scenario: A disabled gateway accepts another currency

- **WHEN** the only gateway that accepts `BDT` is disabled
- **THEN** the message does not suggest `BDT`

#### Scenario: Store has no enabled gateway

- **WHEN** the store has no enabled gateway
- **THEN** the page shows "No payment methods found!"

### Requirement: The client does not submit an order with no payment method

The checkout client SHALL NOT send an order request when the page lists no gateway. It SHALL show an
error in the payment section.

#### Scenario: No gateway is listed

- **WHEN** the page lists no gateway and the customer selects Place Order
- **THEN** no order request is sent
- **AND** the payment section shows an error

### Requirement: Payment settings report currency support for each gateway

The payment settings list SHALL compare each installed gateway with a known currency list against the
active store currencies, whether the gateway is enabled or not. The list SHALL show "Unsupported" when
no active currency can use the gateway, and "Limited" when only some can. Each badge SHALL have an info
icon with a tooltip that gives the reason. A gateway with no known list SHALL show no badge. A badge
SHALL NOT stop a merchant from enabling the gateway.

#### Scenario: No active currency can use the gateway

- **WHEN** the active currencies are `USD` and `EUR`, and a gateway accepts only `BDT`
- **THEN** the gateway shows "Unsupported"
- **AND** its tooltip says that the gateway accepts only `BDT`, that no active currency can use it, and
  that the merchant can add `BDT` in the currency settings

#### Scenario: Some active currencies can use the gateway

- **WHEN** the active currencies are `USD` and `BDT`, and a gateway accepts only `BDT`
- **THEN** the gateway shows "Limited"
- **AND** its tooltip says that customers who pay in `USD` cannot see the gateway

#### Scenario: All active currencies can use the gateway

- **WHEN** a gateway accepts every active currency
- **THEN** the gateway shows no badge

#### Scenario: Gateway with no known list

- **WHEN** a gateway declares no currencies, or its currency lookup failed
- **THEN** the gateway shows no badge

#### Scenario: Merchant enables an unsupported gateway

- **WHEN** a merchant enables a gateway that shows "Unsupported"
- **THEN** the gateway becomes enabled
