## Purpose

Defines one shared `order_notes` field on orders and carts, used by both the merchant and the customer, and the admin screens that create and edit it.

## ADDED Requirements

### Requirement: Order has a single notes field
The system SHALL store one nullable text field `order_notes` on every order. The system SHALL NOT expose `customer_notes` or `admin_notes` on orders in any request or response.

#### Scenario: Order created with a note
- **WHEN** an order is created with `order_notes` set to a text value
- **THEN** the stored order has that `order_notes` value
- **AND** the order response contains `order_notes` and does not contain `customer_notes` or `admin_notes`

#### Scenario: Order created without a note
- **WHEN** an order is created without `order_notes`
- **THEN** the order's `order_notes` is null

#### Scenario: Old field names sent
- **WHEN** a create or update order request contains `customer_notes` or `admin_notes`
- **THEN** the system ignores those keys and does not store them

### Requirement: Order notes can be updated after creation
The system SHALL accept `order_notes` on the order update request. The value SHALL be sanitized as plain text. A null or empty value SHALL clear the note.

#### Scenario: Merchant edits a note
- **WHEN** a merchant updates an order with a new `order_notes` value
- **THEN** the order response contains the new `order_notes` value

#### Scenario: Merchant clears a note
- **WHEN** a merchant updates an order with `order_notes` set to null
- **THEN** the order's `order_notes` is null

### Requirement: Cart and checkout use order_notes
The system SHALL store the cart note as `order_notes` on the cart and accept `order_notes` on cart update. When an order is created through checkout, the order's `order_notes` SHALL be the `order_notes` value of the checkout request. Line breaks in a note SHALL be kept.

#### Scenario: Customer adds a note to the cart
- **WHEN** a cart is updated with `order_notes`
- **THEN** the cart response contains `order_notes`

#### Scenario: Checkout creates an order
- **WHEN** a checkout request with `order_notes` creates an order
- **THEN** the order's `order_notes` equals the request value

#### Scenario: Note with line breaks
- **WHEN** an order is created or updated with a note that has line breaks
- **THEN** the stored and returned note keeps the line breaks

### Requirement: Order note email does not fall back to the order note
The customer order note email SHALL show only the note passed to it when it is sent. It SHALL NOT use the order's `order_notes` as a replacement when no note is passed.

#### Scenario: Email sent without a passed note
- **WHEN** the order note email is sent with no note and the order has `order_notes`
- **THEN** the email does not contain the order's `order_notes` text as the admin note

### Requirement: Order create page shows a notes textarea
The admin order create page SHALL show a "Notes" card with a textarea. The textarea SHALL have the placeholder "Write a note...". The value SHALL be sent as `order_notes` when the order is created.

#### Scenario: Merchant creates an order with a note
- **WHEN** a merchant types in the Notes textarea and creates the order
- **THEN** the create request contains that text as `order_notes`

#### Scenario: Note change does not recalculate totals
- **WHEN** a merchant changes the Notes textarea
- **THEN** the system does not request a new order calculation

### Requirement: Checkout page collects an optional note
The storefront checkout page SHALL show an optional "Leave a Note" textarea below the Payment section only when the checkout setting `show_customer_note` is enabled. The textarea SHALL have the placeholder "e.g., Leave at front door, call before delivery, or special handling instructions". The value SHALL be sent as `order_notes` when the order is placed.

#### Scenario: Setting enabled
- **WHEN** `show_customer_note` is enabled and a customer opens the checkout page
- **THEN** the "Leave a Note" textarea is shown

#### Scenario: Setting disabled
- **WHEN** `show_customer_note` is disabled and a customer opens the checkout page
- **THEN** no "Leave a Note" textarea is shown
- **AND** an order placed from that page has a null `order_notes`

#### Scenario: Customer leaves a note
- **WHEN** a customer types a note and places the order
- **THEN** the checkout request contains that text as `order_notes`
- **AND** the created order has that `order_notes` value

#### Scenario: Customer leaves no note
- **WHEN** a customer places the order without typing a note
- **THEN** the order's `order_notes` is null

### Requirement: Customer order details page shows the order note
The storefront order details page of the customer account SHALL show an "Order note" section with the note text, below the contact, shipping and billing information. The text SHALL be escaped. The section SHALL NOT be shown when the order has no note.

#### Scenario: Order with a note
- **WHEN** a customer opens the details of an order that has `order_notes`
- **THEN** an "Order note" section shows the note text

#### Scenario: Order without a note
- **WHEN** a customer opens the details of an order with a null `order_notes`
- **THEN** no "Order note" section is shown

### Requirement: Order details page shows and edits the note
The admin order details page SHALL always show a "Notes" card with a pencil icon. The card SHALL show the saved note read-only. When the merchant selects the pencil icon, the card SHALL show a textarea with the placeholder "Write a note..." and a footer with a Cancel button and a Save button, and the pencil icon SHALL be hidden. This also adds a note to an order that has none.

#### Scenario: Order with a note
- **WHEN** the details page opens for an order that has a note
- **THEN** the note text and a pencil icon are shown
- **AND** no textarea is shown

#### Scenario: Order with no note
- **WHEN** the details page opens for an order with a null note
- **THEN** the Notes card shows the pencil icon and no note text
- **AND** no textarea is shown until the merchant selects the pencil icon

#### Scenario: Merchant starts editing
- **WHEN** the merchant selects the pencil icon
- **THEN** a textarea with the current note, a Cancel button and a Save button are shown

#### Scenario: Merchant saves a note
- **WHEN** the merchant changes the text and selects Save
- **THEN** the system sends an order update with the new `order_notes`
- **AND** after success the section shows the new note read-only with the pencil icon

#### Scenario: Merchant cancels editing
- **WHEN** the merchant changes the text and selects Cancel
- **THEN** the textarea closes without a request
- **AND** the section shows the previously saved note
