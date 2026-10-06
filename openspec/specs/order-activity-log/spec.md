## Purpose

Gives every order a chronological activity timeline — system-recorded lifecycle events and admin comments — that both admins and the owning customer can read, so anyone looking at an order can see what happened to it and why.

## Requirements

### Requirement: Order activities are recorded with a type and actor
The system SHALL record an order activity as belonging to exactly one order, carrying an activity type from a fixed, known set (order-placed, payment-completed, payment-failed, processing, fulfillment-resumed, shipped, delivered, cancelled, tracking-added, archived, on-hold, partially-refunded, refunded, refund-requested, refund-deleted, comment-added), and an optional actor (the admin/user who triggered it). System-triggered activities with no human actor SHALL record no actor rather than a fabricated one.

#### Scenario: A system event is recorded with an actor
- **WHEN** an admin performs an action on an order that produces a system activity (e.g. marking it shipped)
- **THEN** the recorded activity stores that admin as the actor

#### Scenario: A system event is recorded with no actor
- **WHEN** an order activity is produced by a process with no acting user (e.g. an automated payment webhook)
- **THEN** the recorded activity stores no actor

#### Scenario: An activity always belongs to exactly one order
- **WHEN** any order activity is recorded
- **THEN** it is associated with exactly one existing order and cannot be created without one

#### Scenario: A refund request is recorded
- **WHEN** an admin initiates a refund for an order
- **THEN** a refund-requested activity is recorded on that order

#### Scenario: A refund deletion is recorded
- **WHEN** an admin deletes a refund from an order
- **THEN** a refund-deleted activity is recorded on that order

### Requirement: An order's activities are deleted when the order is deleted
The system SHALL remove all activities belonging to an order when that order is deleted, so no orphaned activity records remain.

#### Scenario: Deleting an order removes its activity history
- **WHEN** an order with one or more recorded activities is deleted
- **THEN** all activities belonging to that order are also removed

### Requirement: Admins can add a comment to an order
The system SHALL let an admin add a free-text comment activity to an order. The comment's text SHALL be stored as the activity's description, and the authoring admin SHALL be recorded as the actor. The admin MAY choose to notify the customer about the comment; whether the customer was notified SHALL be recorded with the activity. Comments are internal by default and SHALL NOT notify the customer unless the admin explicitly chooses to.

#### Scenario: Admin adds a comment
- **WHEN** an admin submits a non-empty comment message for an order
- **THEN** a new comment-added activity is recorded on that order with the submitted text as its description and the admin as its actor

#### Scenario: Empty comment is rejected
- **WHEN** an admin submits a comment with no text
- **THEN** the system rejects the request and no activity is recorded

#### Scenario: Admin adds a comment and notifies the customer
- **WHEN** an admin submits a non-empty comment with "notify customer" selected
- **THEN** the comment-added activity is recorded as customer-notified and the customer is sent the order-note email containing the comment's text

#### Scenario: Comment defaults to internal
- **WHEN** an admin submits a comment without choosing to notify the customer
- **THEN** the comment-added activity is recorded as not customer-notified and no email is sent to the customer

### Requirement: Admins can delete a comment they or another admin added
The system SHALL let an admin delete a comment activity. Only activities of type comment-added SHALL be deletable through this operation; attempting to delete any other activity type SHALL be rejected.

#### Scenario: Admin deletes a comment
- **WHEN** an admin requests deletion of an existing comment-added activity on an order
- **THEN** that activity is permanently removed

#### Scenario: Non-comment activity cannot be deleted
- **WHEN** an admin requests deletion of an activity whose type is not comment-added
- **THEN** the system rejects the request and the activity remains

#### Scenario: Deleting a non-existent comment fails
- **WHEN** an admin requests deletion of an activity id that does not exist on the given order
- **THEN** the system returns a not-found error and nothing is deleted

### Requirement: Activity descriptions are human-readable
The system SHALL present every activity with a human-readable description. For a comment-added activity, the description SHALL be exactly the text the admin submitted. For every other activity type, the description SHALL be generated from the activity's type and recorded details (e.g. order number, amount, carrier, previous/new status) at the time it is displayed, so wording can be improved later without altering stored data.

#### Scenario: Comment description is shown verbatim
- **WHEN** a comment-added activity is displayed
- **THEN** its description is exactly the text originally submitted by the admin

#### Scenario: System activity description reflects current wording
- **WHEN** a system activity (e.g. order-placed) is displayed
- **THEN** its description is built from the activity's type and recorded details, in the current display wording for that type

### Requirement: Admins can view an order's full activity timeline, paginated
The system SHALL let an admin retrieve a paginated list of all activities recorded for an order, newest first, including both system activities and comments. The system SHALL accept optional page and page-size parameters and SHALL return pagination metadata (at minimum: total count, page size, current page) alongside the results. The system SHALL also support retrieving every activity for the order in a single response when explicitly requested.

#### Scenario: Admin views an order's timeline
- **WHEN** an admin requests the activity timeline for an order
- **THEN** the system returns a page of activities recorded for that order, ordered from most recent to oldest, together with pagination metadata

#### Scenario: Admin requests a specific page
- **WHEN** an admin requests the activity timeline for an order with a given page number and page size
- **THEN** the system returns only the activities belonging to that page, and the pagination metadata reflects the total activity count across all pages

#### Scenario: Admin requests every activity at once
- **WHEN** an admin explicitly requests all activities for an order without paging
- **THEN** the system returns every activity for that order in a single response

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
