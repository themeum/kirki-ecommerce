# Spec Delta

## ADDED Requirements

### Requirement: The calculation accepts an order ID to preview an edit
The order calculation endpoint SHALL accept an optional `order_id`. All other inputs are the same as for order creation, except that an existing line is sent with its `order_item_id`. When `order_id` is sent, the endpoint SHALL calculate the edit of that order with the same frozen values as the save. It SHALL fail with a 404 error when the order does not exist, and with a 422 error when the order is not editable.

#### Scenario: Preview an edit
- **WHEN** an admin sends a calculation with the ID of an editable order
- **THEN** the endpoint returns the calculation for that edit, with stored prices, stored coupons, stored shipping and stored tax rates

#### Scenario: Preview an edit of a paid order
- **WHEN** an admin sends a calculation with the ID of a paid order
- **THEN** the request fails with a 422 error

#### Scenario: Unknown order
- **WHEN** an admin sends a calculation with an order ID that does not exist
- **THEN** the request fails with a 404 error

#### Scenario: No order ID
- **WHEN** an admin sends a calculation without an order ID
- **THEN** the endpoint behaves as an order-creation preview

### Requirement: Each calculated item says if its line is reachable
Each calculated line item SHALL expose `is_reachable`. It is false when the line's variant or product no longer exists, or its product is draft, scheduled or trashed, or its variant is hidden. It is true otherwise. The client uses it to disable the quantity buttons of the line.

#### Scenario: Published product
- **WHEN** an item's variant exists and its product is published
- **THEN** the item shows `is_reachable` true

#### Scenario: Unpublished product
- **WHEN** an item's product was moved to draft
- **THEN** the item shows `is_reachable` false

#### Scenario: Deleted variant
- **WHEN** an item's variant was deleted
- **THEN** the item shows `is_reachable` false

### Requirement: Each calculated item exposes live stock and limit data
Each calculated line item SHALL expose these values, read from its variant at calculation time: `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order` and `max_per_order`. For a line whose variant was deleted, each of these values SHALL be null.

#### Scenario: Live values
- **WHEN** a variant has 4 units available, tracks inventory and has a per-order limit of 3
- **THEN** its calculated item shows `available_quantity` 4, `track_inventory` true, `has_limit_per_order` true and `max_per_order` 3

#### Scenario: Deleted variant
- **WHEN** an edit preview includes a line whose variant was deleted
- **THEN** that line's six stock and limit values are null

### Requirement: Each calculated item identifies its stored order line
Each calculated line item SHALL expose `order_item_id`. Its value is the ID of the stored order line when the line is an existing line of an edit. Otherwise its value is null.

#### Scenario: Existing line in an edit
- **WHEN** an edit preview includes a line sent with an `order_item_id`
- **THEN** that item's `order_item_id` is the stored line's ID

#### Scenario: New line or create preview
- **WHEN** an item is new in an edit, or the calculation has no order ID
- **THEN** that item's `order_item_id` is null

### Requirement: Calculation and save apply the same quantity and stock rules
The calculation endpoint and the order save SHALL apply the same quantity, per-order limit and stock rules, and SHALL fail with a 422 error when a rule is broken. The calculation SHALL still return `is_reachable` and the live stock and limit values for display. The calculation SHALL NOT reserve stock; the save SHALL check stock again and reserve it under the order lock.

#### Scenario: Quantity over the limit in a preview
- **WHEN** an admin previews a new line with quantity 5 for a variant whose per-order limit is 3
- **THEN** the calculation fails with a 422 error

#### Scenario: Quantity of an unreachable line changed in a preview
- **WHEN** an admin previews a changed quantity for a line whose product is a draft
- **THEN** the calculation fails with a 422 error

#### Scenario: Increase beyond stock in a preview
- **WHEN** a line has quantity 2, the variant has 1 available unit and does not allow back orders, and an admin previews a quantity of 4
- **THEN** the calculation fails with a 422 error

#### Scenario: Unchanged line on a sold-out variant in a preview
- **WHEN** a line has quantity 5, the variant now has 0 available stock, and an admin previews an edit that does not change that line
- **THEN** the calculation succeeds and the item shows `available_quantity` 0

#### Scenario: Quantity lowered or line removed in a preview
- **WHEN** an admin previews a lower quantity for a line, or leaves a line out of the payload
- **THEN** the calculation succeeds, and no limit or stock check applies to that line

#### Scenario: Stock changes between preview and save
- **WHEN** a preview succeeds, and the stock of the variant is used by another order before the admin saves
- **THEN** the save fails with an insufficient-stock error and nothing on the order changes

## MODIFIED Requirements

### Requirement: The payload supports multiple coupons at both item and order scope

The calculation payload SHALL expose every coupon applied to the
calculation, at both item scope and order scope, rather than assuming a
single applied coupon. Each fixed-amount coupon's configured discount
SHALL be exposed as a money object, not a bare scalar. When the
calculation previews an edit, a coupon that is on the stored order SHALL be
calculated from its stored terms, and a coupon that is not on the stored
order SHALL be calculated from its live record.

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

#### Scenario: A stored coupon in an edit preview

- **WHEN** an edit preview includes a coupon that is on the stored order, and
  the coupon has expired since
- **THEN** the coupon list contains that coupon with its stored terms and its
  discount amount

#### Scenario: A rejected code in a create preview

- **WHEN** a creation preview sends a code that the calculation does not
  apply
- **THEN** that code does not appear in the coupon list
