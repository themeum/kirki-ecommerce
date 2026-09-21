## ADDED Requirements

### Requirement: Caret placement after a seeding keystroke

When a printable keystroke seeds a cell's value and activates it, the caret SHALL
be placed after the seeded text rather than selecting it, so continued typing
appends to what was already typed. Activation by double-click or Enter SHALL
continue to present the existing value selected, so that typing overwrites it.

This SHALL hold for every cell kind that accepts typed input — text, number,
money, and the Weight column's numeric field.

#### Scenario: Continued typing appends

- **WHEN** the merchant selects a Weight cell, types "1", and then types "2"
- **THEN** the cell's value is "12"

#### Scenario: Seeding still discards the previous value

- **WHEN** the merchant selects a Price cell holding 19.99 and types "5"
- **THEN** the cell's value is "5"
- **AND** typing "0" next makes it "50", not "0"

#### Scenario: Enter still selects for overwrite

- **WHEN** the merchant selects a Price cell holding 19.99 and presses Enter, then types "5"
- **THEN** the cell's value is "5", because Enter presented the existing value selected

## MODIFIED Requirements

### Requirement: Gated cells

Low Stock Threshold SHALL present an editable control only while the row tracks
inventory. Limit SHALL present an editable control only while the row limits
purchase quantity. Tax profile SHALL present an editable control only while the
row charges tax. Base price per unit SHALL present an editable control only while
the row shows a unit price. When one of these gates is off, the cell SHALL show a
non-editable placeholder.

Availability SHALL instead be editable in both states, presenting a different
control in each: a quantity field while the row tracks inventory, and a choice of
In Stock or Out of Stock — bound to the variant's stock flag — while it does not.
The choice offered while untracked SHALL match the one the single-variant form
offers for the same variant. Changing a row's inventory tracking SHALL swap which
control the cell presents without altering the value behind the other one, so the
row's quantity survives a trip through the untracked state.

#### Scenario: Gate turned off hides the control

- **WHEN** a row does not track inventory
- **THEN** its Low Stock Threshold cell shows a placeholder instead of an editable control

#### Scenario: Gate turned on reveals the stored value

- **WHEN** the merchant enables inventory tracking on a row that already holds an availability value
- **THEN** the Availability cell shows a quantity field holding that stored value

#### Scenario: An untracked row offers a stock status

- **WHEN** a row does not track inventory
- **THEN** its Availability cell offers In Stock and Out of Stock
- **AND** choosing one records that stock status on the variant

#### Scenario: Turning tracking off preserves the quantity

- **WHEN** the merchant unchecks Track Inventory on a row whose Availability is 250
- **THEN** the Availability cell switches to the stock-status choice
- **AND** re-checking Track Inventory shows 250 again

### Requirement: Fill from a selected cell

A selection SHALL present a fill handle at its bottom-most selected row, whether the selection is a contiguous range or a non-contiguous Cmd/Ctrl-click selection. Dragging that handle across other cells in the same column SHALL copy the value of the row the drag started from into every cell in the dragged range, overwriting whatever was there.

Where a column presents different controls on different rows — as Availability
does — the fill SHALL copy the value belonging to the control the drag started
from, and SHALL leave rows presenting the other control unchanged rather than
writing a value their cell does not show. A fill SHALL NOT change which control a
target row presents.

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

#### Scenario: Filling Availability from a tracked row skips untracked rows

- **WHEN** the merchant fills Availability down from a tracked row holding 250, across rows where row 3 does not track inventory
- **THEN** the tracked rows in the range take 250
- **AND** row 3 keeps its stock status and its own quantity
- **AND** no row's inventory tracking setting changes

#### Scenario: Filling Availability from an untracked row skips tracked rows

- **WHEN** the merchant fills Availability down from an untracked row set to Out of Stock, across rows where row 3 tracks inventory
- **THEN** the untracked rows in the range become Out of Stock
- **AND** row 3 keeps its quantity
- **AND** no row's inventory tracking setting changes

### Requirement: Borderless select-like cells

Tax profile, Shipping Profile, Dimension, the Weight unit, and Base price per unit SHALL render without a visible border or background, showing only a right-aligned chevron affordance, so the cell itself reads as the field. These cells SHALL follow the same two-stage editing model as other cells: a first press selects the cell, and a second click, double-click, or Enter opens the control (dropdown or dialog).

The interaction that opens such a control SHALL NOT also dismiss it. The control
SHALL stay open until the merchant dismisses it deliberately — by choosing a
value, by a control of its own, by clicking outside it, or by pressing Escape.

#### Scenario: A select-like cell shows only a chevron at rest

- **WHEN** the merchant views a Tax profile cell that is not active
- **THEN** the cell shows its current value and a chevron, with no visible border or background

#### Scenario: A select-like cell still requires two actions to open

- **WHEN** the merchant presses a Tax profile cell that was not selected
- **THEN** the cell is selected but its dropdown does not open
- **AND** a subsequent click, double-click, or Enter opens it

#### Scenario: The unit-price dialog stays open once opened

- **WHEN** the merchant presses a Base price per unit cell that was not selected, then presses it again
- **THEN** its dialog opens and remains open
- **AND** no third press is needed to reach it
