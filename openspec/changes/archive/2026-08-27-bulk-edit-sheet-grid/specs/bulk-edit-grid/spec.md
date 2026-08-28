## Purpose

Defines the spreadsheet surface merchants use to edit many product variants at once: which columns exist, how the grid stays responsive at catalogue scale, and how cells are selected, filled, and activated for editing.

## ADDED Requirements

### Requirement: Variant columns presented by the grid

The grid SHALL present exactly the following columns, in order: Variants, Price, Sale Price, Cost of Goods, Profit, Margin, Unit price, Base price per unit, SKU, Dimension, Weight, Track Inventory, Availability, Committed, Low Stock Threshold, Limit Purchase, Limit, Visibility, Charge Tax, Tax profile, Shipping Profile.

The Variants column SHALL show the variant's image and its identity (variant name and attribute combination). Profit, Margin, and Committed SHALL be read-only. Profit and Margin SHALL be derived from the row's current price, sale price, and cost of goods rather than stored. Weight SHALL present its amount and unit as one column. Dimension SHALL select a shipping box and SHALL display the chosen box's name and its length, width, and height.

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

### Requirement: Gated cells

Availability and Low Stock Threshold SHALL present an editable control only while the row tracks inventory. Limit SHALL present an editable control only while the row limits purchase quantity. Tax profile SHALL present an editable control only while the row charges tax. Base price per unit SHALL present an editable control only while the row shows a unit price. When the gate is off, the cell SHALL show a non-editable placeholder.

#### Scenario: Gate turned off hides the control

- **WHEN** a row does not track inventory
- **THEN** its Availability and Low Stock Threshold cells show a placeholder instead of an editable control

#### Scenario: Gate turned on reveals the stored value

- **WHEN** the merchant enables inventory tracking on a row that already holds an availability value
- **THEN** the Availability cell becomes editable and shows that stored value

### Requirement: Grid remains responsive at catalogue scale

The grid SHALL remain interactive when editing up to 1000 variants at once. Scrolling, typing, and dragging MUST NOT degrade as the number of loaded variants grows. Every row SHALL occupy a fixed height of 32 pixels, and column widths SHALL remain stable while scrolling.

#### Scenario: Large variant set stays usable

- **WHEN** the merchant opens the grid with 1000 variants
- **THEN** the grid scrolls and accepts edits without perceptible lag

#### Scenario: Column widths do not shift while scrolling

- **WHEN** the merchant scrolls vertically through a large variant set
- **THEN** column widths and row heights remain unchanged

### Requirement: Pinned identity column and horizontal navigation

The Variants column SHALL remain fixed against the left edge while the merchant scrolls horizontally, so every row stays identifiable. The grid SHALL provide a horizontal scroll control that remains reachable without scrolling to the end of the variant list.

#### Scenario: Identity stays visible when scrolled right

- **WHEN** the merchant scrolls horizontally to a column at the far right
- **THEN** the Variants column remains visible at the left edge with its image and identity intact

#### Scenario: Horizontal control is reachable from anywhere in the list

- **WHEN** the merchant is viewing rows in the middle of a 1000-variant list
- **THEN** the horizontal scroll control is visible without scrolling to the last row

### Requirement: Cell selection within a column

The merchant SHALL be able to select a contiguous range of cells within a single column by dragging across cell bodies, or by selecting one cell and shift-clicking another cell in the same column. Selecting a range MUST NOT change any value. A selection SHALL never span more than one column; selecting a cell in a different column SHALL start a new selection there.

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

### Requirement: Fill from a selected cell

A selected cell SHALL present a fill handle at the bottom-right of the selection. Dragging that handle across other cells in the same column SHALL copy the value of the cell the drag started from into every cell in the dragged range, overwriting whatever was there.

While dragging the handle, the merchant SHALL be able to extend the fill beyond the currently visible rows; the grid SHALL scroll as the pointer approaches its edge.

#### Scenario: Fill copies the origin value down

- **WHEN** the merchant selects the top Price cell and drags its fill handle down over four rows
- **THEN** all four rows take the top cell's price, replacing their previous values

#### Scenario: Fill can extend past the visible rows

- **WHEN** the merchant drags the fill handle to the bottom edge of the grid and holds
- **THEN** the grid scrolls further down and the fill range continues to extend

### Requirement: Two-stage cell editing

A cell SHALL require two distinct actions before its control accepts input: the first press selects the cell, and a subsequent click on the already-selected cell, a double-click, or pressing Enter activates it for editing. Pressing Escape or interacting outside the cell SHALL deactivate it. At most one cell SHALL be active at a time.

#### Scenario: First press selects without focusing

- **WHEN** the merchant presses a Price cell that was not selected
- **THEN** the cell is selected
- **AND** its input does not receive focus, so dragging from here selects rather than editing text

#### Scenario: Second interaction activates editing

- **WHEN** the merchant clicks an already-selected Price cell, or presses Enter on it
- **THEN** the cell becomes active and its input receives focus

#### Scenario: Escape deactivates

- **WHEN** a cell is active and the merchant presses Escape
- **THEN** the cell stops being active and no further typing reaches it

### Requirement: Column visibility

The merchant SHALL be able to show or hide individual columns from the page's top bar. All columns SHALL be visible initially, and the merchant's choice SHALL persist across visits to the page. The Variants column SHALL always remain visible.

#### Scenario: Hidden column is remembered

- **WHEN** the merchant hides the Margin column and later returns to the bulk edit page
- **THEN** the Margin column is still hidden
