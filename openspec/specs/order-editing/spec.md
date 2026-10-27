# order-editing Specification

## Purpose
Defines when an admin can edit an existing order, and how saving an edit keeps the pricing the customer was promised (line prices, coupons, exchange rate, shipping and tax), changes shipping and tax only for a new delivery address, and applies the stock, limit and reachability rules to quantity changes.

## Requirements

### Requirement: Only unpaid, open, unshipped orders can be edited
An order SHALL be editable only when all of these are true:
- Its payment status is `pending`, `unpaid` or `failed`.
- It has no cancellation date.
- Its fulfillment status is `unfulfilled`, `processing` or `on-hold`.

The system SHALL decide this from the order's own fields only.

#### Scenario: Unpaid, unfulfilled order
- **WHEN** an order has payment status `unpaid`, no cancellation date and fulfillment status `unfulfilled`
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

### Requirement: Order payloads expose whether the order is editable
The admin order detail payload and each row of the admin order list payload SHALL include an `is_editable` boolean that follows the editability rule.

#### Scenario: Order list row
- **WHEN** an admin lists orders
- **THEN** each row has `is_editable`, true only for orders that pass the editability rule

#### Scenario: Order detail
- **WHEN** an admin opens an order
- **THEN** the payload has `is_editable` with the same value the list shows for that order

### Requirement: Saving an edit is refused for an order that is not editable
The order update endpoint SHALL check editability after it locks the order, and SHALL reject the request with a 422 validation error when the order is not editable. A rejected request MUST NOT change the order, its lines, stock, coupons or taxes.

#### Scenario: Paid order update
- **WHEN** an admin saves an edit of a paid order
- **THEN** the request fails with a 422 error and nothing on the order changes

#### Scenario: Order paid between preview and save
- **WHEN** an order is marked paid after the admin previews an edit but before the admin saves it
- **THEN** the save fails with a 422 error and nothing on the order changes

### Requirement: Existing lines are identified by order line ID
An existing line SHALL be sent with its `id`. A new line SHALL be sent with a `variant_id` and no `id`. The system SHALL reject an `id` that is not a line of the edited order, and it SHALL reject a payload that uses the same `id` twice. An existing line that the payload leaves out SHALL be removed from the order.

#### Scenario: Existing line
- **WHEN** an admin sends a line with the `id` of a stored line and a new quantity
- **THEN** the system changes that stored line

#### Scenario: Line from another order
- **WHEN** an admin sends an `id` that belongs to a different order
- **THEN** the request fails with a 422 error

#### Scenario: Line whose variant was deleted
- **WHEN** an order has a line whose variant was deleted, and an admin sends that line with its `id` and an unchanged quantity
- **THEN** the line stays on the order with its stored values

### Requirement: A variant can appear on only one new line, and not as a new line when the order has it
The order calculation, order create and order update endpoints SHALL reject a payload in which two new lines have the same variant. An edit SHALL also reject a new line for a variant that an existing line of the order already holds.

#### Scenario: Same variant sent twice
- **WHEN** a payload holds two new lines with the same variant ID
- **THEN** the request fails with a 422 error

#### Scenario: Adding a variant already on the order
- **WHEN** an admin sends a new line for a variant that is already on the order
- **THEN** the request fails with a 422 error

### Requirement: An existing line keeps its stored price
When an edit is saved, an existing line SHALL be calculated with the unit price, regular price and catalog prices stored on the line. The system SHALL NOT read the variant's current price for it, and SHALL NOT change the line's stored name, SKU, barcode, image, weight or product data.

#### Scenario: Price raised after the order was placed
- **WHEN** a line was saved at a sale price of 25.00, the variant's sale price is now 28.00, and an admin saves an edit that changes only the shipping address
- **THEN** the line's unit price is still 25.00

#### Scenario: Quantity changed after a price change
- **WHEN** an admin saves an edit that changes a line's quantity from 2 to 3 after the variant's price changed
- **THEN** the line's unit price is the stored price, and its subtotal is the stored price times 3

#### Scenario: Product deleted after the order was placed
- **WHEN** an order has a line whose product was deleted, and an admin saves an edit that does not change that line
- **THEN** the line stays on the order with its stored values and the save succeeds

