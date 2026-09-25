## Purpose

Defines the Price card's structure and its progressive disclosure of optional
pricing rows, so a merchant sees only the pricing controls their product
actually uses and what the card shows always matches what the product stores.

## ADDED Requirements

### Requirement: Price card structure

The Price card SHALL present a single price amount input as its first and only
always-visible field, followed by any shown optional pricing rows, followed by a
control to add each optional row that is not currently shown, followed by a
separator and a charge-tax row.

When shown, the optional rows SHALL appear in this order: sale price, unit
price, then cost and profit. The price input SHALL NOT carry a visible field
label of its own — the card's title names it — and SHALL retain an accessible
name for assistive technology. Money inputs SHALL keep their currency symbol
prefix.

#### Scenario: A product with no optional pricing

- **WHEN** a merchant opens the Price card for a product that has only a price
- **THEN** the card shows the price input and a control to add each of sale
  price, unit price, and cost and profit
- **AND** no sale price, unit price, or cost field is shown

#### Scenario: Rows appear in the defined order

- **WHEN** more than one optional row is shown
- **THEN** they appear in the order sale price, unit price, cost and profit,
  regardless of the order in which they were added

### Requirement: Adding an optional pricing row

Activating an optional row's add control SHALL reveal that row and move focus
to its first input, so the merchant can type immediately without a second
interaction. Once a row is shown, its add control SHALL NOT be offered.

#### Scenario: Adding a row focuses its field

- **WHEN** the merchant activates the control to add sale price
- **THEN** the sale price row appears
- **AND** focus is in the sale price input

#### Scenario: A shown row is not offered again

- **WHEN** the sale price row is shown
- **THEN** no control to add sale price is offered

### Requirement: Removing an optional pricing row clears its values

Each shown optional row SHALL offer a remove control. Activating it SHALL hide
the row and clear every value that row edits, so that saving the form persists
no data for those fields.

Removing the sale price row SHALL clear the sale price. Removing the unit price
row SHALL clear all four unit fields — total unit amount, total unit, base unit
amount, and base unit. Removing the cost and profit row SHALL clear the cost per
item; profit and margin are derived and therefore blank with it.

#### Scenario: Removing a row discards its data

- **WHEN** a product has a sale price and the merchant removes the sale price row
  and saves
- **THEN** the product is saved with no sale price

#### Scenario: Removing unit price clears every unit field

- **WHEN** the merchant removes the unit price row
- **THEN** total unit amount, total unit, base unit amount, and base unit are all
  cleared

### Requirement: Row visibility follows stored values on load, then the merchant

An optional row SHALL be shown when the card loads if the product already holds
a value for that row. After the card has loaded, only the add and remove
controls SHALL change whether a row is shown.

Emptying a row's input MUST NOT hide the row, so a field never disappears while
the merchant is editing it.

#### Scenario: Existing data is visible without being sought

- **WHEN** a merchant opens a product that has a sale price and a cost per item
- **THEN** the sale price row and the cost and profit row are both shown with
  their values
- **AND** the unit price row is not shown

#### Scenario: Clearing an input leaves the row in place

- **WHEN** the merchant selects the contents of the sale price input and deletes
  them
- **THEN** the sale price row is still shown, with an empty input

### Requirement: Discount badge on the sale price row

The sale price row SHALL display a discount badge stating the whole-number
percentage below the price, rounded to the nearest percent.

The badge SHALL be displayed only when the price is greater than zero and the
sale price is greater than zero and less than the price. It MUST NOT be shown
for a sale price equal to or above the price, nor for an absent or zero price.

#### Scenario: A genuine discount is summarised

- **WHEN** the price is 29.00 and the sale price is 26.10
- **THEN** the sale price row shows a badge reading `10% off`

#### Scenario: No badge without a discount

- **WHEN** the sale price is empty, zero, equal to the price, or greater than the
  price
- **THEN** no discount badge is shown

### Requirement: Profit and margin are presented as derived values

Profit and margin SHALL be presented as read-only text rather than as input
controls, and SHALL be derived from the current price, sale price, and cost per
item. Neither SHALL be editable, and neither SHALL be stored.

#### Scenario: Derived values react to edits

- **WHEN** the merchant changes the price, the sale price, or the cost per item
  while the cost and profit row is shown
- **THEN** the displayed profit and margin update to reflect the new values
- **AND** neither can be edited directly

### Requirement: Charge tax row

The Price card SHALL present a charge-tax checkbox below a separator, as a plain
row rather than a shaded panel. When charge tax is checked, the row SHALL also
present a tax profile select listing the store's tax profiles and allowing a new
profile to be created. The select MUST NOT reserve layout space while hidden.

#### Scenario: Tax profile appears only when charging tax

- **WHEN** charge tax on this product is unchecked
- **THEN** the row shows only the checkbox and its label

#### Scenario: Choosing or creating a tax profile

- **WHEN** charge tax on this product is checked
- **THEN** a tax profile select appears
- **AND** the merchant can choose an existing profile or create a new one
