## Purpose

Guarantees that an order state change and everything that follows from it (stock release, coupon reversal, events, activity log) happens once, and that edits to one order do not overlap.

## ADDED Requirements

### Requirement: A state transition is applied once
When several requests try to change the same order from the same state at the same time (for example a double-clicked cancel, or a payment webhook racing an admin action), the system SHALL apply the transition for one request only. The other requests MUST report that the transition was not applied and MUST NOT run its side effects.

#### Scenario: Two cancel requests at the same time
- **WHEN** two cancel requests for the same order run at the same time
- **THEN** the order is cancelled once, its reserved stock is released once, its coupon use is reversed once, and one cancelled event is raised

#### Scenario: Paid webhook and admin mark-as-paid at the same time
- **WHEN** a payment webhook and an admin "mark as paid" action run at the same time for one order
- **THEN** the order is marked paid once, reserved stock is confirmed at most once, and one payment-completed activity is logged

#### Scenario: Transition from a state the order has already left
- **WHEN** a request tries a transition from a state the order is no longer in
- **THEN** the order is unchanged and the request reports that the transition was not applied

### Requirement: Stock side effects follow the winning transition only
The system SHALL release or confirm reserved stock for an order only in the request whose state transition was applied. Reserved stock of other orders MUST NOT be affected by a repeated or racing request.

#### Scenario: Racing cancel does not release another order's stock
- **WHEN** a second cancel request for an order loses the race
- **THEN** the committed quantity of the variants of that order is not reduced a second time

### Requirement: Edits to one order do not overlap
When an order is edited, the system SHALL make concurrent edits of the same order run one after the other, and each edit MUST work from the order items as they are when the edit starts. Stock MUST be reserved or released only for the real difference between the stored items and the edited items.

#### Scenario: Two edits add the same item at the same time
- **WHEN** two edit requests for one order each raise the quantity of an item from 1 to 3 at the same time
- **THEN** stock is reserved for 2 more units in total, not 4, and the order item quantity is 3

#### Scenario: An edit and a cancel at the same time
- **WHEN** an edit and a cancel request for the same order run at the same time
- **THEN** they run one after the other, and the stock that is committed at the end matches the final state of the order

### Requirement: Invoice numbers are unique
The system SHALL give each new order an invoice number that no other order has, including for the first order of a store and for the first order after a year change when the sequence resets every year.

#### Scenario: First two orders at the same time
- **WHEN** a store has no invoice counter yet and two orders are created at the same time
- **THEN** the two orders have different invoice numbers

#### Scenario: First orders after a year change
- **WHEN** the sequence resets every year and two orders are created at the same time in the first moments of a new year
- **THEN** the two orders have different invoice numbers, and the sequence starts at the configured number once
