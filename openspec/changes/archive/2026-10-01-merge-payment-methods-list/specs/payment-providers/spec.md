## MODIFIED Requirements

### Requirement: Online and offline providers are served on separate endpoints

The system SHALL serve online providers under `/online-payments` and offline
providers under `/offline-payments`. The path `/payment-gateways` SHALL NOT be
served.

Online payments SHALL support listing, listing installable providers,
installing a provider, reading one provider, updating one provider's settings,
and toggling one provider's enabled state. Offline payments SHALL support
listing, reading, creating, updating, and deleting.

An endpoint SHALL only return providers of its own kind: `/online-payments`
SHALL NOT return offline providers, and `/offline-payments` SHALL NOT return
online providers.

The system SHALL additionally serve a read-only combined listing at
`/payment-methods` that returns providers of both kinds. `/payment-methods`
SHALL support listing only; reading, creating, updating, deleting, enabling and
installing SHALL remain on the per-kind endpoints.

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
- **AND** each item includes `id`, `name`, `icon`, `icon_media`, `is_enabled`,
  `is_offline` and `description`

#### Scenario: Combined listing is read-only

- **WHEN** a client sends `POST`, `PUT`, `PATCH` or `DELETE` to
  `/payment-methods`
- **THEN** no route matches the request