### Requirement: A new line takes the current variant price
A line added in an edit SHALL be priced from the variant's current price and SHALL get a full snapshot of the variant (name, SKU, barcode, image, weight, product data and catalog prices), the same as order creation. The exchange rate and tax-inclusive setting that the order stores SHALL apply to it.

#### Scenario: Adding a line
- **WHEN** an admin adds a variant whose sale price is 12.00 to an order
- **THEN** the new line is priced at 12.00 and the lines already on the order keep their stored prices

### Requirement: New lines accept only products that can be bought
A line added in an edit SHALL follow the same availability rule as order creation. The variant must exist and be visible, and its product must be published. Otherwise, the request SHALL fail with a validation error.

#### Scenario: Adding a draft product
- **WHEN** an admin adds a new line for a variant whose product is a draft
- **THEN** the request fails with a validation error

### Requirement: A line whose product is not reachable is locked
A line is not reachable when its variant or product no longer exists, or its product is draft, scheduled or trashed, or its variant is hidden. The system SHALL reject any change of the quantity of such a line, up or down, with a 422 error, in a preview and in a save. The line MAY be removed from the order.

#### Scenario: Quantity raised on an unreachable line
- **WHEN** a line's product was moved to draft and an admin raises the line's quantity
- **THEN** the save fails with a 422 error

#### Scenario: Quantity lowered on an unreachable line
- **WHEN** a line's variant was deleted and an admin lowers the line's quantity
- **THEN** the save fails with a 422 error

#### Scenario: Unreachable line left as it is
- **WHEN** a line's product is a draft and an admin saves an edit that does not change that line
- **THEN** the save succeeds and the line keeps its stored values

#### Scenario: Unreachable line removed
- **WHEN** a line's variant was deleted and an admin leaves that line out of the payload
- **THEN** the line is removed, and no stock is released for it

### Requirement: Stock is checked live for the quantity added
When an edit is previewed or saved, the system SHALL check the variant's live stock for the quantity added to a reachable line, and for the full quantity of a new line. When an edit is saved, the system SHALL also reserve that stock, and SHALL release stock for the quantity taken off a reachable line and for a removed line whose variant still exists. It SHALL NOT check stock for a line whose quantity does not go up.

#### Scenario: Unchanged line on a sold-out variant
- **WHEN** a line has quantity 5, the variant now has 0 available stock, and an admin saves an edit that does not change that line
- **THEN** the save succeeds and no stock moves for that line

#### Scenario: Quantity raised beyond stock
- **WHEN** a line has quantity 2, the variant has 1 available unit and does not allow back orders, and an admin raises the quantity to 4
- **THEN** the save fails with an insufficient-stock error and nothing on the order changes

#### Scenario: Quantity lowered
- **WHEN** an admin lowers a line from 5 to 2
- **THEN** 3 units of stock are released for that variant

### Requirement: The per-order limit blocks only an increase
When an edit is previewed or saved, the system SHALL reject a quantity increase on a line when the variant has a per-order limit and the new quantity is more than the current limit. A quantity that is not more than the stored quantity SHALL NOT be rejected by the limit, so the stored quantity always stays.

#### Scenario: Limit lowered, room left
- **WHEN** a line has quantity 4, the variant's limit is now 5, and an admin raises the quantity to 5
- **THEN** the save succeeds

#### Scenario: Limit lowered, no room
- **WHEN** a line has quantity 4, the variant's limit is now 5, and an admin raises the quantity to 6
- **THEN** the save fails with a 422 error

#### Scenario: Limit lowered below the stored quantity
- **WHEN** a line has quantity 4, the variant's limit is now 2, and an admin saves an edit that keeps the quantity at 4
- **THEN** the save succeeds and the line keeps quantity 4

#### Scenario: Limit lowered, increase refused
- **WHEN** a line has quantity 4, the variant's limit is now 2, and an admin raises the quantity to 5
- **THEN** the save fails with a 422 error

### Requirement: Stored coupons are locked
A coupon that is on the stored order SHALL stay applied with the terms stored on the order: its discount type, its target, its percent rate or its amounts, and the lines it discounted. The system SHALL NOT check the coupon record again, so a coupon that is expired, over its usage limit, changed or deleted SHALL still apply. The system SHALL NOT claim a coupon use again for a stored coupon.

