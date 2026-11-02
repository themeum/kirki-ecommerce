# payment-method-order Specification

## Purpose

Defines the merchant-defined order of payment providers: how an administrator writes it, where it
is kept, and how the admin list and checkout apply it to offline and online providers alike.

## Requirements

### Requirement: An administrator can set the order of payment providers

The system SHALL accept `PUT /payment-methods/order` with a JSON body `{ "ids": [...] }`, where
`ids` is a list of provider IDs in the new order. The endpoint SHALL be available only to
administrators, the same as the other payment endpoints.

The request SHALL be rejected with a validation error, and the stored order SHALL NOT change, when
`ids` is missing, is not a list, contains a value that is not a string, contains the same ID more
than once, or contains an ID that matches no registered provider.

On success, the response SHALL contain every registered provider in the new order, with the same
item fields as `GET /payment-methods`.

#### Scenario: Saving a new order

- **WHEN** an administrator sends `PUT /payment-methods/order` with the IDs of all registered
  providers in a new order
- **THEN** the response reports success
- **AND** the response lists every registered provider in that order

#### Scenario: Unknown provider ID

- **WHEN** an administrator sends `PUT /payment-methods/order` with a list that contains an ID
  that matches no registered provider
- **THEN** the request fails with a validation error
- **AND** the stored order is unchanged

#### Scenario: Duplicate provider ID

- **WHEN** an administrator sends `PUT /payment-methods/order` with a list that contains the same
  ID two times
- **THEN** the request fails with a validation error
- **AND** the stored order is unchanged

#### Scenario: Missing ids

- **WHEN** an administrator sends `PUT /payment-methods/order` with no `ids` field
- **THEN** the request fails with a validation error

#### Scenario: Request without administrator access

- **WHEN** a client without administrator access sends `PUT /payment-methods/order`
- **THEN** the request is refused
- **AND** the stored order is unchanged

### Requirement: The order is persisted in the payment settings option

The system SHALL persist the provider order as a list of provider IDs under the key
`methods_order` in the `payment` settings option. Saving other payment settings, or creating,
updating, toggling or deleting a provider, SHALL NOT remove or reset the stored `methods_order`.

#### Scenario: Order survives other payment writes

- **WHEN** an administrator saves an order and then toggles, edits, or creates an offline provider
- **THEN** the stored `methods_order` still holds the saved order

#### Scenario: Order was never saved

- **WHEN** the `payment` settings option has no `methods_order` key
- **THEN** providers are listed in registration order
- **AND** no request fails because the key is missing

### Requirement: Providers are listed in the stored order

Every list of payment providers that the system returns — the combined admin listing, the
per-kind listings, and the providers offered at checkout — SHALL follow the stored order.

A provider whose ID is not in the stored order SHALL be placed after all ordered providers, in
registration order. A stored ID that matches no registered provider SHALL be ignored.

Filters that select a subset (only online, only offline, only enabled) SHALL keep the relative
order of the providers they return.

#### Scenario: Admin listing follows the stored order

- **WHEN** an administrator has saved the order `[paypal, cod]` and requests `GET /payment-methods`
- **THEN** PayPal is listed before Cash on Delivery

#### Scenario: Checkout follows the stored order

- **WHEN** the stored order puts PayPal before Cash on Delivery and both are enabled
- **THEN** checkout offers PayPal before Cash on Delivery

#### Scenario: A provider added after the order was saved

- **WHEN** an administrator creates a new offline provider after an order was saved
- **THEN** the new provider is listed after every provider in the stored order

#### Scenario: A deleted provider remains in the stored order

- **WHEN** an offline provider whose ID is in the stored order is deleted
- **THEN** listings ignore that ID
- **AND** the remaining providers keep their relative order
