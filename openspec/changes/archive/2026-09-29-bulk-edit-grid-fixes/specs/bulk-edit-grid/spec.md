## MODIFIED Requirements

### Requirement: Variant columns presented by the grid

The grid SHALL present exactly the following columns, in order: Variants, Price, Sale Price, Cost of Goods, Profit, Margin, Unit price, Base price per unit, SKU, Dimension, Weight, Track Inventory, Availability, Committed, Low Stock Threshold, Limit Purchase, Limit, Visibility, Charge Tax, Tax profile, Shipping Profile.

The Variants column SHALL show the variant's image and its identity as `{Product Title} - {Attribute Value 1} | {Attribute Value 2}` (one segment per attribute the variant carries, joined with ` | `), e.g. "Sample Product Title - Red | XL". A variant with no attributes (a simple product) SHALL show just the product title, with no trailing separator. Profit, Margin, and Committed SHALL be read-only. Profit and Margin SHALL be derived from the row's current price, sale price, and cost of goods rather than stored. Weight SHALL present its amount and unit as one column. Dimension SHALL select a shipping box and SHALL display the chosen box's name and its length, width, and height.

Tax profile and Shipping Profile options SHALL be sourced from the tax-profile and shipping-profile collections. The grid MUST NOT present hardcoded, fictional, or empty option lists for these fields.

#### Scenario: Derived columns react to edits

- **WHEN** the merchant changes a row's price, sale price, or cost of goods
- **THEN** that row's Profit and Margin update to reflect the new values
- **AND** neither Profit nor Margin can be edited directly

#### Scenario: Profile options come from the store's own records

- **WHEN** the merchant opens the Tax profile or Shipping Profile control on any row
- **THEN** the options listed are the store's configured tax profiles or shipping profiles
- **AND** selecting one records that profile on the row

#### Scenario: SKU is editable

- **WHEN** the merchant activates a SKU cell and types a value
- **THEN** the new SKU is recorded on that row

#### Scenario: Variant identity shows product title and attribute values

- **WHEN** the merchant views a Variants cell for a variant of "Sample Product" with attribute values Red and XL
- **THEN** the cell reads "Sample Product - Red | XL"

#### Scenario: Simple product identity shows only the title

- **WHEN** the merchant views a Variants cell for a simple product's variant with no attributes
- **THEN** the cell reads just the product's title, with no trailing separator

### Requirement: Cell selection within a column

The merchant SHALL be able to select cells within a single column in three ways: dragging across cell bodies, shift-clicking another cell to extend a contiguous range from the anchor, or Cmd/Ctrl-clicking individual cells to build a non-contiguous selection of rows. Selecting cells MUST NOT change any value. A selection SHALL never span more than one column; selecting a cell in a different column SHALL start a new selection there.

Cmd/Ctrl-clicking a row already in the selection SHALL remove that row from the selection (toggle off), including a row in the middle of a previously dragged or shift-extended range. Cmd/Ctrl-clicking a row not in the selection SHALL add it, and dragging while Cmd/Ctrl is held SHALL extend that newly added chunk.

A plain click (no modifier) on any cell — whether or not it is already part of the current selection — SHALL replace the selection with just that single cell and make it active. The selection is only extended or preserved via Shift-click or Cmd/Ctrl-click, per above; a plain click never preserves a prior multi-cell selection.

Read-only columns and the Variants column SHALL NOT be selectable.

#### Scenario: Shift-click extends a range without changing values

- **WHEN** the merchant clicks a Price cell and then shift-clicks a Price cell eight rows below
- **THEN** all nine cells in that range are marked as selected
- **AND** none of their values change

#### Scenario: Dragging across cell bodies selects a range

- **WHEN** the merchant presses on a Price cell and drags down across other Price cells
- **THEN** the cells passed over are marked as selected
- **AND** none of their values change

#### Scenario: Selecting in another column starts over

- **WHEN** a range is selected in Price and the merchant shift-clicks a Sale Price cell
- **THEN** the Price selection is cleared
- **AND** a new selection begins in Sale Price

#### Scenario: Read-only columns cannot be selected

- **WHEN** the merchant presses on a Profit, Margin, Committed, or Variants cell
- **THEN** no selection is started

#### Scenario: Cmd/Ctrl-click builds a non-contiguous selection

- **WHEN** the merchant clicks a Price cell on row 2, then Cmd/Ctrl-clicks Price cells on rows 5 and 9
- **THEN** rows 2, 5, and 9 are all marked as selected
- **AND** rows 3, 4, 6, 7, and 8 remain unselected

