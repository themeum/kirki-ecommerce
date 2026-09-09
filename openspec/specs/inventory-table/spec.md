# inventory-table Specification

## Purpose

Defines the Inventory screen's listing: that it reports stock rather than edits
it, which columns it presents, how each cell derives its content from a variant,
and what the variant list response must carry to feed them.

## Requirements

### Requirement: The inventory table is read-only

The inventory table SHALL NOT offer any control for changing a variant's values.
No cell SHALL accept text entry, and the screen SHALL NOT present a save or
discard action, nor change its heading in response to viewing or selecting rows.

Editing SHALL remain reachable from this screen by selecting rows and invoking
the bulk-edit action, which navigates to the bulk-edit screen.

#### Scenario: No cell accepts input

- **WHEN** a merchant clicks any cell in the inventory table
- **THEN** no editable field appears and no value can be changed

#### Scenario: Heading is stable

- **WHEN** a merchant selects rows or interacts with the table
- **THEN** the page heading continues to read "Inventory"
- **AND** no save or discard action is offered

#### Scenario: Editing is reached through bulk edit

- **WHEN** a merchant selects one or more rows and applies the bulk-edit action
- **THEN** they are taken to the bulk-edit screen for the selected variants

### Requirement: The inventory table has five columns

The inventory table SHALL present exactly five data columns, in order: Variants,
Price, SKU, Available, Committed, preceded by a selection checkbox. It SHALL NOT
present a Sale Price, Cost of Goods, or Profit column.

The column-visibility control SHALL offer these five columns, all shown by
default.

#### Scenario: Column set

- **WHEN** a merchant views the inventory table
- **THEN** the columns are a selection checkbox, Variants, Price, SKU,
  Available, and Committed
- **AND** no Sale Price, Cost of Goods, or Profit column is shown

#### Scenario: Hiding a column

- **WHEN** a merchant deselects a column in the column-visibility control
- **THEN** that column is removed from the table and the remaining columns keep
  their order

### Requirement: The Variants column identifies the variant

The Variants column SHALL show the variant's image, its product's name, and its
attribute values.

The image SHALL fall back to a placeholder when the variant and its product both
have none. The attribute values SHALL be presented as a single line separated by
a pipe character, with the separator visually distinguished from the values. A
variant with no attribute values SHALL show a fallback in place of the attribute
line rather than an empty line.

#### Scenario: A variant with attributes

- **WHEN** a variant has the attribute values Small, Red and Cotton
- **THEN** its row shows the product name, and below it "Small | Red | Cotton"
- **AND** the pipe separators are visually distinguished from the values

#### Scenario: A variant with no image

- **WHEN** neither a variant nor its product has an image
- **THEN** a placeholder image is shown in its place

#### Scenario: A variant with no attributes

- **WHEN** a variant has no attribute values
- **THEN** the attribute line shows a fallback rather than being blank

### Requirement: The Price column shows the effective price

The Price column SHALL show the variant's price formatted with its currency
symbol, in the currency resolved for display.

Where a variant has a sale price that differs from its regular price, the column
SHALL show the sale price alongside the regular price struck through. Where it
has none, the column SHALL show the regular price alone.

#### Scenario: A variant with no sale price

- **WHEN** a variant's price is 79.99 and it has no sale price
- **THEN** the Price cell reads "$79.99"

#### Scenario: A variant on sale

- **WHEN** a variant's regular price is 29.00 and its sale price is 19.99
- **THEN** the Price cell shows "$19.99" with "$29.00" struck through

### Requirement: The SKU column shows the SKU or a dash

The SKU column SHALL show the variant's SKU as plain text. Where a variant has
no SKU, the cell SHALL show a dash.

#### Scenario: A variant with a SKU

- **WHEN** a variant's SKU is "2637634756"
- **THEN** the SKU cell reads "2637634756"

#### Scenario: A variant without a SKU

- **WHEN** a variant has no SKU
- **THEN** the SKU cell shows a dash

### Requirement: The Available column reflects stock state, not just quantity

The Available column SHALL show a variant's stock state as resolved by the
store's availability rules, which are the same rules the product listing uses.
The two screens SHALL NOT disagree about a variant's state.

Where a variant does not track inventory, the column SHALL show its availability
label — In Stock or Out of Stock — in the colour that label carries elsewhere in
the admin: success for in stock, critical for out of stock.

Where a variant tracks inventory, the column SHALL show its available quantity,
coloured critical when the variant's resolved state is low stock or out of
stock, and otherwise in the default text colour.

#### Scenario: An untracked variant that is in stock

- **WHEN** a variant does not track inventory and is marked in stock
- **THEN** the Available cell reads "In Stock" in the success colour

#### Scenario: An untracked variant that is out of stock

- **WHEN** a variant does not track inventory and is not marked in stock
- **THEN** the Available cell reads "Out of Stock" in the critical colour

#### Scenario: A tracked variant with stock

- **WHEN** a variant tracks inventory, has 500 available, and its resolved state
  is in stock
- **THEN** the Available cell reads "500" in the default text colour

#### Scenario: A tracked variant at or below its low-stock threshold

- **WHEN** a variant tracks inventory, has 3 available, and its resolved state is
  low stock
- **THEN** the Available cell reads "3" in the critical colour

#### Scenario: A tracked variant with nothing available

- **WHEN** a variant tracks inventory and has 0 available
- **THEN** the Available cell reads "0" in the critical colour

### Requirement: The Committed column shows a dash when a count is meaningless

The Committed column SHALL show the variant's committed quantity. It SHALL show
a dash instead where that quantity is absent or zero, or where the variant does
not track inventory — cases in which a committed count carries no information.

#### Scenario: A tracked variant with committed stock

- **WHEN** a variant tracks inventory and has 450 committed
- **THEN** the Committed cell reads "450"

#### Scenario: A tracked variant with nothing committed

- **WHEN** a variant tracks inventory and has 0 committed
- **THEN** the Committed cell shows a dash

#### Scenario: An untracked variant

- **WHEN** a variant does not track inventory
- **THEN** the Committed cell shows a dash regardless of any committed quantity

### Requirement: The variant list response carries the fields the listing needs

Each entry in the variant list response SHALL carry the variant's identifier and
SKU; its display-currency price and sale price, each as both an amount and a
money object; its attribute value labels as an array of strings; whether it
tracks inventory; its available and committed quantities; its resolved
availability status and the translated label for that status; and its product's
identifier, name, and image.

**BREAKING**: Each entry SHALL NOT carry a pre-joined attribute name string, a
stock-quantity field, base-currency price fields, or any cost-of-goods field.
Consumers reading those keys will no longer find them.

#### Scenario: A listed variant carries its stock fields

- **WHEN** a client requests the variant list
- **THEN** each entry reports whether it tracks inventory, its available
  quantity, its committed quantity, and its resolved availability status and
  label

#### Scenario: Attribute labels arrive as an array

- **WHEN** a variant has the attribute values Small, Red and Cotton
- **THEN** its entry carries those three labels as separate array elements, not
  as one joined string

#### Scenario: Removed fields are absent

- **WHEN** a client requests the variant list
- **THEN** no entry carries a stock-quantity, base-currency price, or
  cost-of-goods field
