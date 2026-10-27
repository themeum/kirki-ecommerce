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

For each shipping method in the list, the system SHALL also calculate its
Shipping charges in the comparison range and the change in Shipping charges.
When there is no comparison, the previous Shipping charges and the change SHALL
be empty. When the method had no sales orders in the comparison range, the
previous Shipping charges SHALL be 0 and the change SHALL be empty.

#### Scenario: Uninstalled gateway

- **WHEN** a sales order's payment provider is no longer installed
- **THEN** the method shows the name saved in that order's payment metadata

#### Scenario: Payment method change

- **WHEN** Stripe has Total sales 13600 in the range and 10000 in the comparison range
- **THEN** the Stripe row has previous Total sales 10000 and a change of 36.0

#### Scenario: Payment method new in the range

- **WHEN** Klarna has Total sales 2000 in the range and no sales orders in the comparison range
- **THEN** the Klarna row has previous Total sales 0 and no change

#### Scenario: Shipping method change

- **WHEN** Standard has Shipping charges 1200 in the range and 1000 in the comparison range
- **THEN** the Standard row has previous Shipping charges 1000 and a change of 20.0

#### Scenario: Shipping method new in the range

- **WHEN** Express has Shipping charges 500 in the range and no sales orders in the comparison range
- **THEN** the Express row has previous Shipping charges 0 and no change

### Requirement: Tax metrics

Over the `order_taxes` rows of sales orders in the range, grouped by the order's
shipping country and shipping state, the system SHALL calculate Product tax (Σ
`base_amount` where `type = product`), Shipping tax (Σ `base_amount` where
`type = shipping`) and Total tax (Σ `base_amount`).

For each region in the list, the system SHALL also calculate its Total tax in
the comparison range and the change in Total tax. When there is no comparison,
the previous Total tax and the change SHALL be empty. When the region had no tax
in the comparison range, the previous Total tax SHALL be 0 and the change SHALL
be empty.

#### Scenario: Tax by shipping region

- **WHEN** an order is billed to Canada but shipped to Texas, US
- **THEN** its tax counts under "Texas, United States"

#### Scenario: Tax region change

- **WHEN** Texas, US has Total tax 750 in the range and 600 in the comparison range
- **THEN** the Texas row has previous Total tax 600 and a change of 25.0

#### Scenario: Tax region new in the range

- **WHEN** Ontario, CA has Total tax 300 in the range and no tax in the comparison range
- **THEN** the Ontario row has previous Total tax 0 and no change
