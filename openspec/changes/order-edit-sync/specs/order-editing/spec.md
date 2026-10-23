# Spec Delta

## Purpose

Defines when an admin can edit an existing order, and how saving an edit syncs the order's lines, prices, coupons, shipping, tax mode, currency and exchange rate to the store's current state.

## ADDED Requirements

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

### Requirement: An edit uses the current variant price for every line
When an edit is saved, every line SHALL take the current price, the current regular price, the current catalog prices, the current name, SKU, barcode, image, weight and product snapshot of its variant. Lines already on the order SHALL NOT keep their old price.

#### Scenario: Price raised after the order was placed
- **WHEN** a line was saved at a sale price of 25.00, the variant's sale price is now 28.00, and an admin saves an edit that changes only the shipping address
- **THEN** the line's unit price is 28.00 and its subtotal and total are calculated from 28.00

#### Scenario: Unit price and totals agree
- **WHEN** an admin saves an edit that changes a line's quantity from 2 to 3 after a price change
- **THEN** the line's stored unit price, regular price and catalog prices are all the current ones, and its subtotal is calculated from that same unit price

### Requirement: An edit removes lines whose variant was deleted
When an edit is saved, a line whose variant or product no longer exists SHALL be removed from the order. The system MUST NOT try to release stock for that line.

#### Scenario: Product deleted after the order was placed
- **WHEN** an order has a line whose product was deleted, and an admin saves an edit of that order
- **THEN** the saved order no longer has that line, the totals do not include it, and the save succeeds

#### Scenario: Only the deleted line is affected
- **WHEN** an order has one deleted line and one live line, and an admin saves an edit
- **THEN** the live line stays on the order and only the deleted line is removed

### Requirement: Lines whose product is no longer published can still be edited
A line already on the order whose product is now draft, scheduled or trashed, or whose variant is hidden, SHALL stay on the order. Its quantity SHALL be changeable under the same stock and limit rules as any other line.

#### Scenario: Product moved to draft
- **WHEN** a line's product was moved to draft after the order was placed, and an admin raises that line's quantity within available stock
- **THEN** the edit is saved with the new quantity at the current price

### Requirement: New lines accept only products that can be bought
A line added in an edit SHALL follow the same availability rule as order creation. The variant must exist and be visible, and its product must be published. Otherwise, the request SHALL fail with a validation error.

#### Scenario: Adding a draft product
- **WHEN** an admin adds a new line for a variant whose product is a draft
- **THEN** the request fails with a validation error

### Requirement: A variant can appear on only one line
The order calculation, order create and order update endpoints SHALL reject a payload in which two lines have the same variant, with a 422 validation error.

#### Scenario: Same variant sent twice
- **WHEN** a payload holds two lines with the same variant ID
- **THEN** the request fails with a 422 error

#### Scenario: Adding a variant already on the order
- **WHEN** an admin sends the existing line for a variant and also a new line for the same variant
- **THEN** the request fails with a 422 error

### Requirement: The per-order limit applies to the full line quantity
When an edit or create is saved, the system SHALL reject a line whose full quantity is more than the variant's current per-order limit, when the variant has a limit. This SHALL also apply to lines already on the order.

#### Scenario: Limit lowered after the order was placed
- **WHEN** a line has quantity 5, the variant's per-order limit is now 3, and an admin saves an edit
- **THEN** the save fails with a 422 error until the line's quantity is 3 or less

### Requirement: Stock is checked only for the quantity added
When an edit is saved, the system SHALL check and reserve stock only for the quantity added to a line already on the order, and for the full quantity of a new line. It SHALL release stock for the quantity taken off a line and for a removed line whose variant still exists.

#### Scenario: Unchanged line on a sold-out variant
- **WHEN** a line has quantity 5, the variant now has 0 available stock, and an admin saves an edit that does not change that line
- **THEN** the save succeeds and no stock moves for that line

#### Scenario: Quantity raised beyond stock
- **WHEN** a line has quantity 2, the variant has 1 available unit and does not allow back orders, and an admin raises the quantity to 4
- **THEN** the save fails with an insufficient-stock error and nothing on the order changes

#### Scenario: Quantity lowered
- **WHEN** an admin lowers a line from 5 to 2
- **THEN** 3 units of stock are released for that variant

### Requirement: An edit cannot change the order's currency
The order update endpoint SHALL keep the order's currency. A request that sends a currency code different from the order's currency SHALL fail with a 422 error. A request that sends no currency code SHALL use the order's currency.

#### Scenario: No currency sent
- **WHEN** an admin saves an edit without a currency code for an order in EUR, while the visitor's display currency is USD
- **THEN** the order stays in EUR

#### Scenario: Different currency sent
- **WHEN** an admin saves an edit of a EUR order with currency code USD
- **THEN** the request fails with a 422 error

### Requirement: An edit converts amounts with the current exchange rate
When an edit is saved, the system SHALL convert every invoiced amount with the current exchange rate from the base currency to the order's currency, and SHALL store that rate on the order.

#### Scenario: Rate changed since the order was placed
- **WHEN** an order was placed at a rate of 0.90 and the current rate is 0.92
- **THEN** after an edit is saved, the order's exchange rate is 0.92 and its invoiced amounts are converted at 0.92

### Requirement: An edit applies the current tax mode
When an edit is saved, the system SHALL calculate the order in the store's current tax-inclusive setting and SHALL store that setting on the order.

#### Scenario: Store moved to tax-inclusive prices
- **WHEN** an order was saved under tax-exclusive pricing and the store now uses tax-inclusive pricing
- **THEN** after an edit is saved, the order is calculated and stored as tax-inclusive

### Requirement: An edit refreshes the shipping method record
When an edit is saved, the system SHALL store the selected shipping method's current ID, name and type on the order.

#### Scenario: Shipping method renamed
- **WHEN** the order's shipping method was renamed in the settings and an admin saves an edit
- **THEN** the order shows the method's new name

### Requirement: An order's own coupon use does not count against the coupon's total limit
When the system checks a coupon's total usage limit for an order that already holds an active use of that coupon, it SHALL NOT count that order's own use. This SHALL apply to the calculation preview and to the save.

#### Scenario: The order took the last use
- **WHEN** a coupon has a limit of 10 and 10 uses, one of them by this order, and an admin edits this order
- **THEN** the coupon stays applied

#### Scenario: Another order took the last use
- **WHEN** a coupon has a limit of 10 and 10 uses, none of them by this order, and an admin adds the coupon in an edit
- **THEN** the coupon is not applied

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
- **THEN** the coupon is removed from the order and the save succeeds

### Requirement: Preview and save use the same calculation inputs
The order calculation endpoint, order create and order update SHALL build each line's calculation input in the same way, including the variant's tax profile (or the product's tax profile when the variant has none). So for the same payload and the same store state, the preview totals SHALL equal the saved totals.

#### Scenario: Product with its own tax profile
- **WHEN** a variant uses a tax profile with a reduced rate, and an admin previews and then saves an order with that variant
- **THEN** the saved order's tax equals the preview's tax
