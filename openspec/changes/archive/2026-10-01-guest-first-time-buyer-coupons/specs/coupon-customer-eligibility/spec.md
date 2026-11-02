## ADDED Requirements

### Requirement: First-time-buyer coupons identify the buyer by customer or email

A coupon marked "first time buyer only" SHALL be accepted only when the buyer has no prior orders. The buyer SHALL be identified by their customer record when one exists, and by their email address otherwise.

- **Prior order:** an order placed by the same customer record, or with the same email address, whose status is neither failed-cancelled nor refunded. The email comparison SHALL ignore letter case and surrounding whitespace.
- **A registered customer's email:** their customer record's email, falling back to their WordPress account email when no customer record exists yet. This SHALL take precedence over any email entered on the cart or order.
- **A guest's email:** the email entered on the cart or order.

Guests SHALL NOT be rejected just for not being signed in.

#### Scenario: Guest with a new email applies a first-time-buyer coupon

- **WHEN** a visitor who is not signed in has entered an email with no prior orders and applies a first-time-buyer coupon to their cart
- **THEN** the coupon is applied

#### Scenario: Guest whose email has a prior order

- **WHEN** a visitor who is not signed in has entered an email that a prior order was placed with, and applies a first-time-buyer coupon
- **THEN** the coupon is rejected with the "This coupon is only available for first time buyers." message

#### Scenario: Email matches regardless of letter case

- **WHEN** a prior order was placed with `Jane@Example.com` and a guest enters `jane@example.com`
- **THEN** the guest is treated as having a prior order

#### Scenario: Guest has not entered an email yet

- **WHEN** a visitor who is not signed in has not entered an email and applies a first-time-buyer coupon
- **THEN** the coupon is rejected with the "Please enter your email address to use this coupon." message

#### Scenario: Registered customer with an earlier guest order under their email

- **WHEN** a signed-in shopper has no orders linked to their customer record, but an earlier guest order was placed with their account email
- **THEN** a first-time-buyer coupon is rejected

#### Scenario: Signed-in shopper without a customer record yet

- **WHEN** a signed-in shopper with no customer record and no prior orders under their account email applies a first-time-buyer coupon
- **THEN** the coupon is applied

#### Scenario: Cancelled and refunded orders do not count

- **WHEN** the buyer's only earlier orders are failed-cancelled or refunded
- **THEN** a first-time-buyer coupon is applied

### Requirement: Per-customer usage limits identify the buyer by customer or email

When a coupon limits how many times each customer can use it, the coupon SHALL be accepted only while the buyer's earlier uses are below that limit. The buyer SHALL be identified exactly as in the first-time-buyer rule (customer record, else email, with emails compared ignoring case).

- **Earlier use:** a use of this coupon on an order that belongs to the buyer's customer record, or that was placed with the buyer's email, and whose usage has not been reversed (for example by cancellation).
- **Missing identity:** when the buyer has neither a customer record, a signed-in account, nor an email, the coupon SHALL be rejected with the "Please enter your email address to use this coupon." message.

Guests SHALL NOT be rejected just for not being signed in.

#### Scenario: Guest below the limit

- **WHEN** a coupon allows 2 uses per customer and a guest's email has used it once
- **THEN** the coupon is applied

#### Scenario: Guest at the limit

- **WHEN** a coupon allows 1 use per customer and a guest's email has already used it on an order
- **THEN** the coupon is rejected with the "You have reached the usage limit for this coupon." message

#### Scenario: Registered customer's earlier guest use counts

- **WHEN** a coupon allows 1 use per customer and a signed-in shopper earlier used it as a guest with their account email
- **THEN** the coupon is rejected with the usage-limit message

#### Scenario: Reversed usage does not count

- **WHEN** the buyer's only earlier use of the coupon was on an order that was cancelled and its usage reversed
- **THEN** the coupon is applied

#### Scenario: Guest has not entered an email yet

- **WHEN** a visitor who is not signed in and has not entered an email applies a coupon with a per-customer limit
- **THEN** the coupon is rejected with the "Please enter your email address to use this coupon." message

### Requirement: The first-time-buyer rule gives the same verdict on the cart and at checkout

For the same buyer and the same store state, the first-time-buyer rule SHALL give the same verdict on the cart, in the order total calculation, and when the order is placed. At order placement, the email submitted with the order SHALL be the authoritative guest email. A first-time-buyer coupon that no longer qualifies SHALL be dropped from the order's discounts.

#### Scenario: Guest changes to an email with prior orders before placing the order

- **WHEN** a guest applied a first-time-buyer coupon with a new email, then places the order with an email that has a prior order
- **THEN** the order is placed without that coupon's discount

### Requirement: Admin-created and edited orders check the order's customer, not the admin

When an admin creates, recalculates or edits an order, the first-time-buyer and per-customer usage-limit rules SHALL check the customer selected on the order, or the email entered for a guest order. The signed-in admin's own identity SHALL NOT be used. When an existing order is edited, that order SHALL NOT count as a prior order, or as an earlier use of its coupons, for its own buyer.

#### Scenario: Admin creates a guest order with a new email

- **WHEN** an admin creates an order with no customer selected, enters an email with no prior orders, and applies a first-time-buyer coupon
- **THEN** the coupon applies

#### Scenario: Admin creates an order for a customer who has ordered before

- **WHEN** an admin creates an order for a selected customer who has a prior order and applies a first-time-buyer coupon
- **THEN** the coupon does not apply

#### Scenario: Admin edits the buyer's only order

- **WHEN** an admin edits an order that carries a first-time-buyer coupon and the buyer has no other prior orders
- **THEN** the coupon still applies

#### Scenario: Admin edits an order that used a once-per-customer coupon

- **WHEN** an admin edits an order carrying a coupon limited to 1 use per customer, and that order is the buyer's only use of it
- **THEN** the coupon still applies

### Requirement: First-time-buyer can be enabled for any customer eligibility

The coupon editor SHALL offer the "First time buyer only" option for every customer-eligibility choice (everyone, registered customers, guests, specific customers).

#### Scenario: Guests-only coupon

- **WHEN** an admin sets a coupon's eligible customers to guests
- **THEN** the "First time buyer only" option is available
