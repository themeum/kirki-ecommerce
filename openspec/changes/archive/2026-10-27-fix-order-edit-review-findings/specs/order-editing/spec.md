# Spec Delta

## MODIFIED Requirements

### Requirement: A stored order-wide coupon keeps its stored terms
A stored percent order coupon SHALL use its stored rate on the subtotal that is left after product coupons. A stored fixed order coupon SHALL keep its stored total, capped at the subtotal that is left, and the total SHALL be shared over all lines by their subtotal.

#### Scenario: Fixed order coupon and a new line
- **WHEN** an order has a fixed order-wide coupon of 10.00, and an admin adds a new line
- **THEN** the total discount stays 10.00 and it is shared over all lines, including the new line

#### Scenario: Fixed order coupon above the subtotal
- **WHEN** a fixed order-wide coupon of 10.00 is stored, and an admin lowers the quantities so that the subtotal is 6.00
- **THEN** the discount is 6.00

#### Scenario: Fixed coupon restored after a capped edit
- **WHEN** a fixed coupon of 10.00 originally gave 10.00, an edit caps it at 6.00, and a later edit raises the subtotal above 10.00
- **THEN** the coupon can give 10.00 again, using its unchanged `base_max_discount_amount`
- **AND** this applies to both an order-wide coupon and a product coupon on its original line

#### Scenario: Fixed coupon that was capped at checkout
- **WHEN** a fixed product coupon of 10.00 gave 6.00 at checkout because the line was worth 6.00, and an edit raises the line to 12.00
- **THEN** the coupon gives 10.00 for that line, because its `base_max_discount_amount` is the amount it was set to, not the amount it gave

#### Scenario: A kept coupon temporarily gives no discount
- **WHEN** an edit lowers a line's quantity so that an earlier stored coupon uses the whole line subtotal
- **THEN** the later stored coupon's attribution and its `base_max_discount_amount` stay stored even when its applied amount is zero
- **AND** raising the quantity again lets that coupon discount the line again

## ADDED Requirements

### Requirement: Coupons are priced in passes, stored before new
Coupons SHALL be priced in passes: product coupons first (stored, then new), then order-wide coupons (stored, then new), then free shipping. Inside a pass, a stored coupon SHALL be priced before a new coupon, so that a new coupon takes only from what the stored coupons leave. A new product coupon SHALL be priced before a stored order-wide coupon, so it MAY lower the amount that coupon gives.

#### Scenario: New order-wide percent coupon added to a stored one
- **WHEN** an order with a subtotal of 100.00 has a stored 10% order-wide coupon, and an admin adds a new 20% order-wide coupon
- **THEN** the stored coupon gives 10.00 and the new coupon gives 18.00

#### Scenario: New product coupon added to a stored order-wide coupon
- **WHEN** an order with a subtotal of 100.00 has a stored 10% order-wide coupon, and an admin adds a new fixed product coupon of 20.00 for a line worth 100.00
- **THEN** the new coupon gives 20.00 and the stored coupon gives 8.00, because it is priced on the 80.00 that is left
- **AND** the total discount is 28.00, which is more than the 10.00 before the edit

#### Scenario: New fixed order-wide coupon added to a stored one
- **WHEN** an order with a subtotal of 100.00 has a stored fixed order-wide coupon of 95.00, and an admin adds a new fixed order-wide coupon of 20.00
- **THEN** the stored coupon keeps 95.00 and the new coupon gives 5.00

#### Scenario: A new coupon does not take from a stored product coupon
- **WHEN** a stored fixed product coupon of 10.00 is on a line with a subtotal of 12.00, and an admin adds a new fixed product coupon of 12.00 for the same line
- **THEN** the stored coupon keeps 10.00 and the new coupon gives 2.00

### Requirement: An edit takes the tax destination from the order
When an edit calculates tax, the system SHALL use the order's stored tax destination to choose the address that tax follows. It SHALL NOT read the current tax-destination setting, including when the address that tax follows is new and tax is calculated again.

#### Scenario: Tax destination setting changed since the order was placed
- **WHEN** an order was placed with tax following the shipping address, the store now sets tax to follow the billing address, and an admin saves an edit that changes the shipping state
- **THEN** the tax is calculated from the shipping address

### Requirement: An edit preview refuses what the save refuses
The edit preview (`POST /calculate/order` with an `order_id`) SHALL apply the currency check and the shipping-method check of the save. A `currency_code` that differs from the order's currency SHALL fail the preview with a 422 error. A shipping method that is not available when shipping is quoted again SHALL fail the preview with a 422 error. When the stored shipping charge is kept, the method SHALL NOT be checked against the current settings.

#### Scenario: Preview with a different currency
- **WHEN** an admin previews an edit of a EUR order with currency code USD
- **THEN** the preview fails with a 422 error, as the save does

#### Scenario: Preview with a method that does not serve the new address
- **WHEN** an admin previews an edit that changes the shipping country and the selected shipping method does not serve it
- **THEN** the preview fails with a 422 error, as the save does

#### Scenario: Preview with the same address and method
- **WHEN** an admin previews an edit with the same shipping country, state and method, and the method was removed from the store since
- **THEN** the preview succeeds with the stored shipping charge

### Requirement: A kept coupon is matched by code without regard to case
A coupon on the stored order SHALL stay applied when the edit sends its code in a different letter case. The system SHALL NOT treat that code as a new coupon, SHALL NOT remove the stored coupon, and SHALL NOT claim a coupon use again.

#### Scenario: Code sent in lower case
- **WHEN** an order has the coupon `SPRING10`, the coupon has since expired, and an admin saves an edit that sends `spring10`
- **THEN** the coupon stays applied with its stored terms and no use is claimed or given back

### Requirement: A fixed product coupon without a stored amount keeps each line's own discount
When a stored fixed product coupon has no `base_max_discount_amount`, the system SHALL use the stored discount of each line as that line's amount. It SHALL NOT use the total of the coupon for the order as the amount of every line. A stored fixed order-wide coupon without the column SHALL use its stored total.

#### Scenario: Old fixed product coupon on two lines
- **WHEN** a stored fixed product coupon has no `base_max_discount_amount`, discounted two lines by 3.00 and 4.00, and an admin saves an edit that does not change those lines
- **THEN** the lines are discounted 3.00 and 4.00, and the stored `base_max_discount_amount` is not set to 7.00

### Requirement: A stock shortage in the save gives a 422 error
A stock shortage found while an edit is saved SHALL fail the request with a 422 error and the message "Not enough stock for variant: N", whichever step finds it. Nothing on the order SHALL change.

#### Scenario: Stock taken after the preview
- **WHEN** another order takes the last unit of a variant between an admin's preview and the save that raises that variant's quantity
- **THEN** the save fails with a 422 error and the order, its stock and its coupons are unchanged
