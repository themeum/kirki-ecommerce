## ADDED Requirements

### Requirement: Rule-based SKU generation from the grid

While one or more SKU cells are selected, the SKU column header SHALL present a
generate action. Triggering it SHALL replace the SKU of every selected row with a
rule-based SKU composed by the server from that row's own product data, each row
receiving its own number. The action SHALL NOT appear when nothing is selected or
when the selection sits in another column, SHALL indicate that it is busy while
the request is in flight, and on failure SHALL leave every SKU untouched and
surface the failure to the merchant. Showing or hiding it SHALL NOT change the
header's dimensions or move any other part of the grid.

Generated SKUs SHALL be written into the grid's unsaved form state only; they
SHALL NOT be stored until the merchant saves.

#### Scenario: The action appears with a SKU selection

- **WHEN** the merchant selects one or more SKU cells
- **THEN** a generate action appears in the SKU column header

#### Scenario: Showing the action does not move the grid

- **WHEN** the generate action appears or disappears as the merchant's selection
  changes
- **THEN** the header row keeps its height and no row of the grid moves

#### Scenario: The action stays hidden for other columns

- **WHEN** the merchant's selection sits in the Price column, or nothing is
  selected
- **THEN** no generate action is shown in the SKU column header

#### Scenario: Every selected row gets its own SKU

- **WHEN** the merchant selects three SKU cells and triggers the generate action
- **THEN** each of those three rows takes a distinct rule-based SKU
- **AND** rows outside the selection keep their existing SKU

#### Scenario: Generation fails

- **WHEN** the merchant triggers the generate action and the request fails
- **THEN** every selected row keeps its previous SKU
- **AND** the merchant is shown an error

### Requirement: The SKU column is wide enough for a generated SKU

The SKU column SHALL be sized to display a rule-based SKU — which carries a
segment per attribute value in addition to title, brand, category and sequence
segments — without the merchant having to widen or scroll within the cell to read
it.

#### Scenario: A multi-segment SKU is readable

- **WHEN** a row holds a SKU such as `BLU-RED-SMA-NIK-APP-010`
- **THEN** that value is legible in the SKU cell at the column's default width

## MODIFIED Requirements

### Requirement: Fill from a selected cell

A selection SHALL present a fill handle at its bottom-most selected row, whether the selection is a contiguous range or a non-contiguous Cmd/Ctrl-click selection. Dragging that handle across other cells in the same column SHALL copy the value of the row the drag started from into every cell in the dragged range, overwriting whatever was there.

The SKU column is the one exception: dragging its fill handle SHALL give every
row in the dragged range — the row the drag started from included — a freshly
generated rule-based SKU of its own, derived from that row's product data,
rather than a copy of the origin row's SKU. The origin is not spared the way it
is in other columns, because there it holds the value being copied outward
whereas here nothing is copied.

Completing a fill SHALL leave the column with one contiguous selection spanning from the topmost previously-selected row through the drag's end point, replacing whatever non-contiguous shape the selection had beforehand.

While dragging the handle, the merchant SHALL be able to extend the fill beyond the currently visible rows; the grid SHALL scroll as the pointer approaches its edge.

#### Scenario: Fill copies the origin value down

- **WHEN** the merchant selects the top Price cell and drags its fill handle down over four rows
- **THEN** all four rows take the top cell's price, replacing their previous values

#### Scenario: Filling SKU generates instead of copying

- **WHEN** the merchant selects the top SKU cell and drags its fill handle down
  over four rows
- **THEN** the top row and all four rows below it take a distinct rule-based SKU
  derived from their own product data
- **AND** none of them is a copy of the origin row's SKU
- **AND** no row in the dragged range is left with its previous SKU

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
