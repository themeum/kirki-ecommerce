## MODIFIED Requirements

### Requirement: The admin can open an order for editing only when it is editable
The order edit screen SHALL be available at the order's own edit address and SHALL show the same screen as order creation. The order detail page SHALL show an Edit action only for an order whose `is_editable` value is true. The edit screen SHALL load the order with the edit read. When the edit read is refused because the order cannot be edited, or when the loaded order has an `is_editable` value of false, the screen SHALL show a blocked state and SHALL NOT show the edit form. The screen SHALL NOT retry a refused edit read on its own.

#### Scenario: Editable order
- **WHEN** an admin opens an unpaid, open, unshipped order
- **THEN** the detail page shows the Edit action
- **AND** the Edit action opens the edit screen for that order

#### Scenario: Paid order
- **WHEN** an admin opens a paid order
- **THEN** the detail page does not show the Edit action

#### Scenario: Edit address opened for a shipped order
- **WHEN** an admin opens the edit address of an order that is not editable
- **THEN** the edit read fails with a 422 error
- **AND** the screen shows a blocked state and no form

#### Scenario: Order not found
- **WHEN** the edit read fails with a 404 error or cannot be completed
- **THEN** the screen shows an error state with a retry action

#### Scenario: Refused edit read is not retried
- **WHEN** the edit read fails with a 422 error
- **THEN** the screen sends the edit read once and does not repeat it until the admin asks

### Requirement: The edit form starts from the stored order
The edit screen SHALL fill the form from the edit read of the order: its lines, customer, shipping and billing addresses, shipping method, coupons, notes and flags. The screen SHALL send an existing line with its `id` and a new line with its variant and no `id`. Each price preview SHALL include the order's ID. Saving SHALL update the order and then show the order detail page. After a save, the screen SHALL NOT keep a stale edit read for that order.

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

#### Scenario: Edit opened again after a save
- **WHEN** an admin saves an edit and opens the edit screen of the same order again
- **THEN** the screen reads the order again from the edit read and does not show the values of the earlier read

#### Scenario: Save refused by the server
- **WHEN** the server rejects the save with a validation error
- **THEN** the screen stays open, shows the error on the related field or as a message, and keeps the admin's changes

### Requirement: A line that is not reachable can only be removed
A line is locked when the edit read or the latest price preview marks it as not reachable. The latest price preview for that line SHALL take precedence once it exists. A locked line on the edit screen SHALL NOT show a quantity control and SHALL show its stored quantity. The admin SHALL still be able to remove the line. The lock SHALL apply from the first display of the form, before any price preview.

#### Scenario: Unreachable line
- **WHEN** a line's product was moved to draft
- **THEN** the line shows its quantity without a quantity control
- **AND** the remove action works

#### Scenario: Unreachable line before the first preview
- **WHEN** the edit screen opens for an order that has a line whose variant was deleted
- **THEN** the line is locked at once, before any price preview returns

#### Scenario: Reachable line
- **WHEN** a line is reachable
- **THEN** the line shows a quantity control

### Requirement: The quantity control follows stock and per-order limits
The quantity control of a line SHALL take its ceiling from the stock and limit data of the latest price preview for that line. Until a price preview returns for a stored line, the control SHALL take the ceiling from the stock and limit data of the edit read for that line. For a stored line whose variant was deleted, the edit read has no stock or limit data, and the line SHALL have no ceiling.
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

#### Scenario: Stored line limited before the first preview
- **WHEN** the edit screen opens for a stored line whose variant tracks inventory, does not allow back orders and has 6 units available, and the line has quantity 2
- **THEN** the quantity cannot be raised above 6 before any price preview returns

#### Scenario: Stored line with a deleted variant
- **WHEN** the edit screen opens for a stored line whose variant was deleted
- **THEN** the line has no quantity ceiling and the screen does not fail

## ADDED Requirements

### Requirement: Shipping choices are available before the first price preview
The edit screen SHALL offer the `available_shipping_methods` of the edit read as the shipping choices when the form is filled, and SHALL keep that list until a price preview returns. Each price preview that returns SHALL replace the list with its own shipping methods, and the list SHALL stay until the next preview replaces it.

#### Scenario: Shipping popover before the first preview
- **WHEN** the edit screen opens for an order and no price preview has returned
- **THEN** the shipping choices list the methods of the edit read, each with its cost

#### Scenario: Shipping popover after a preview
- **WHEN** a price preview returns after the admin changes a line
- **THEN** the shipping choices list the methods of that preview

#### Scenario: Preview list replaces the edit read list
- **WHEN** a price preview returns a shipping list that differs from the list of the edit read
- **THEN** the shipping choices list only the methods of the preview, and do not merge both lists

#### Scenario: Order created without the edit read
- **WHEN** the admin opens the order create screen
- **THEN** the screen does not send an edit read and offers only the shipping methods of price previews