#### Scenario: Coupon expired after the order was placed
- **WHEN** an order has a coupon that has expired since, and an admin saves an edit that changes a quantity
- **THEN** the coupon stays applied with its stored terms

#### Scenario: Coupon deleted after the order was placed
- **WHEN** an order has a coupon whose record was deleted, and an admin saves an edit
- **THEN** the coupon stays applied with its stored terms and the save succeeds

#### Scenario: Coupon rate changed after the order was placed
- **WHEN** an order has a 10% coupon, the coupon is now 20%, and an admin raises a line's quantity
- **THEN** the discount on the line is 10% of the new line subtotal

### Requirement: A stored percent coupon discounts a changed line by its stored rate
For a stored product coupon with a percent rate, a changed line that the coupon discounted SHALL be discounted by the stored rate on its new subtotal. For a stored product coupon with a fixed amount, a changed line that the coupon discounted SHALL keep its stored discount, and the discount SHALL NOT be more than the line's new subtotal.

#### Scenario: Quantity raised on a percent-discounted line
- **WHEN** a line was discounted 10% at quantity 2, and an admin raises the quantity to 3
- **THEN** the line's discount is 10% of the subtotal at quantity 3

#### Scenario: Quantity raised on a fixed-discounted line
- **WHEN** a line has a fixed product-coupon discount of 5.00, and an admin raises the quantity
- **THEN** the line's discount stays 5.00

### Requirement: A stored order-wide coupon also discounts a new line
A stored coupon with the order target SHALL discount every line of the order, including a line added in the edit. A stored coupon with the product target SHALL discount only the lines it discounted before, and SHALL NOT discount a new line, even when the new line meets the original coupon's conditions.

#### Scenario: Order-wide percent coupon and a new line
- **WHEN** an order has a 10% order-wide coupon, and an admin adds a new line
- **THEN** the new line is discounted 10%

#### Scenario: Product coupon and a new line
- **WHEN** an order has a coupon for specific products, and an admin adds a new line for a product that the coupon would have covered
- **THEN** the new line gets no discount from that coupon

### Requirement: A stored order-wide coupon keeps its stored terms
A stored percent order coupon SHALL use its stored rate on the subtotal that is left after product coupons. A stored fixed order coupon SHALL keep its stored total, capped at the subtotal that is left, and the total SHALL be shared over all lines by their subtotal. Within each pass, stored coupons SHALL be priced before new coupons, so that a new coupon takes only from what the stored coupons leave.

#### Scenario: New order-wide percent coupon added to a stored one
- **WHEN** an order with a subtotal of 100.00 has a stored 10% order-wide coupon, and an admin adds a new 20% order-wide coupon
- **THEN** the stored coupon gives 10.00 and the new coupon gives 18.00

#### Scenario: New fixed order-wide coupon added to a stored one
- **WHEN** an order with a subtotal of 100.00 has a stored fixed order-wide coupon of 95.00, and an admin adds a new fixed order-wide coupon of 20.00
- **THEN** the stored coupon keeps 95.00 and the new coupon gives 5.00

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

#### Scenario: A new coupon does not take from a stored product coupon
- **WHEN** a stored fixed product coupon of 10.00 is on a line with a subtotal of 12.00, and an admin adds a new fixed product coupon of 12.00 for the same line
- **THEN** the stored coupon keeps 10.00 and the new coupon gives 2.00

### Requirement: A removed coupon that no longer exists cannot be added again
An admin MAY remove a stored coupon in an edit. A coupon that is not on the stored order, including one that was removed in an earlier edit, SHALL be treated as a new coupon: it SHALL be checked and priced from the live coupon record, the same as order creation. So a coupon whose record was deleted cannot be applied again.

#### Scenario: Deleted coupon removed, then added again
- **WHEN** a deleted coupon is removed from an order in an edit, and an admin then sends its code on another edit
- **THEN** the code matches no coupon and is not applied

#### Scenario: Live coupon added
- **WHEN** an admin adds a code of a live coupon that is not on the order
- **THEN** the coupon is checked and priced with its live terms, and a coupon use is claimed

### Requirement: An edit keeps the order's exchange rate and tax-inclusive setting
When an edit is saved, the system SHALL convert every invoiced amount with the exchange rate stored on the order, and SHALL calculate the order with the tax-inclusive setting stored on the order. Neither SHALL change.

