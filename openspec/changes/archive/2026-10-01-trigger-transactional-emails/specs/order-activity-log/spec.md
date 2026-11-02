## MODIFIED Requirements

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
