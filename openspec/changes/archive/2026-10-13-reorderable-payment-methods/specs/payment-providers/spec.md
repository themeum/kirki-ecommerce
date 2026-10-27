## MODIFIED Requirements

### Requirement: Online and offline providers are served on separate endpoints

The system SHALL serve online providers under `/online-payments` and offline
providers under `/offline-payments`. The path `/payment-gateways` SHALL NOT be
served.

Online payments SHALL support listing, listing installable providers,
installing a provider, reading one provider, updating one provider's settings,
and toggling one provider's enabled state. Offline payments SHALL support
listing, reading, creating, updating, deleting, and toggling one provider's
enabled state.

Toggling the enabled state of a provider, online or offline, SHALL accept only
the new `is_enabled` value and SHALL NOT require, or alter, any other field of
the provider.

An endpoint SHALL only return providers of its own kind: `/online-payments`
SHALL NOT return offline providers, and `/offline-payments` SHALL NOT return
online providers.

The system SHALL additionally serve a combined listing at `/payment-methods`
that returns providers of both kinds in the stored provider order. The
`/payment-methods` path itself SHALL support listing only. The combined surface
SHALL additionally accept a provider order write at `/payment-methods/order`
(see the `payment-method-order` capability). Reading, creating, updating,
deleting, enabling and installing a provider SHALL remain on the per-kind
endpoints.

#### Scenario: Listing online providers

- **WHEN** a client requests `GET /online-payments`
- **THEN** the response contains only providers whose `is_offline` is `false`

#### Scenario: Listing offline providers

- **WHEN** a client requests `GET /offline-payments`
- **THEN** the response contains only providers whose `is_offline` is `true`

#### Scenario: Requesting an offline provider by id from the online endpoint

- **WHEN** a client requests `GET /online-payments/{id}` with the id of an
  offline provider
- **THEN** the request fails with a not-found response

#### Scenario: Retired paths are gone

- **WHEN** a client requests `GET /payment-gateways`
- **THEN** no route matches the request

#### Scenario: Listing all payment methods

- **WHEN** a client requests `GET /payment-methods`
- **THEN** the response contains every registered provider, both those whose
  `is_offline` is `false` and those whose `is_offline` is `true`
- **AND** the providers are in the stored provider order
- **AND** each item includes `id`, `name`, `icon`, `icon_media`, `is_enabled`,
  `is_offline` and `description`

#### Scenario: Combined listing path is read-only

- **WHEN** a client sends `POST`, `PUT`, `PATCH` or `DELETE` to
  `/payment-methods`
- **THEN** no route matches the request

#### Scenario: Writing the provider order

- **WHEN** an administrator sends `PUT /payment-methods/order` with a valid
  list of provider IDs
- **THEN** the request is handled and the stored provider order changes

#### Scenario: Disabling an offline provider

- **WHEN** an administrator sends `PATCH /offline-payments/{id}` with
  `{ "is_enabled": false }` for an existing offline provider
- **THEN** the provider's `is_enabled` becomes `false`
- **AND** its name, icon, instructions and configuration are unchanged
- **AND** the response reports success

#### Scenario: Enabling an offline provider

- **WHEN** an administrator sends `PATCH /offline-payments/{id}` with
  `{ "is_enabled": true }` for an existing offline provider
- **THEN** the provider's `is_enabled` becomes `true`
- **AND** the provider is offered to shoppers at checkout

#### Scenario: Toggling an unknown offline provider

- **WHEN** an administrator sends `PATCH /offline-payments/{id}` with an id
  that matches no offline provider
- **THEN** the request fails with a not-found response and no provider changes

#### Scenario: Toggling an online provider id on the offline endpoint

- **WHEN** an administrator sends `PATCH /offline-payments/{id}` with the id of
  an online provider
- **THEN** the request fails with a not-found response