#### Scenario: Cmd/Ctrl-click toggles a selected row off

- **WHEN** the merchant has selected Price rows 2, 5, and 9 via Cmd/Ctrl-click and Cmd/Ctrl-clicks row 5 again
- **THEN** row 5 is no longer selected
- **AND** rows 2 and 9 remain selected

#### Scenario: Cmd/Ctrl-click toggles a row out of the middle of a dragged range

- **WHEN** the merchant drags to select Price rows 3 through 7 and then Cmd/Ctrl-clicks row 5
- **THEN** row 5 is no longer selected
- **AND** rows 3, 4, 6, and 7 remain selected

#### Scenario: Clicking any cell collapses the selection to it

- **WHEN** the merchant has a multi-row Price selection and plain-clicks a cell already within it
- **THEN** the selection collapses to just that clicked cell
- **AND** that cell becomes active

#### Scenario: Clicking outside the selection replaces it

- **WHEN** the merchant has a Price selection and clicks a Price cell outside that selection
- **THEN** the previous selection is cleared
- **AND** a new selection starts at the clicked cell

#### Scenario: Clicking outside the grid clears the selection

- **WHEN** the merchant has a selection and clicks outside the grid
- **THEN** the selection is cleared entirely

### Requirement: Two-stage cell editing

A text, number, or money cell SHALL require two distinct actions before its control accepts typed input: a click selects the cell without focusing its underlying control (so a click-and-drag from an unfocused cell still selects a range rather than editing text), and the first printable keystroke typed while that cell is selected SHALL focus the control and replace its entire existing value with that keystroke, discarding what was there. A double-click, or pressing Enter on a selected cell, SHALL instead activate it with the existing value intact and the cursor placed, without clearing it. Editing an active cell that belongs to a multi-cell selection SHALL fan the new value out to every selected cell in that column. Pressing Escape or interacting outside the cell SHALL deactivate it. At most one cell SHALL be active at a time.

Select-like cells (per Borderless select-like cells) and checkbox cells (per Checkbox click and keyboard toggle) do not accept typed replacement text and are governed by their own requirements instead, but still share the "first click only selects" behavior for any interaction that is not their own direct-activation path.

#### Scenario: First press selects without focusing

- **WHEN** the merchant clicks a Price cell that was not selected
- **THEN** the cell is selected
- **AND** its input does not receive focus, so dragging from here selects rather than editing text

#### Scenario: Typing on a selected cell replaces its value

- **WHEN** the merchant selects a Price cell holding 19.99 and types "5"
- **THEN** the cell's input becomes focused and its value becomes "5", not "19.995" or "519.99"

#### Scenario: Double-click or Enter edits in place without clearing

- **WHEN** the merchant double-clicks a Price cell holding 19.99, or selects it and presses Enter
- **THEN** the cell becomes active with its input focused and the value still 19.99, cursor placed in the text

#### Scenario: Activating a cell within a non-contiguous selection fans the edit out

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9 and types a new value into row 5's selected cell
- **THEN** rows 2, 5, and 9 all take the new value

#### Scenario: Escape deactivates

- **WHEN** a cell is active and the merchant presses Escape
- **THEN** the cell stops being active and no further typing reaches it

## ADDED Requirements

### Requirement: Checkbox click and keyboard toggle

Clicking directly on a checkbox cell's checkbox glyph SHALL toggle its checked state and SHALL also make that cell the active/selected cell. Clicking elsewhere within a checkbox cell (not the glyph itself) SHALL only select the cell, without toggling it. Pressing Space while one or more checkbox cells in a column are selected SHALL toggle them, fanning the resulting checked state out to every selected cell in that column the same way a typed value fans out for other field kinds.

#### Scenario: Clicking the glyph toggles and selects

- **WHEN** the merchant clicks directly on an unchecked Track Inventory checkbox
- **THEN** the checkbox becomes checked
- **AND** that cell becomes the active/selected cell

#### Scenario: Clicking elsewhere in the cell only selects

- **WHEN** the merchant clicks inside a Track Inventory cell but not on the checkbox glyph
- **THEN** the cell is selected
- **AND** the checkbox's checked state does not change

#### Scenario: Space fans a toggle out to the whole selection

- **WHEN** the merchant has a multi-row Track Inventory selection and presses Space
- **THEN** every selected row's checkbox takes the same resulting checked state
