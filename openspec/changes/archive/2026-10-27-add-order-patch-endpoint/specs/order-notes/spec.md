# Spec Delta

## ADDED Requirements

### Requirement: Order note and flags can be partially updated
The system SHALL accept `PATCH /orders/{id}` from a store manager. The request MAY contain `order_notes` (text or null) and `flags` (list of text or null). The system SHALL change only the keys that are in the request. A null or empty value SHALL clear that field. The request SHALL NOT recalculate totals or change items, addresses, stock, coupons, taxes or statuses. The response SHALL be the updated order.

#### Scenario: Note only
- **WHEN** a manager sends `order_notes` with a new text and no `flags`
- **THEN** the order response contains the new `order_notes`
- **AND** the `flags` of the order are unchanged

#### Scenario: Flags only
- **WHEN** a manager sends `flags` with a list of text values and no `order_notes`
- **THEN** the order response contains those flags
- **AND** the `order_notes` of the order is unchanged

#### Scenario: Note and flags together
- **WHEN** a manager sends both `order_notes` and `flags`
- **THEN** the order response contains both new values

#### Scenario: Clear the note
- **WHEN** a manager sends `order_notes` as null or an empty text
- **THEN** the order's `order_notes` is null

#### Scenario: Clear the flags
- **WHEN** a manager sends `flags` as null or an empty list
- **THEN** the order has no flags

#### Scenario: Line breaks and plain text
- **WHEN** a manager sends a note with line breaks and HTML tags
- **THEN** the stored note keeps the line breaks and has the HTML tags removed

#### Scenario: Other order data is not touched
- **WHEN** a manager sends a partial update for an order
- **THEN** the totals, items, addresses, coupons, taxes and statuses of the order are unchanged

#### Scenario: Empty request
- **WHEN** a manager sends a partial update with neither `order_notes` nor `flags`
- **THEN** the system rejects the request with a validation error
- **AND** the order is unchanged

#### Scenario: Invalid flags value
- **WHEN** a manager sends `flags` that is not a list of text values
- **THEN** the system rejects the request with a validation error

#### Scenario: Order not found
- **WHEN** a manager sends a partial update for an order ID that does not exist
- **THEN** the system responds with a not found error

#### Scenario: Not a store manager
- **WHEN** a request without store management permission sends a partial update
- **THEN** the system rejects the request and the order is unchanged

#### Scenario: Order in any status
- **WHEN** a manager sends a partial update for a cancelled or refunded order
- **THEN** the system applies the change
