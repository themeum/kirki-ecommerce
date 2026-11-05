## Purpose

Defines the MCP tools that change orders: notes, fulfillment steps, offline
payment, the order email, cancellation and manual orders. Each tool goes
through the store's order rules and the order state matrix.

## ADDED Requirements

### Requirement: Order is found by ID or number

Each order write tool, except `create-manual-order`, SHALL accept `order_id`
(integer) or `order_number` (string). One of them SHALL be sent. When no order
matches, the tool SHALL return a tool error that tells the client to check the
value or to use the find-orders tool.

#### Scenario: Order number

- **WHEN** `kirki-ecommerce-resend-order-email` is called with `order_number` `"1042"`
- **THEN** the tool previews the email for the order with number 1042

#### Scenario: Unknown order

- **WHEN** an order write tool is called with `order_id` 999999 and no such order exists
- **THEN** the tool returns a tool error and gives no token

### Requirement: Add an order note

`kirki-ecommerce-add-order-note` SHALL add a comment to the order timeline.
It SHALL accept `message` (required, 1 to 2000 characters) and
`notify_customer` (boolean, default false). When `notify_customer` is true,
the preview SHALL say that the order-note email goes to the customer's email
address, and the done change SHALL send that email with the message.

#### Scenario: Private note

- **WHEN** a confirmed call adds `message` `"Customer called, ships Monday"` with `notify_customer` false
- **THEN** the order timeline has the comment, marked as made by the AI assistant, and no email is sent

#### Scenario: Note to the customer

- **WHEN** a preview is made with `notify_customer` true
- **THEN** `changes` says that the order-note email goes to the customer's masked email address

### Requirement: Update fulfillment

`kirki-ecommerce-update-fulfillment` SHALL accept `action`, one of
`mark-as-processing`, `mark-as-shipped`, `add-tracking`, `mark-as-delivered`,
`mark-as-hold` and `resume-fulfillment`. For `add-tracking`, `carrier` and
`tracking_number` SHALL be required and `tracking_url` SHALL be optional and a
valid URL. The action SHALL be allowed by the order state matrix for the
current order status. The preview SHALL show the current and the next order
status and the customer emails that the change sends.

#### Scenario: Ship an order

- **WHEN** a preview is made with `action` `"mark-as-shipped"` for an order in `paid_processing`
- **THEN** `changes` shows the status from `paid_processing` to `paid_shipped` and the shipped email to the customer

#### Scenario: Tracking without a number

- **WHEN** `action` is `"add-tracking"` and `tracking_number` is missing
- **THEN** the tool returns a tool error that names `tracking_number`

### Requirement: Mark an order paid

`kirki-ecommerce-mark-order-paid` SHALL record the payment of an unpaid order.
It SHALL accept an optional `payment_provider`, which SHALL be the ID of a
registered payment provider. The action SHALL be allowed by the order state
matrix.

#### Scenario: Bank transfer arrived

- **WHEN** a confirmed call marks a `pending` order paid
- **THEN** the order status becomes `paid_unfulfilled` and the timeline has a payment entry marked as made by the AI assistant

#### Scenario: Unknown provider

- **WHEN** `payment_provider` is `"not-a-provider"`
- **THEN** the tool returns a tool error and the order does not change

### Requirement: Resend the order email

`kirki-ecommerce-resend-order-email` SHALL send the new-order email to the
customer again. The action SHALL be allowed by the order state matrix. The
preview SHALL show the masked email address that gets the email.

#### Scenario: Resend

- **WHEN** a confirmed call is made for a `pending` order
- **THEN** the new-order email is sent to the customer again

### Requirement: Cancel an order

`kirki-ecommerce-cancel-order` SHALL cancel an order and SHALL require
`reason` (1 to 500 characters). The action SHALL be allowed by the order state
matrix. The preview SHALL show the current and the next order status, the
reason, and that a cancelled order allows no more actions. The tool SHALL NOT
refund a payment.

#### Scenario: Cancel

- **WHEN** a confirmed call cancels a `pending` order with `reason` `"Customer asked"`
- **THEN** the order status becomes `unpaid_cancelled`, the reason is stored, and the timeline entry is marked as made by the AI assistant

#### Scenario: Already shipped

- **WHEN** a preview is made for an order whose status does not allow `cancel-order`
- **THEN** the tool returns a tool error with the store's message and gives no token

### Requirement: Create a manual order

`kirki-ecommerce-create-manual-order` SHALL create a manual order with the
same rules as the admin order form. It SHALL accept `items` (required, each
with `variant_id` and `quantity` of 1 or more), an optional `customer_id`,
the shipping address, `is_billing_same_as_shipping` (default true) and a
billing address when it is false, `shipping_method` (required), optional
`coupon_codes` and an optional `payment_provider`. The preview SHALL show
each item with its unit price and line total, the discount, shipping, tax and
order total, as the store calculates them. The done change SHALL return the
new order's ID and number. A change of a price, the stock or a coupon of the
order after the preview SHALL make the token not valid.

#### Scenario: Phone order

- **WHEN** a preview is made for 2 units of variant 31 to an address in Germany with a valid shipping method
- **THEN** `changes` shows the item, the shipping, the tax and the total, and no order is created

#### Scenario: Not enough stock

- **WHEN** an item asks for more units than the variant has and the variant does not allow back orders
- **THEN** the tool returns a tool error with the store's stock message

#### Scenario: Price changed after the preview

- **WHEN** the price of variant 31 changes after the preview and then the token is sent
- **THEN** the call returns a tool error that asks for a new preview, and no order is created
