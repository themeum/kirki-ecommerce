## Purpose

Defines the MCP tools that repair the store pages and that change one
transactional email notification. These tools change store setup, not
orders or the catalog.

## ADDED Requirements

### Requirement: Fix store pages

`kirki-ecommerce-fix-store-pages` SHALL do what the admin Fix action does
for the store pages (shop, cart, checkout, account and the other pages in the
store page settings): it SHALL create and link a page for each setting that
has no page, and SHALL publish each linked page that is not published. It
SHALL take no arguments other than `confirmation_token`. The preview SHALL
list each page that it will create and each page that it will publish. When
all store pages exist and are published, the tool SHALL return a result that
says so, and SHALL give no token.

#### Scenario: Checkout page deleted

- **WHEN** the checkout page was deleted and a confirmed call is made
- **THEN** a checkout page exists and is linked in the store settings, and the result lists it

#### Scenario: Draft cart page

- **WHEN** the linked cart page is a draft and a confirmed call is made
- **THEN** the cart page is published, and no new cart page is created

#### Scenario: Nothing missing

- **WHEN** all store pages exist and are published
- **THEN** the tool returns a result that says no page is missing, without a token

### Requirement: Update one email notification

`kirki-ecommerce-update-email-notification` SHALL require `recipient`
(`customer` or `admin`), `group` and `key` of one notification, for example
`customer`, `order_notifications`, `order_shipped`. It SHALL change only
`is_enabled`, `subject` (1 to 200 characters) and `heading` (1 to 200
characters), and SHALL require at least one of them. The message body, the
template and the other notifications SHALL NOT change. An unknown
notification SHALL be rejected with a tool error that lists the valid
notifications. The preview SHALL show the current and the new value of each
field that changes.

#### Scenario: Turn off the on-hold email

- **WHEN** a confirmed call sends `recipient` `"customer"`, `group` `"order_notifications"`, `key` `"order_on_hold"` and `is_enabled` false
- **THEN** that email is off, and the other email notifications do not change

#### Scenario: Unknown notification

- **WHEN** `key` is `"order_lost"`
- **THEN** the tool returns a tool error that lists the valid notifications
