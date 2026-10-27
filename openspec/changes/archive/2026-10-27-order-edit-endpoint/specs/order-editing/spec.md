## ADDED Requirements

### Requirement: An edit read returns the order with live stock and shipping choices
`GET /orders/{id}/edit` SHALL return every field of the admin order detail payload. It SHALL also return, on each item, `is_reachable`, `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order` and `max_per_order`, with the same meaning and values as the same keys on an item of the edit preview. The values SHALL be read from the variant when the response is built, not from the order.

#### Scenario: Order opened for an edit
- **WHEN** an admin reads the edit payload of an editable order whose variants are in stock and have a per-order limit
- **THEN** each item has `is_reachable` true and the variant's current stock and limit values, and every other key equals the order detail payload

#### Scenario: Stock changed after the order was placed
- **WHEN** a variant's available stock changed after the order was placed and an admin reads the edit payload
- **THEN** the item shows the variant's current `available_quantity` and `in_stock`

#### Scenario: Variant was deleted
- **WHEN** an admin reads the edit payload of an order that has an item whose variant was deleted
- **THEN** the item has `is_reachable` false and the other six keys are null

#### Scenario: Product is not published
- **WHEN** an admin reads the edit payload of an order that has an item whose product was moved to draft
- **THEN** the item has `is_reachable` false and the variant's stock and limit values

#### Scenario: Edit read and preview agree
- **WHEN** an admin previews an edit that does not change an item
- **THEN** that item's seven keys in the preview equal the same keys in the edit payload

### Requirement: An edit read lists the shipping methods that can be chosen
The edit payload SHALL include `available_shipping_methods`, the shipping methods that the edit preview gives for the order as it is stored, each with its cost as a base-currency money object. The list SHALL be calculated when the response is built.

#### Scenario: Shipping methods for the stored address
- **WHEN** an admin reads the edit payload of an order
- **THEN** `available_shipping_methods` equals the list the preview gives for the same order sent unchanged

#### Scenario: Stored method no longer offered
- **WHEN** the store no longer offers the method saved on the order and an admin reads the edit payload
- **THEN** the list does not contain that method, and the order's own `shipping_method` keys are unchanged

### Requirement: An edit read is refused when the order cannot be edited
The edit read SHALL fail with a 404 error when the order does not exist, and with a 422 validation error when the order can no longer be edited, the same as the edit preview.

#### Scenario: Unknown order
- **WHEN** an admin reads the edit payload of an order that does not exist
- **THEN** the request fails with a 404 error

#### Scenario: Order that cannot be edited
- **WHEN** an admin reads the edit payload of a paid order
- **THEN** the request fails with a 422 error

### Requirement: The order detail payload does not carry the edit-only fields
`GET /orders/{id}` and every other payload that uses the admin order resource SHALL NOT include `available_shipping_methods` or the item stock and reachability keys.

#### Scenario: Order detail read
- **WHEN** an admin reads `GET /orders/{id}`
- **THEN** the payload has no `available_shipping_methods` and no `is_reachable` or stock key on its items
