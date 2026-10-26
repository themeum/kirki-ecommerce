# mcp-store-resources Specification

## Purpose

Defines the read-only MCP resources of the store server: fixed, store-wide
context that an assistant can attach before it answers, what each resource
contains, and the data that a resource must never contain.

## Requirements

### Requirement: Only administrators can read a store resource

Each store resource SHALL be readable only by a user with the
`manage_options` capability. A read by any other user SHALL fail with a
permission error and SHALL NOT return store data.

#### Scenario: Administrator reads a resource

- **WHEN** an administrator reads `kecom://store/profile`
- **THEN** the read succeeds and returns one JSON content entry with the URI `kecom://store/profile`

#### Scenario: Signed-in customer is rejected

- **WHEN** a user without `manage_options` reads `kecom://store/currencies`
- **THEN** the read fails with a permission error

### Requirement: Resources have fixed URIs and return JSON

The server SHALL offer exactly these 7 resources: `kecom://store/profile`,
`kecom://store/order-lifecycle`, `kecom://store/analytics-definitions`,
`kecom://store/checkout-and-payments`, `kecom://store/tax-and-shipping`,
`kecom://store/currencies` and `kecom://catalog/structure`. Each resource
SHALL return one content entry with the MIME type `application/json`. Each
resource SHALL have a title and a description that tells what it contains.
The profile and the analytics definitions SHALL have the audience
`assistant` and a priority of 1. Each resource SHALL read the data when the
client reads it, so that the content is never older than the read.

#### Scenario: Content reflects a settings change

- **WHEN** the merchant changes the store name and a client then reads `kecom://store/profile`
- **THEN** the content has the new store name

### Requirement: Resources never contain secrets or customer data

A resource SHALL NOT contain payment provider credentials, exchange rate API
keys or configuration, webhook secrets, or any field of a customer or an
order. A resource SHALL include only the fields that this specification
names. A new settings field SHALL NOT appear in a resource until a
specification names it.

#### Scenario: Currency API key is stored

- **WHEN** the currency settings hold an exchange rate API key and a client reads `kecom://store/currencies`
- **THEN** the content has no `api_configs` field and no key value

#### Scenario: Online payment provider has credentials

- **WHEN** an enabled online payment provider has stored credentials and a client reads `kecom://store/checkout-and-payments`
- **THEN** the provider shows only its id, name, enabled state and whether it is offline

### Requirement: Store profile

`kecom://store/profile` SHALL contain the store name, store email, store
phone, store address, store tax ID, industry, the selling location type and
selling countries, the base currency code, the site time zone name, the order
number prefix and suffix, and the invoice number prefix, suffix and year
rule. Empty settings SHALL be `null`.

#### Scenario: Store with no address

- **WHEN** the merchant has not entered a store address and a client reads the profile
- **THEN** each address field is `null` and the other fields are present

### Requirement: Order lifecycle

`kecom://store/order-lifecycle` SHALL list each order status of the order
state matrix with its fulfillment status, payment status, allowed
fulfillment, payment and order actions, and the status that each action
leads to. It SHALL list, for each order action that sends an email, the
email template and whether that template is enabled. It SHALL state that
refund statuses are not part of the matrix.

#### Scenario: Shipped email is turned off

- **WHEN** the merchant turned off the customer "Order shipped" email and a client reads the lifecycle
- **THEN** the `mark-as-shipped` action shows the "Order shipped" template as disabled

#### Scenario: Allowed actions for a pending order

- **WHEN** a client reads the lifecycle
- **THEN** the `pending` status lists `mark-as-processing`, `mark-as-paid`, `cancel-order` and `resend-order-email` as its actions

### Requirement: Analytics definitions

`kecom://store/analytics-definitions` SHALL describe how the Analytics page
and the analytics tools count: sales are dated by the paid time, placed
orders by the created time, returns by completed refunds, failed orders are
never counted, and a customer is matched by customer, then email. It SHALL
list the range presets, the comparisons, the default range, the granularity
rule, the top-N maximum, and the time zone rule. It SHALL state that the
Home page's net sales is calculated in a different way.

#### Scenario: Assistant reads the presets

- **WHEN** a client reads the analytics definitions
- **THEN** the content lists the same range presets and comparisons that the analytics tools accept

### Requirement: Checkout and payments

`kecom://store/checkout-and-payments` SHALL contain whether guest checkout is
allowed, the checkout field rules (address line, phone, company name, company
ID and VAT ID), whether the coupon field and the customer note show, the
payment methods in the merchant's order with id, name, enabled state and
online or offline, and the legal consents with their text (tags removed),
method, locations and enabled state.

#### Scenario: Disabled payment method

- **WHEN** a payment method is turned off and a client reads the resource
- **THEN** the method is in the list with its enabled state `false`

### Requirement: Tax and shipping

`kecom://store/tax-and-shipping` SHALL contain whether tax calculation is on,
whether prices include tax, whether shipping is taxed, the tax regions with
their rates, and the shipping zones with their regions, enabled state and
methods. Each method SHALL show its name, type, enabled state, base amount and
free-shipping minimum as money values with amount, display text and currency
code.

#### Scenario: Store with no shipping zones

- **WHEN** the store has no shipping zone and a client reads the resource
- **THEN** the content has an empty zone list and the tax fields

### Requirement: Currencies

`kecom://store/currencies` SHALL contain the base currency code, the active
currencies with code, name, symbol and exchange rate, whether the automatic
rate update is on, the rate provider name, the last and next sync times in
ISO 8601, and the last sync error message when there is one.

#### Scenario: Rates were never synced

- **WHEN** the rates have never been synced and a client reads the resource
- **THEN** the last sync time is `null`

### Requirement: Catalog structure

`kecom://catalog/structure` SHALL contain the category tree with each
category's id, name, parent and product count, the brands, collections and
tags with their id, name and product count, and the attributes with their id,
name and value names. Each list SHALL hold at most 200 entries. When a
list has more, the content SHALL give the full count and mark the list as
cut, and the entries with the most products SHALL be kept.

#### Scenario: Store with 350 tags

- **WHEN** the store has 350 tags and a client reads the catalog structure
- **THEN** the tag list has 200 entries, the full count is 350, and the list is marked as cut
