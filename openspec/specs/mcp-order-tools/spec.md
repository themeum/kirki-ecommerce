# mcp-order-tools Specification

## Purpose

Defines the MCP tools that find orders and show one order in full, so that an
AI client can answer "which orders are late?" or "what happened to order
1042?" without the admin screens.

## Requirements

### Requirement: Find orders tool

`kirki-ecommerce-find-orders` SHALL accept `search` (order number, customer
email or shipping name, as in the admin order list), `status` (the admin list
statuses), `fulfillment_status`, `payment_status`, `customer_id`,
`shipping_method`, `from` and `to` (`Y-m-d`, the creation date), `sort_by`
(`created_at` or `invoiced_total`, default `created_at`), `sort_order` (`asc`
or `desc`, default `desc`), `page` and `per_page`. Each order SHALL have its
ID, order number, creation date, order status, fulfillment status, payment
status, total with its currency, item count, and masked customer data. The
`kirki-ecommerce` server SHALL list the tool.

#### Scenario: Unfulfilled orders

- **WHEN** the store has 3 unfulfilled and 2 delivered orders and the tool is called with `fulfillment_status` `unfulfilled`
- **THEN** the result has the 3 unfulfilled orders, newest first

#### Scenario: Search by order number

- **WHEN** the tool is called with `search` set to an existing order number
- **THEN** the result has that order

#### Scenario: Unknown status

- **WHEN** the tool is called with `status` `sent`
- **THEN** the call returns a tool error that names `status` and lists the allowed values

### Requirement: Get order tool

`kirki-ecommerce-get-order` SHALL need either `order_id` or `order_number`.
It SHALL return the full order: the statuses, dates, items (product name,
variant name, SKU, quantity, prices), coupons, tax lines, shipping method,
tracking data, refunds, totals in the order currency and in the base
currency, the customer contact data, and the shipping and billing addresses.
When `include_activity` is true, it SHALL also return the order timeline,
newest first, at most 50 entries. The `kirki-ecommerce` server SHALL list the
tool.

#### Scenario: Order by number

- **WHEN** the tool is called with an existing `order_number`
- **THEN** the result has the order with its items, totals and full customer email

#### Scenario: Order with timeline

- **WHEN** the tool is called with `include_activity` true for an order that has 3 timeline entries
- **THEN** the result has the 3 entries, newest first

#### Scenario: Order not found

- **WHEN** the tool is called with an `order_id` that does not exist
- **THEN** the call returns a tool error that says the order was not found

#### Scenario: No identifier

- **WHEN** the tool is called with neither `order_id` nor `order_number`
- **THEN** the call returns a tool error that names `order_id` and `order_number`