#### Scenario: Rate changed since the order was placed
- **WHEN** an order was placed at a rate of 0.90 and the current rate is 0.92
- **THEN** after an edit is saved, the order's exchange rate is 0.90 and its invoiced amounts are converted at 0.90

#### Scenario: Store moved to tax-inclusive prices
- **WHEN** an order was saved under tax-exclusive pricing and the store now uses tax-inclusive pricing
- **THEN** after an edit is saved, the order is still calculated and stored as tax-exclusive

### Requirement: Shipping keeps its stored charge when the address and method are the same
When the shipping country, the shipping state and the shipping method of an edit are the same as on the stored order, the system SHALL use the stored shipping charge and the stored shipping method record. It SHALL NOT check the method against the current shipping settings.

#### Scenario: Address not changed
- **WHEN** an admin saves an edit with the same shipping country, state and method, after the store's flat rate was raised
- **THEN** the shipping charge and the method name are the stored ones

### Requirement: A new shipping address or method quotes shipping again
When the shipping country or state of an edit is different from the stored order's, or another shipping method is chosen, the system SHALL quote the shipping charge and the shipping method record again from the current settings. A method that is not available for the new address SHALL fail the request with a 422 error.

#### Scenario: Address changed to another state
- **WHEN** an admin saves an edit that changes the shipping state
- **THEN** the shipping charge and the method record are quoted from the current settings for the new address

#### Scenario: Shipping method not available at the new address
- **WHEN** an admin changes the shipping country and the selected shipping method does not serve it
- **THEN** the request fails with a 422 error

### Requirement: Tax keeps its stored rates when the tax address is the same
The system SHALL use the tax rates stored on the order, for the lines and for shipping, when the country and the state of the address that tax follows are the same as on the stored order. The address that tax follows is the order's tax destination: its shipping address, its billing address or the store address. The store address never changes. Other address fields SHALL NOT count as a new address.

#### Scenario: Tax rate not changed
- **WHEN** an admin saves an edit with the same country and state, after the store's tax rate was raised
- **THEN** the tax is calculated with the stored rate

#### Scenario: Only the street changed
- **WHEN** an admin saves an edit that changes only the street and city of the address
- **THEN** the stored tax rates and the stored shipping charge are used

### Requirement: A new tax address calculates tax again
When the country or the state of the address that tax follows is different from the stored order's, the system SHALL calculate the tax rates of every line and of shipping again from the current settings.

#### Scenario: Address changed to another state
- **WHEN** an admin saves an edit that changes the state of the address that tax follows
- **THEN** the tax rates of every line are calculated from the current settings

### Requirement: Shipping tax rates survive a zero shipping charge
The system SHALL retain shipping tax rates in zero-amount tax rows when shipping is free, on creation and on edits. Split shipping tax SHALL retain each item's rate even when every item's taxable amount is zero.

#### Scenario: Free shipping is applied and later removed
- **WHEN** an order has a 10% shipping tax rate, free shipping is saved, the live rate changes to 20%, and free shipping is removed without changing the address
- **THEN** the saved zero-amount tax row still holds 10% and the restored shipping charge is taxed at 10%

#### Scenario: Free shipping at checkout
- **WHEN** a new order has taxable shipping waived by a coupon
- **THEN** its shipping tax rates are stored with zero amounts for later edits

#### Scenario: Split shipping with no taxable amount
- **WHEN** free shipping is split between items with different tax rates and every item's taxable amount is zero
- **THEN** each item retains its shipping tax rate with a zero amount

### Requirement: A new line is taxed at the current rate
A line added in an edit has no stored tax rate. When the tax address did not change, the system SHALL tax the new line at the current rate for the order's address, and SHALL keep the stored rates for the lines already on the order.

#### Scenario: Tax rate raised, new line added
- **WHEN** the store's tax rate was raised after the order was placed, and an admin adds a line without changing the address
- **THEN** the new line is taxed at the current rate and the existing lines keep the stored rate

### Requirement: An edit cannot change the order's currency
The order update endpoint SHALL keep the order's currency. A request that sends a currency code different from the order's currency SHALL fail with a 422 error. A request that sends no currency code SHALL use the order's currency.

#### Scenario: No currency sent
- **WHEN** an admin saves an edit without a currency code for an order in EUR, while the visitor's display currency is USD
- **THEN** the order stays in EUR

