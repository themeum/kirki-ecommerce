# Spec Delta

## MODIFIED Requirements

### Requirement: The calculation accepts an order ID to preview an edit
The order calculation endpoint SHALL accept an optional `order_id`. All other inputs are the same as for order creation, except that an existing line is sent with its `id`. When `order_id` is sent, the endpoint SHALL calculate the edit of that order with the same frozen values as the save. It SHALL fail with a 404 error when the order does not exist, and with a 422 error when the order is not editable.

#### Scenario: Preview an edit
- **WHEN** an admin sends a calculation with the ID of an editable order
- **THEN** the endpoint returns the calculation for that edit, with stored prices, stored coupons and stored line tax rates, and with the shipping charge and shipping tax quoted again from the current settings

#### Scenario: Preview an edit of a paid order
- **WHEN** an admin sends a calculation with the ID of a paid order
- **THEN** the request fails with a 422 error

#### Scenario: Unknown order
- **WHEN** an admin sends a calculation with an order ID that does not exist
- **THEN** the request fails with a 404 error

#### Scenario: No order ID
- **WHEN** an admin sends a calculation without an order ID
- **THEN** the endpoint behaves as an order-creation preview
