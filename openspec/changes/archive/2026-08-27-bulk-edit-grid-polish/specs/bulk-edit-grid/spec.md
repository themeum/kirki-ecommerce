## MODIFIED Requirements

### Requirement: Cell selection within a column

The merchant SHALL be able to select cells within a single column in three ways: dragging across cell bodies, shift-clicking another cell to extend a contiguous range from the anchor, or Cmd/Ctrl-clicking individual cells to build a non-contiguous selection of rows. Selecting cells MUST NOT change any value. A selection SHALL never span more than one column; selecting a cell in a different column SHALL start a new selection there.

Cmd/Ctrl-clicking a row already in the selection SHALL remove that row from the selection (toggle off), including a row in the middle of a previously dragged or shift-extended range. Cmd/Ctrl-clicking a row not in the selection SHALL add it, and dragging while Cmd/Ctrl is held SHALL extend that newly added chunk.

Clicking a cell that is already part of the current selection SHALL preserve the entire selection unchanged (see Two-stage cell editing for what that click then does). The selection SHALL only be replaced or cleared by clicking a cell outside the current selection, or by clicking outside the grid entirely.

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

#### Scenario: Clicking a selected cell preserves the selection

- **WHEN** the merchant has a multi-row Price selection and clicks a cell already within it
- **THEN** the full selection remains unchanged

#### Scenario: Clicking outside the selection replaces it

- **WHEN** the merchant has a Price selection and clicks a Price cell outside that selection
- **THEN** the previous selection is cleared
- **AND** a new selection starts at the clicked cell

#### Scenario: Clicking outside the grid clears the selection

- **WHEN** the merchant has a selection and clicks outside the grid
- **THEN** the selection is cleared entirely

### Requirement: Fill from a selected cell

A selection SHALL present a fill handle at its bottom-most selected row, whether the selection is a contiguous range or a non-contiguous Cmd/Ctrl-click selection. Dragging that handle across other cells in the same column SHALL copy the value of the row the drag started from into every cell in the dragged range, overwriting whatever was there.

Completing a fill SHALL leave the column with one contiguous selection spanning from the topmost previously-selected row through the drag's end point, replacing whatever non-contiguous shape the selection had beforehand.

While dragging the handle, the merchant SHALL be able to extend the fill beyond the currently visible rows; the grid SHALL scroll as the pointer approaches its edge.

#### Scenario: Fill copies the origin value down

- **WHEN** the merchant selects the top Price cell and drags its fill handle down over four rows
- **THEN** all four rows take the top cell's price, replacing their previous values

#### Scenario: Fill can extend past the visible rows

- **WHEN** the merchant drags the fill handle to the bottom edge of the grid and holds
- **THEN** the grid scrolls further down and the fill range continues to extend

#### Scenario: Fill handle sits at the bottom of a non-contiguous selection

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9
- **THEN** the fill handle appears at row 9

#### Scenario: Filling from a non-contiguous selection collapses it

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9 and drags the fill handle from row 9 down to row 12
- **THEN** rows 10, 11, and 12 take row 9's value
- **AND** the resulting selection spans rows 2 through 12 as one contiguous range

### Requirement: Two-stage cell editing

A cell SHALL require two distinct actions before its control accepts input: the first press selects the cell (or, per Cell selection within a column, is absorbed into an existing selection without changing it), and a subsequent click on a cell that is part of the current selection, a double-click, or pressing Enter on a selected cell activates it for editing. Editing an active cell that belongs to a multi-cell selection SHALL fan the new value out to every selected cell in that column. Pressing Escape or interacting outside the cell SHALL deactivate it. At most one cell SHALL be active at a time.

#### Scenario: First press selects without focusing

- **WHEN** the merchant presses a Price cell that was not selected
- **THEN** the cell is selected
- **AND** its input does not receive focus, so dragging from here selects rather than editing text

#### Scenario: Second interaction activates editing

- **WHEN** the merchant clicks an already-selected Price cell, or presses Enter on it
- **THEN** the cell becomes active and its input receives focus

#### Scenario: Activating a cell within a non-contiguous selection fans the edit out

- **WHEN** the merchant has Cmd/Ctrl-click selected Price rows 2, 5, and 9 and types a new value into row 5's activated cell
- **THEN** rows 2, 5, and 9 all take the new value

#### Scenario: Escape deactivates

- **WHEN** a cell is active and the merchant presses Escape
- **THEN** the cell stops being active and no further typing reaches it

## ADDED Requirements

### Requirement: Grid lines and layout-stable selection indicator

Every cell SHALL show a visible grid line on its trailing and bottom edges, so the grid reads as a spreadsheet rather than a borderless table. The visual indicator for a selected or fill-targeted cell MUST NOT change that cell's box size or shift any neighboring cell, regardless of how many cells are selected or filled at once.

#### Scenario: Grid lines are always visible

- **WHEN** the merchant views the grid in any state
- **THEN** every cell shows a visible border on its right and bottom edges

#### Scenario: Selecting cells causes no layout shift

- **WHEN** the merchant selects a range of cells
- **THEN** no cell's width or height changes and no column shifts position

### Requirement: Compact cell layout

Every cell SHALL use minimal padding, and the control it hosts (input, select, or button) SHALL fit entirely within the grid's fixed 32-pixel row height without clipping or overflowing.

#### Scenario: A money cell's input fits the fixed row height

- **WHEN** the merchant views a Price cell
- **THEN** its input renders fully within the 32-pixel row, with no part of it clipped or extending beyond the row

### Requirement: Borderless select-like cells

Tax profile, Shipping Profile, Dimension, the Weight unit, and Base price per unit SHALL render without a visible border or background, showing only a right-aligned chevron affordance, so the cell itself reads as the field. These cells SHALL follow the same two-stage editing model as other cells: a first press selects the cell, and a second click, double-click, or Enter opens the control (dropdown or dialog).

#### Scenario: A select-like cell shows only a chevron at rest

- **WHEN** the merchant views a Tax profile cell that is not active
- **THEN** the cell shows its current value and a chevron, with no visible border or background

#### Scenario: A select-like cell still requires two actions to open

- **WHEN** the merchant presses a Tax profile cell that was not selected
- **THEN** the cell is selected but its dropdown does not open
- **AND** a subsequent click, double-click, or Enter opens it
