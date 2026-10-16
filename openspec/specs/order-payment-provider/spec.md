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

### Requirement: The provider snapshot survives gateway payment data

The system SHALL keep an order's payment provider snapshot (id, name, icon and
offline flag) intact when a gateway's payment data is later saved on the order.
The gateway's data SHALL be stored alongside the snapshot under its own key, not
in place of it.

#### Scenario: A gateway reports a completed payment

- **WHEN** a gateway webhook saves its payment data on an order that was placed
  with an online provider
- **THEN** the order still reports that provider's name, icon and offline flag
  in the order details and order list

#### Scenario: Gateway data is retained

- **WHEN** a gateway webhook saves its payment data on an order
- **THEN** that data is stored on the order under a gateway key

#### Scenario: A second gateway write

- **WHEN** a gateway saves payment data on an order twice
- **THEN** the provider snapshot is still present and the gateway key holds the
  latest data

### Requirement: The provider snapshot follows the provider used to mark an order paid
When an order is marked as paid with a payment provider that differs from the provider in the order's snapshot, the system SHALL replace the order's payment metadata with the snapshot of the new provider and set the order's payment provider to it, in the same update. The old provider's gateway data SHALL be removed.

#### Scenario: Paid with a different provider
- **WHEN** an order placed with an offline provider is marked as paid with another provider
- **THEN** the order's payment provider is the new provider
- **AND** the order details and the order list show the new provider's name, icon and offline flag

#### Scenario: Gateway data of the old provider is dropped
- **WHEN** an order that holds an online gateway's payment data is marked as paid with a different provider
- **THEN** the order keeps no gateway data of the old provider

#### Scenario: Paid with the same provider
- **WHEN** an order is marked as paid with the provider that is already in its snapshot
- **THEN** the order's payment metadata, including any gateway data, is unchanged

#### Scenario: Paid without a provider
- **WHEN** an order is marked as paid and no provider is given, as an online gateway webhook does
- **THEN** the order's payment provider and payment metadata are unchanged

#### Scenario: Manual order created without a provider
- **WHEN** a manual order that has no payment provider is marked as paid with a provider
- **THEN** the order stores that provider and a snapshot of it

### Requirement: Marking an order paid requires a registered provider
The system SHALL reject a mark-as-paid request whose payment provider id is not registered, and SHALL leave the order unchanged. A registered provider that is disabled SHALL still be accepted.

#### Scenario: Unknown provider id
- **WHEN** an order is marked as paid with a provider id that is not registered
- **THEN** the request fails with a validation error
- **AND** the order stays unpaid and its payment provider and metadata are unchanged

#### Scenario: Disabled provider
- **WHEN** an order is marked as paid with a registered provider that is disabled
- **THEN** the order is marked as paid with that provider
