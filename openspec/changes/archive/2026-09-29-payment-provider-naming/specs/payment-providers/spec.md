## Purpose

Defines the payment provider contract: how the store distinguishes online
(gateway-backed) from offline (manual) payments, how payment addons register
themselves, what REST surface each kind is served on, where offline providers
are persisted, and how a placed order records which provider took the payment.

## ADDED Requirements

### Requirement: Payment providers are classified as online or offline

The system SHALL model every way of taking payment as a payment provider, and
SHALL classify each provider as either **online** (payment is captured through
an external gateway) or **offline** (payment is arranged manually outside the
store, such as cash on delivery or bank transfer).

The classification SHALL be exposed on every payment payload as the boolean
field `is_offline`, where `true` means offline and `false` means online. The
field name `is_manual` SHALL NOT appear in any payment payload.

#### Scenario: Reading an online provider

- **WHEN** a client reads a provider served from the online payments endpoints
- **THEN** the payload includes `is_offline` with the value `false`
- **AND** the payload does not include a field named `is_manual`

#### Scenario: Reading an offline provider

- **WHEN** a client reads a provider served from the offline payments endpoints
- **THEN** the payload includes `is_offline` with the value `true`

#### Scenario: Order-level manual flag is unaffected

- **WHEN** a client reads an order that was created by an administrator
- **THEN** the order still reports its own `is_manual` field, which denotes an
  admin-created order and is unrelated to provider classification

### Requirement: Payment addons register through a single provider hook

The system SHALL expose one extension point through which a plugin can
contribute additional payment providers: the WordPress filter
`kirki_ecommerce_payment_providers`. A contributed provider SHALL be an
instance of the payment provider base type, and SHALL be registered under the
provider id it reports.

The filter name `kirki_ecommerce_all_payment_gateways` SHALL NOT be honored.

#### Scenario: An addon contributes a provider

- **WHEN** an active plugin appends a payment provider instance to the
  `kirki_ecommerce_payment_providers` filter
- **THEN** that provider is present in the store's provider registry and is
  resolvable by its id

#### Scenario: An addon uses the retired hook name

- **WHEN** a plugin appends a provider to `kirki_ecommerce_all_payment_gateways`
- **THEN** that provider is not registered, because the retired filter is no
  longer applied

#### Scenario: Bundled providers are registered without an addon

- **WHEN** the store boots with no payment addon plugins active
- **THEN** the bundled PayPal provider and every configured offline provider
  are present in the registry

### Requirement: Online and offline providers are served on separate endpoints

The system SHALL serve online providers under `/online-payments` and offline
providers under `/offline-payments`. The paths `/payment-gateways` and
`/payment-methods` SHALL NOT be served.

Online payments SHALL support listing, listing installable providers,
installing a provider, reading one provider, updating one provider's settings,
and toggling one provider's enabled state. Offline payments SHALL support
listing, reading, creating, updating, and deleting.

An endpoint SHALL only return providers of its own kind: `/online-payments`
SHALL NOT return offline providers, and `/offline-payments` SHALL NOT return
online providers.

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

- **WHEN** a client requests `GET /payment-gateways` or `GET /payment-methods`
- **THEN** no route matches the request

### Requirement: Provider webhooks are addressed by provider id

The system SHALL accept gateway callbacks at a webhook endpoint addressed by
the provider's id, and SHALL dispatch the callback to that provider.

#### Scenario: A gateway posts a webhook

- **WHEN** an external gateway posts to the payment webhook endpoint for the
  provider id `stripe`
- **THEN** the request is dispatched to the registered `stripe` provider

### Requirement: Offline providers are persisted under an offline-named key

The system SHALL persist the configured offline providers in the `payment`
settings option under the key `offline_payments`. The key `payment_gateways`
SHALL NOT be read or written.

Offline provider entries SHALL be written by, and readable through, both the
offline payments endpoints and the payment settings endpoint, using the same
field names in both.

#### Scenario: Creating an offline provider

- **WHEN** a client creates an offline provider through `POST /offline-payments`
- **THEN** the new entry appears in the `offline_payments` list returned by
  `GET /settings/payment`

#### Scenario: Reading payment settings

- **WHEN** a client requests `GET /settings/payment`
- **THEN** the response body contains an `offline_payments` array
- **AND** it does not contain a `payment_gateways` key

#### Scenario: Data saved under the retired key

- **WHEN** the `payment` settings option contains only a legacy
  `payment_gateways` list and no `offline_payments` list
- **THEN** the store reports no configured offline providers, because the
  retired key is not read

### Requirement: An order records the provider that took payment

The system SHALL record on each order the id of the payment provider used, in
a single field named `payment_provider`, and SHALL expose that field under the
same name in the order API. An order SHALL NOT carry a second, duplicate
provider field.

Any payment processing fee charged by the provider SHALL be recorded as
`invoiced_payment_provider_fee`.

#### Scenario: Placing an order

- **WHEN** an order is placed selecting a provider
- **THEN** the stored order's `payment_provider` is that provider's id
- **AND** the order carries no `payment_method` or `payment_gateway` field

#### Scenario: Refunding an order

- **WHEN** a refund is issued for an order
- **THEN** the provider named by the order's `payment_provider` is resolved
  from the registry and asked to process the refund

#### Scenario: Sorting orders by provider

- **WHEN** a client lists orders sorted by `payment_provider`
- **THEN** the request is accepted and the results are ordered by that field

### Requirement: Unavailable providers are listed as coming soon

The system SHALL report, for each installable online provider, whether it is
available to install (`is_available`) and whether it is already registered
(`is_installed`). A provider that is not yet available SHALL still be listed,
and the admin UI SHALL present it as forthcoming rather than offering to add
it.

#### Scenario: Listing installable providers

- **WHEN** a client requests the installable online providers
- **THEN** every known provider is listed, each reporting `is_available` and
  `is_installed`

#### Scenario: An unavailable provider in the admin UI

- **WHEN** the available-providers dialog renders a provider whose
  `is_available` is `false` and which is not installed
- **THEN** a "Coming Soon" indicator is shown in place of the add control

#### Scenario: An installed provider in the admin UI

- **WHEN** the available-providers dialog renders a provider whose
  `is_installed` is `true`
- **THEN** an "Added" indicator is shown in place of the add control
