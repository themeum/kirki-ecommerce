# Spec Delta

## ADDED Requirements

### Requirement: The calculation accepts an order ID to preview an edit
The order calculation endpoint SHALL accept an optional `order_id`. All other inputs are the same as for order creation. When `order_id` is sent, the endpoint SHALL calculate the edit of that order. It SHALL fail with a 404 error when the order does not exist, and with a 422 error when the order is not editable.

#### Scenario: Preview an edit
- **WHEN** an admin sends a calculation with the ID of an editable order
- **THEN** the endpoint returns the calculation for that edit, with change states filled in

#### Scenario: Preview an edit of a paid order
- **WHEN** an admin sends a calculation with the ID of a paid order
- **THEN** the request fails with a 422 error

#### Scenario: Unknown order
- **WHEN** an admin sends a calculation with an order ID that does not exist
- **THEN** the request fails with a 404 error

#### Scenario: No order ID
- **WHEN** an admin sends a calculation without an order ID
- **THEN** the endpoint behaves as an order-creation preview

### Requirement: Each calculated item exposes live stock and limit data
Each calculated line item SHALL expose these values, read from its variant at calculation time: `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order` and `max_per_order`. For a row whose variant was deleted, each of these values SHALL be null.

#### Scenario: Live values
- **WHEN** a variant has 4 units available, tracks inventory and has a per-order limit of 3
- **THEN** its calculated item shows `available_quantity` 4, `track_inventory` true, `has_limit_per_order` true and `max_per_order` 3

#### Scenario: Deleted variant row
- **WHEN** an edit preview includes a row for a line whose variant was deleted
- **THEN** that row's six stock and limit values are null

### Requirement: Each calculated item identifies its stored order line
Each calculated line item SHALL expose `order_item_id`. Its value is the ID of the stored order line for the same variant when the calculation previews an edit. Otherwise its value is null. A row for a line whose variant was deleted SHALL carry that line's ID.

#### Scenario: Existing line in an edit
- **WHEN** an edit preview includes a variant that is already on the order
- **THEN** that item's `order_item_id` is the stored line's ID

#### Scenario: New line or create preview
- **WHEN** an item is new in an edit, or the calculation has no order ID
- **THEN** that item's `order_item_id` is null

### Requirement: Calculation does not block on stock or per-order limits
The calculation endpoint SHALL NOT fail because a line's quantity is more than the available stock or the per-order limit. It SHALL return the live stock and limit values, so the client can show the problem. Saving the order SHALL enforce these rules.

#### Scenario: Quantity over the limit in a preview
- **WHEN** an admin previews a line with quantity 5 for a variant whose per-order limit is 3
- **THEN** the calculation succeeds and the item shows `max_per_order` 3

## MODIFIED Requirements

### Requirement: The payload supports multiple coupons at both item and order scope

The calculation payload SHALL expose every coupon applied to the
calculation, at both item scope and order scope, rather than assuming a
single applied coupon. Each fixed-amount coupon's configured discount
SHALL be exposed as a money object, not a bare scalar. When the
calculation previews an edit, the coupon list SHALL also include each
coupon that is on the stored order but is not applied by the preview,
with a zero discount amount and its `current_state` marking it as
removed. A coupon code that is neither applied nor on the stored order
SHALL NOT appear in the list.

#### Scenario: A calculation with more than one coupon

- **WHEN** a manual order calculation has more than one coupon applied, at
  either scope
- **THEN** the payload's coupon list contains one entry per applied coupon,
  each with its own discount amount and target scope, and a money object
  for any fixed-amount discount configuration

#### Scenario: An item discounted by more than one item-scoped coupon

- **WHEN** a calculated line item is discounted by more than one
  item-scoped coupon
- **THEN** that item's list of applied coupons contains one entry per
  coupon that discounted it, each with its own attributed amount

#### Scenario: A stored coupon no longer applies in an edit preview

- **WHEN** an edit preview does not apply a coupon that is on the stored
  order
- **THEN** the coupon list contains that coupon with a zero discount amount
  and a `current_state` that marks it as removed

#### Scenario: A rejected code in a create preview

- **WHEN** a creation preview sends a code that the calculation does not
  apply
- **THEN** that code does not appear in the coupon list
