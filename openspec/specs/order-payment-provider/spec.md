# order-payment-provider Specification

## Purpose

Preserves a historical record of which payment provider and shipping method were used on an order — and the provider's fee, in both transaction and base currency — independent of later changes to the live provider/shipping configuration.

## Requirements

### Requirement: Payment provider snapshot captured at order creation
The system SHALL capture the payment provider's id, name, icon, and offline/online status at the moment an order is created, and persist that snapshot on the order independently of the live provider record.

#### Scenario: Order placed with an offline provider
- **WHEN** an order is created with an offline payment provider selected
- **THEN** the order stores that provider's id, name, icon, and `is_offline: true` as it existed at that moment

#### Scenario: Order placed with an online provider
- **WHEN** an order is created with an online payment gateway (e.g. PayPal, Stripe)
- **THEN** the order stores that gateway's id, name, icon, and `is_offline: false` as it existed at that moment

#### Scenario: Offline provider later renamed or deleted
- **WHEN** an order's offline payment provider is renamed or removed from the store's settings after the order was placed
- **THEN** the order's stored snapshot continues to reflect the provider's name and icon as they were at order creation, unaffected by the later change

### Requirement: Order API exposes the payment provider snapshot
The order details and order list API responses SHALL include the snapshotted provider id, name, icon, and offline/online status, sourced from the order's own stored snapshot rather than a live registry lookup.

#### Scenario: Fetching order details
- **WHEN** a client requests an order's details
- **THEN** the response includes the payment provider's id, name, icon, and offline/online status as captured at order creation

#### Scenario: Listing orders
- **WHEN** a client requests the orders list
- **THEN** each order in the response includes the payment provider's name, icon, and offline/online status as captured at order creation

### Requirement: Shipping method snapshot captured at order creation
The system SHALL capture the shipping method's id, name, and type at the moment an order is created, and persist that snapshot on the order independently of the live shipping settings.

#### Scenario: Order placed with a shipping method selected
- **WHEN** an order is created with a shipping method selected from an enabled shipping zone
- **THEN** the order stores that method's id, name, and type as they existed at that moment

#### Scenario: Shipping method later renamed or removed
- **WHEN** an order's shipping method is renamed or removed from the store's shipping settings after the order was placed
- **THEN** the order's stored snapshot continues to reflect the method's name and type as they were at order creation, unaffected by the later change

### Requirement: Order API exposes the shipping method snapshot
The order details and order list API responses SHALL include the snapshotted shipping method name and type, sourced from the order's own stored snapshot rather than a live settings lookup.

#### Scenario: Fetching order details
- **WHEN** a client requests an order's details
- **THEN** the response includes the shipping method's name and type as captured at order creation

#### Scenario: Listing orders
- **WHEN** a client requests the orders list
- **THEN** each order in the response includes the shipping method's name as captured at order creation

### Requirement: Base-currency payment provider fee is derived and stored
When a payment provider fee is recorded on an order in the order's transaction currency, the system SHALL also derive and store the equivalent fee in the store's base currency, using the exchange rate captured on that order at creation time.

#### Scenario: Gateway reports a transaction fee
- **WHEN** a payment gateway reports its fee for an order's transaction
- **THEN** the order stores the fee in the transaction currency and the equivalent fee in the store's base currency, computed using that order's own stored exchange rate

#### Scenario: Fee reported in a currency other than the order's invoiced currency
- **WHEN** a payment gateway reports a fee alongside a currency that does not match the order's invoiced currency
- **THEN** the system does not store that fee as the order's payment provider fee
