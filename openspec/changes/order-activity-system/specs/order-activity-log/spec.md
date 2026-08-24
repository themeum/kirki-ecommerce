## Purpose

Gives every order a chronological activity timeline — system-recorded lifecycle events and admin comments — that both admins and the owning customer can read, so anyone looking at an order can see what happened to it and why.

## ADDED Requirements

### Requirement: Order activities are recorded with a type and actor
The system SHALL record an order activity as belonging to exactly one order, carrying an activity type from a fixed, known set (order-placed, payment-completed, payment-failed, status-changed, shipped, delivered, cancelled, tracking-added, archived, on-hold, partially-refunded, refunded, comment-added), and an optional actor (the admin/user who triggered it). System-triggered activities with no human actor SHALL record no actor rather than a fabricated one.

#### Scenario: A system event is recorded with an actor
- **WHEN** an admin performs an action on an order that produces a system activity (e.g. marking it shipped)
- **THEN** the recorded activity stores that admin as the actor

#### Scenario: A system event is recorded with no actor
- **WHEN** an order activity is produced by a process with no acting user (e.g. an automated payment webhook)
- **THEN** the recorded activity stores no actor

#### Scenario: An activity always belongs to exactly one order
- **WHEN** any order activity is recorded
- **THEN** it is associated with exactly one existing order and cannot be created without one

### Requirement: An order's activities are deleted when the order is deleted
The system SHALL remove all activities belonging to an order when that order is deleted, so no orphaned activity records remain.

#### Scenario: Deleting an order removes its activity history
- **WHEN** an order with one or more recorded activities is deleted
- **THEN** all activities belonging to that order are also removed

### Requirement: Admins can add a comment to an order
The system SHALL let an admin add a free-text comment activity to an order. The comment's text SHALL be stored as the activity's description, and the authoring admin SHALL be recorded as the actor.

#### Scenario: Admin adds a comment
- **WHEN** an admin submits a non-empty comment message for an order
- **THEN** a new comment-added activity is recorded on that order with the submitted text as its description and the admin as its actor

#### Scenario: Empty comment is rejected
- **WHEN** an admin submits a comment with no text
- **THEN** the system rejects the request and no activity is recorded

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

### Requirement: Admins can view an order's full activity timeline
The system SHALL let an admin retrieve the ordered list of all activities recorded for an order, newest first, including both system activities and comments.

#### Scenario: Admin views an order's timeline
- **WHEN** an admin requests the activity timeline for an order
- **THEN** the system returns every activity recorded for that order, ordered from most recent to oldest

### Requirement: Customers can view their own order's activity timeline
The system SHALL let a customer retrieve the same activity timeline shown to admins for an order they own, including admin comments. A customer SHALL NOT be able to retrieve the activity timeline of an order that does not belong to them.

#### Scenario: Customer views their own order's timeline
- **WHEN** a signed-in customer requests the activity timeline for an order they placed
- **THEN** the system returns every activity recorded for that order, including comments, ordered from most recent to oldest

#### Scenario: Customer cannot view another customer's order timeline
- **WHEN** a signed-in customer requests the activity timeline for an order that belongs to a different customer
- **THEN** the system rejects the request
