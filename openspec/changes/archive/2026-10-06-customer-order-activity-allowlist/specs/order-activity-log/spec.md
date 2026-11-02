## MODIFIED Requirements

### Requirement: Customers can view their own order's activity timeline, paginated
The system SHALL let a customer retrieve a paginated activity timeline for an order they own, newest first. The timeline SHALL contain only activities whose type is customer-visible, and each entry SHALL have the same fields as an admin entry, except that it SHALL NOT include the notify-customer flag. The page and page-size parameters, the "all activities" option, and the pagination metadata SHALL work the same as for admins, and the total count SHALL count only customer-visible activities. A customer SHALL NOT be able to retrieve the activity timeline of an order that does not belong to them.

#### Scenario: Customer views their own order's timeline
- **WHEN** a signed-in customer requests the activity timeline for an order they placed
- **THEN** the system returns a page of that order's customer-visible activities, ordered from most recent to oldest, together with pagination metadata

#### Scenario: Customer timeline leaves out hidden activities
- **WHEN** a signed-in customer requests the activity timeline for an order that also has comment and payment activities
- **THEN** the response contains no comment-added and no payment activity

#### Scenario: Customer timeline omits the notify flag
- **WHEN** a signed-in customer requests the activity timeline for their order
- **THEN** each entry has the same fields as an admin entry, but contains no notify-customer flag

#### Scenario: Pagination counts only visible activities
- **WHEN** a signed-in customer requests a page of the timeline for an order that has hidden activities
- **THEN** the total count in the pagination metadata equals the number of customer-visible activities, not the number of all activities

#### Scenario: Customer cannot view another customer's order timeline
- **WHEN** a signed-in customer requests the activity timeline for an order that belongs to a different customer
- **THEN** the system rejects the request

## ADDED Requirements

### Requirement: Customer-visible activity types come from one allow-list
The system SHALL decide which activity types a customer can see from a single allow-list. Every customer-facing view of an order's activities (the account order details page, the order tracking page and the customer timeline endpoint) SHALL use that list. An activity type that is not on the list SHALL be hidden from customers, so a newly added type stays hidden until it is added to the list. The list SHALL contain the fulfillment types order-placed, processing, fulfillment-resumed, shipped, delivered, cancelled, tracking-added and on-hold. It SHALL NOT contain payment-completed, payment-failed, archived, partially-refunded, refunded, refund-requested, refund-deleted or comment-added. Admin views SHALL NOT be filtered by this list.

#### Scenario: Fulfillment activity is shown on the order page
- **WHEN** a customer opens their order details page and the order has a shipped activity
- **THEN** the shipped activity appears in the order's activity timeline

#### Scenario: Payment activity is hidden on the order page
- **WHEN** a customer opens their order details page and the order has a payment-completed activity
- **THEN** the payment-completed activity does not appear in the timeline

#### Scenario: Order tracking page uses the same list
- **WHEN** a visitor opens the order tracking page for an order that has a refunded activity
- **THEN** the refunded activity does not appear in the timeline

#### Scenario: Unlisted type is hidden by default
- **WHEN** a new activity type is added to the system and not added to the customer allow-list
- **THEN** no customer-facing view shows activities of that type

#### Scenario: Admin still sees every activity
- **WHEN** an admin requests the activity timeline for an order that has hidden-from-customer activities
- **THEN** the admin timeline still contains every activity, including comments and payment activities