#### Scenario: Different currency sent
- **WHEN** an admin saves an edit of a EUR order with currency code USD
- **THEN** the request fails with a 422 error

### Requirement: Coupon discount terms are stored at checkout
The system SHALL store a percentage coupon's rate in `order_coupons.discount_rate`, otherwise null. Fixed amount-off coupons SHALL store the amount the coupon was set to when it was first applied in `order_coupons.base_max_discount_amount` (per eligible line for a product coupon, in total for an order-wide coupon), otherwise null. Edits SHALL preserve this amount separately from the applied amounts.

#### Scenario: Percent coupon at checkout
- **WHEN** an order is created with a 15% coupon
- **THEN** its order coupon row has `discount_rate` 15

#### Scenario: Fixed coupon at checkout
- **WHEN** an order is created with a fixed-amount coupon
- **THEN** its order coupon row has an empty `discount_rate`

### Requirement: Deleted variants and coupons do not block order changes
Saving an edit, and cancelling an order, SHALL succeed when the order has a line whose variant was deleted, or an order coupon whose coupon was deleted. The system SHALL skip the stock release and the coupon-usage release for those records.

#### Scenario: Cancelling an order with a deleted variant
- **WHEN** an admin cancels an order that has a line whose variant was deleted
- **THEN** the order is cancelled, stock is released for the other lines, and no error occurs

#### Scenario: Cancelling an order with a deleted coupon
- **WHEN** an admin cancels an order whose coupon was deleted
- **THEN** the order is cancelled and no error occurs

#### Scenario: Editing an order with a deleted coupon
- **WHEN** an admin saves an edit of an order whose coupon was deleted
- **THEN** the coupon stays on the order and the save succeeds

