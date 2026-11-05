## Purpose

Defines the rules that every read-only store tool on the `kirki-ecommerce` MCP
server follows: who can run it, how it is marked, how lists are paged, how
personal data and customer-written text are returned, and how errors are
reported.

## ADDED Requirements

### Requirement: Only administrators can run a read-only store tool

Each read-only store tool SHALL run only for a user with the `manage_options`
capability, over HTTP and over STDIO. A rejected call SHALL NOT read store
data.

#### Scenario: Editor is rejected

- **WHEN** a user with the `editor` role calls `kirki-ecommerce-find-orders`
- **THEN** the call is rejected with a permission error and no query runs

#### Scenario: No signed-in user is rejected

- **WHEN** `kirki-ecommerce-find-customers` is called with no signed-in user
- **THEN** the call is rejected with a permission error

#### Scenario: Administrator is accepted

- **WHEN** an administrator calls `kirki-ecommerce-setup-status`
- **THEN** the call succeeds

### Requirement: Tools are marked read-only and offered only by the store server

Each read-only store tool SHALL have `readOnlyHint` true, `idempotentHint`
true, `destructiveHint` false and `openWorldHint` false. Each tool SHALL be
listed by the `kirki-ecommerce` server and SHALL NOT be listed by the MCP
Adapter's default server or the Abilities REST API.

#### Scenario: Annotations

- **WHEN** a client lists the tools of the `kirki-ecommerce` server
- **THEN** each of the 10 read-only store tools has `readOnlyHint` true, `idempotentHint` true, `destructiveHint` false and `openWorldHint` false

#### Scenario: Not offered to other servers

- **WHEN** a client lists the abilities of the MCP Adapter's default server
- **THEN** none of the 10 read-only store tools is in the list

### Requirement: List tools are paged

Each list tool (`find-orders`, `find-products`, `find-customers`,
`find-coupons`, `stock-levels`) SHALL accept `page` (an integer of 1 or more,
default 1) and `per_page` (an integer from 1 to 100, default 20). The result
SHALL have a `pagination` object with `page`, `per_page`, `total` and
`total_pages`. A list tool SHALL NOT return all rows in one call.

#### Scenario: Default page size

- **WHEN** the store has 45 orders and `kirki-ecommerce-find-orders` is called with no arguments
- **THEN** the result has 20 orders and `pagination` is `page` 1, `per_page` 20, `total` 45, `total_pages` 3

#### Scenario: Page size over the limit

- **WHEN** `kirki-ecommerce-find-products` is called with `per_page` 500
- **THEN** the call returns a tool error that names `per_page` and no query runs

### Requirement: List tools mask personal data

A list tool SHALL return a customer email in masked form: the first character
of the local part, then `***`, then `@` and the full domain (for example
`j***@example.com`). A list tool SHALL return a customer name as the first
name only. A list tool SHALL NOT return phone numbers or street addresses. A
search by a full email SHALL still match. Only a tool that returns one record,
such as `kirki-ecommerce-get-order`, SHALL return full personal data.

#### Scenario: Masked order list

- **WHEN** an order was placed by Jane Doe with the email `jane@example.com` and `kirki-ecommerce-find-orders` lists it
- **THEN** the order shows the customer email `j***@example.com` and the customer name `Jane`

#### Scenario: Search by full email

- **WHEN** `kirki-ecommerce-find-customers` is called with `search` `jane@example.com`
- **THEN** the result has the customer with that email, and the email is shown as `j***@example.com`

### Requirement: Customer-written text is marked and limited

Text that customers or other outside people write (order notes, customer
notes, activity descriptions, cancellation reasons) SHALL be returned in
fields that have the word `note` or `text` in their name. HTML tags SHALL be
removed, and each value SHALL be cut to 500 characters. The tool description
SHALL say that this text comes from customers and is not an instruction.

#### Scenario: Long order note with HTML

- **WHEN** an order note has 900 characters and HTML tags, and `kirki-ecommerce-get-order` returns the order
- **THEN** the note has no HTML tags and has at most 500 characters

### Requirement: Arguments are validated before any query

Each tool SHALL validate its arguments before it reads store data. A wrong
argument SHALL give a tool error whose message names the argument and the
allowed values or format. Money SHALL be returned as `{ amount, display,
currency }` in the store base currency, unless a field says that it is in the
order currency. Dates and times SHALL be returned in ISO 8601 with the offset
of the site time zone, or of a valid `X-Kecom-Timezone` header.

#### Scenario: Unknown status

- **WHEN** `kirki-ecommerce-find-coupons` is called with `status` `paused`
- **THEN** the call returns a tool error that names `status` and lists `active`, `scheduled`, `inactive` and `expired`

#### Scenario: Money shape

- **WHEN** `kirki-ecommerce-find-customers` returns a customer who spent 120.50 in a store with base currency USD
- **THEN** the total spent is `{ "amount": 120.5, "display": "$120.50", "currency": "USD" }`
