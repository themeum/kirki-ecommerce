## MODIFIED Requirements

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