### Requirement: Preview and save use the same calculation inputs
The order calculation endpoint, order create and order update SHALL build each line's calculation input in the same way, including the variant's tax profile (or the product's tax profile when the variant has none) for a new line. So for the same payload and the same store state, the preview totals SHALL equal the saved totals.

#### Scenario: Product with its own tax profile
- **WHEN** a variant uses a tax profile with a reduced rate, and an admin previews and then saves an order with that variant
- **THEN** the saved order's tax equals the preview's tax

#### Scenario: Same payload, same result
- **WHEN** the same payload breaks a quantity, limit or stock rule
- **THEN** the preview and the save both fail with a 422 error, and when the payload breaks no rule, both succeed

### Requirement: The admin can open an order for editing only when it is editable
The order edit screen SHALL be available at the order's own edit address and SHALL show the same screen as order creation. The order detail page SHALL show an Edit action only for an order whose `is_editable` value is true. When the edit screen opens for an order whose `is_editable` value is false, it SHALL show a blocked state and SHALL NOT show the edit form.

#### Scenario: Editable order
- **WHEN** an admin opens an unpaid, open, unshipped order
- **THEN** the detail page shows the Edit action
- **AND** the Edit action opens the edit screen for that order

#### Scenario: Paid order
- **WHEN** an admin opens a paid order
- **THEN** the detail page does not show the Edit action

#### Scenario: Edit address opened for a shipped order
- **WHEN** an admin opens the edit address of an order that is not editable
- **THEN** the screen shows a blocked state and no form

#### Scenario: Order not found
- **WHEN** the order cannot be loaded
- **THEN** the screen shows an error state with a retry action

### Requirement: The edit form starts from the stored order
The edit screen SHALL fill the form from the order detail: its lines, customer, shipping and billing addresses, shipping method, coupons, notes and flags. The screen SHALL send an existing line with its `id` and a new line with its variant and no `id`. Each price preview SHALL include the order's ID. Saving SHALL update the order and then show the order detail page.

#### Scenario: Form filled
- **WHEN** an admin opens the edit screen of an order with two lines and one coupon
- **THEN** the form shows the two lines at their stored quantities and the coupon

#### Scenario: Existing line sent with ID
- **WHEN** an admin changes the quantity of a stored line and previews or saves
- **THEN** the request holds that line with its `id`

#### Scenario: New line sent without ID
- **WHEN** an admin adds a variant that is not on the order and previews or saves
- **THEN** the request holds that line with its variant and no `id`

#### Scenario: Save succeeds
- **WHEN** an admin saves a valid edit
- **THEN** the order is updated and the screen shows the order detail page

#### Scenario: Save refused by the server
- **WHEN** the server rejects the save with a validation error
- **THEN** the screen stays open, shows the error on the related field or as a message, and keeps the admin's changes

### Requirement: Stored lines show their stored values
A stored line on the edit screen SHALL show the name, variant label, image and unit price stored on the order line, and SHALL NOT read them from the current product. A line added in the edit SHALL show the current product data from the product picker.

#### Scenario: Product renamed after the order
- **WHEN** a product was renamed after the order was placed
- **THEN** the stored line still shows the name stored on the order

### Requirement: A line that is not reachable can only be removed
When the price preview marks a line as not reachable, the edit screen SHALL NOT show a quantity control for it and SHALL show its stored quantity. The admin SHALL still be able to remove the line.

#### Scenario: Unreachable line
- **WHEN** a line's product was moved to draft
- **THEN** the line shows its quantity without a quantity control
- **AND** the remove action works

#### Scenario: Reachable line
- **WHEN** a line is reachable
- **THEN** the line shows a quantity control

### Requirement: The quantity control follows stock and per-order limits
The quantity control of a line SHALL take its ceiling from the stock and limit data of the price preview for that line:
- The stock ceiling is the available quantity. It applies only when the variant tracks inventory and does not allow back orders.
- The per-order ceiling is the maximum per order. It applies only when the variant has a per-order limit.
- When both apply, the smaller ceiling is used.

For a stored line, the ceiling SHALL NOT be lower than the stored quantity, and the admin SHALL always be able to lower the quantity. For a line added in the edit, the ceiling is the plain ceiling. When the ceiling is reached, the control SHALL refuse a further increase and tell the admin why.

#### Scenario: Stock ceiling on a new line
- **WHEN** a new line's variant tracks inventory, does not allow back orders and has 3 units available
- **THEN** the quantity cannot be raised above 3

#### Scenario: Back orders allowed
- **WHEN** a variant allows back orders
- **THEN** its available stock does not limit the quantity

#### Scenario: Stock not tracked
- **WHEN** a variant does not track inventory
- **THEN** its available stock does not limit the quantity

#### Scenario: Per-order limit on a new line
- **WHEN** a new line's variant has a per-order limit of 2 and stock of 10
- **THEN** the quantity cannot be raised above 2

#### Scenario: Smaller ceiling wins
- **WHEN** a variant has 5 units available and a per-order limit of 3
- **THEN** the quantity cannot be raised above 3

#### Scenario: Stored quantity above the new limit
- **WHEN** a stored line has quantity 4 and the variant's per-order limit is now 2
- **THEN** the line keeps quantity 4 when the form opens
- **AND** the admin can lower it
- **AND** the admin cannot raise it above 4

#### Scenario: Stored line on a sold-out variant
- **WHEN** a stored line has quantity 5 and the variant now has 0 units available
- **THEN** the line keeps quantity 5 and the admin can lower it
- **AND** the admin cannot raise it

### Requirement: The edit screen shows the order timeline and flags
The edit screen SHALL show the order timeline, as the order detail page does, and SHALL show the order's flags for editing. A timeline comment SHALL be saved at once. A change to the flags SHALL be saved with the rest of the edit.

#### Scenario: Timeline shown
- **WHEN** an admin opens the edit screen of an order
- **THEN** the screen shows the timeline of that order

#### Scenario: Comment added
- **WHEN** an admin adds a timeline comment on the edit screen
- **THEN** the comment is saved at once and the edit stays unsaved

#### Scenario: Flag changed
- **WHEN** an admin adds a flag and saves the edit
- **THEN** the order is saved with the new flag

#### Scenario: Flag changed and edit cancelled
- **WHEN** an admin adds a flag and leaves the screen without saving
- **THEN** the order keeps its old flags

### Requirement: Preview results are matched to lines by line identity
On the edit screen, each price preview line SHALL be matched to a form line by the stored line's `id`. A line added in the edit SHALL be matched by its position among the new lines. A quantity that the server changes in the preview SHALL be shown on the matching line.

#### Scenario: Line removed from the middle
- **WHEN** an admin removes the first of three stored lines
- **THEN** the preview data for the other two lines stays on the correct lines
