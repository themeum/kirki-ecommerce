# Spec Delta

## MODIFIED Requirements

### Requirement: Only unpaid, open, unshipped orders can be edited
An order SHALL be editable only when all of these are true:
- Its payment status is `pending`, `unpaid` or `failed`.
- It has no cancellation date.
- Its fulfillment status is `unfulfilled`, `processing` or `on-hold`.
- Its stored base currency is the store's current base currency.

The system SHALL decide this from the order's own fields and the store's current base currency only.

#### Scenario: Unpaid, unfulfilled order
- **WHEN** an order has payment status `unpaid`, no cancellation date, fulfillment status `unfulfilled`, and its stored base currency is the store's current base currency
- **THEN** the order is editable

#### Scenario: Paid order
- **WHEN** an order has payment status `paid`
- **THEN** the order is not editable

#### Scenario: Refunded or refunding order
- **WHEN** an order has payment status `refunding` or `refunded`
- **THEN** the order is not editable

#### Scenario: Cancelled order
- **WHEN** an unpaid order has a cancellation date
- **THEN** the order is not editable

#### Scenario: Unpaid order already shipped
- **WHEN** an unpaid order has fulfillment status `shipped`, `delivered`, `returned` or any return or refund fulfillment status
- **THEN** the order is not editable

#### Scenario: Order placed in a previous base currency
- **WHEN** an order is unpaid, open and unshipped, its stored base currency is `USD`, and the store's base currency is now `EUR`
- **THEN** the order is not editable

#### Scenario: Store returns to the old base currency
- **WHEN** the store's base currency is set back to `USD` and the order's stored base currency is `USD`
- **THEN** the order is editable again, if the other conditions pass

### Requirement: Saving an edit is refused for an order that is not editable
The order update endpoint SHALL check editability after it locks the order, and SHALL reject the request with a 422 validation error when the order is not editable. A rejected request MUST NOT change the order, its lines, stock, coupons or taxes. The order calculation preview and the edit read SHALL refuse the same order in the same way.

#### Scenario: Paid order update
- **WHEN** an admin saves an edit of a paid order
- **THEN** the request fails with a 422 error and nothing on the order changes

#### Scenario: Order paid between preview and save
- **WHEN** an order is marked paid after the admin previews an edit but before the admin saves it
- **THEN** the save fails with a 422 error and nothing on the order changes

#### Scenario: Order update after a base currency change
- **WHEN** an admin saves an edit of an order whose stored base currency differs from the store's current base currency
- **THEN** the request fails with a 422 error, and the order keeps its stored base currency code and amounts

#### Scenario: Base currency changed between preview and save
- **WHEN** the store's base currency changes after the admin previews an edit but before the admin saves it
- **THEN** the save fails with a 422 error and nothing on the order changes

#### Scenario: Preview or edit read after a base currency change
- **WHEN** an admin requests the order calculation preview or the edit read for an order whose stored base currency differs from the store's current base currency
- **THEN** the request fails with a 422 error
