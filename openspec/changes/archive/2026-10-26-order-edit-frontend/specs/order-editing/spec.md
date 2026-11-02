## ADDED Requirements

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
