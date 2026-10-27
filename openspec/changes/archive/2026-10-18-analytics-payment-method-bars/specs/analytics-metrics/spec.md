## MODIFIED Requirements

### Requirement: Payment method and shipping method metrics

Over the sales orders in the range, grouped by `payment_provider`, the system
SHALL calculate Total sales and Orders. Grouped by `shipping_method`, it SHALL
calculate Shipping charges and Orders. The name SHALL be the current name of the
provider or method, else the name saved in `payment_metadata` or
`shipping_metadata`, else the stored id.

For each payment method in the list, the system SHALL also calculate its Total
sales in the comparison range and the change in Total sales. When there is no
comparison, the previous Total sales and the change SHALL be empty. When the
method had no sales orders in the comparison range, the previous Total sales
SHALL be 0 and the change SHALL be empty.

#### Scenario: Uninstalled gateway

- **WHEN** a sales order's payment provider is no longer installed
- **THEN** the method shows the name saved in that order's payment metadata

#### Scenario: Payment method change

- **WHEN** Stripe has Total sales 13600 in the range and 10000 in the comparison range
- **THEN** the Stripe row has previous Total sales 10000 and a change of 36.0

#### Scenario: Payment method new in the range

- **WHEN** Klarna has Total sales 2000 in the range and no sales orders in the comparison range
- **THEN** the Klarna row has previous Total sales 0 and no change
