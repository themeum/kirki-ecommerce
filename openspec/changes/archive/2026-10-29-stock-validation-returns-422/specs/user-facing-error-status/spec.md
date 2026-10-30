# Spec Delta

## Purpose

Makes sure a failure that a shopper or admin can correct is reported with the right 4xx status and a readable message, and that both frontends show that message. Server faults stay 5xx.

## ADDED Requirements

### Requirement: Correctable failures return a validation status
When a request fails because of the state of the shopper's cart, stock, or the submitted data, the system SHALL respond with HTTP 422 and a body that holds the failure message. It MUST NOT respond with HTTP 500.

#### Scenario: Add to cart with not enough stock
- **WHEN** a shopper adds a quantity to the cart that the variant stock does not cover
- **THEN** the response is 422 and its message says the stock is not enough
- **AND** the cart is not changed

#### Scenario: Update cart item above the per-order limit
- **WHEN** a shopper sets a cart item quantity above the variant max per order
- **THEN** the response is 422 and its message names the limit

#### Scenario: Checkout with an empty cart
- **WHEN** a shopper submits checkout and the cart has no items
- **THEN** the response is 422 and no order is created

#### Scenario: Checkout with a shipping method that is not available
- **WHEN** a shopper submits checkout with a shipping method that is not valid for the order
- **THEN** the response is 422 and no order is created

### Requirement: Missing and duplicate records return a matching status
When a request refers to a record that does not exist, the system SHALL respond with HTTP 404. When it would create or repeat something that already exists, the system SHALL respond with HTTP 409.

#### Scenario: Cart item that does not exist
- **WHEN** a shopper updates or removes a cart item that is not in any cart
- **THEN** the response is 404

#### Scenario: Other records that do not exist
- **WHEN** a request refers to a cart, order, refund, variant or payment gateway that does not exist
- **THEN** the response is 404, not 500

#### Scenario: Customer already exists for the user
- **WHEN** a customer is created for a user that already has a customer record
- **THEN** the response is 409

#### Scenario: Coupon already in the requested state
- **WHEN** an admin activates a coupon that is already active, or deactivates one that is already inactive
- **THEN** the response is 409

### Requirement: Server faults stay server errors
The system SHALL keep HTTP 500 for failures the user cannot correct: a payment gateway or exchange-rate provider failure, a totals mismatch between an order and its tax or coupon lines, a missing configuration, and a programming error.

#### Scenario: Payment gateway call fails
- **WHEN** the payment gateway returns an error while a payment is created
- **THEN** the response stays 5xx

### Requirement: Frontends show the failure message
When a storefront or admin request fails with a 4xx response that holds a message, the frontend SHALL show that message to the user in a toast. A failure SHALL NOT be dropped without a visible message, whatever the status code.

#### Scenario: Storefront add to cart fails on stock
- **WHEN** the add-to-cart request returns 422 with a stock message
- **THEN** the shopper sees that message in a toast
- **AND** the add-to-cart button returns to its normal state

#### Scenario: Storefront checkout loses a stock race
- **WHEN** the checkout request returns 422 with a stock message and no field errors
- **THEN** the shopper sees that message in a toast and the checkout form keeps its values

#### Scenario: Admin action fails with a message
- **WHEN** an admin request returns 4xx with a message and no field errors
- **THEN** the admin sees that message in a toast

### Requirement: New unclassified failures are caught in review
The project SHALL have an automated check that fails when a thrown failure in a request-handling layer has no explicit exception class and is not on a reviewed list of server-fault cases.

#### Scenario: A new throw omits the exception class
- **WHEN** a developer adds a failure in an action or service with a message and no exception class, and it is not on the reviewed list
- **THEN** the automated check fails and names the file and line
