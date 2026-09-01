## Purpose

Defines the editing lifecycle of the bulk variant editor: which variants it loads, how an edit to one cell propagates across a selection, how invalid input is reported, and how unsaved work is protected until it is saved.

## ADDED Requirements

### Requirement: Variant set loaded from the request

The page SHALL edit exactly the variants named by the `ids` query parameter and SHALL display how many variants are being edited. When `ids` is absent, empty, or contains no usable identifier, the page SHALL show an empty state with a way back rather than an empty grid. When fewer variants are returned than were requested, the page SHALL present the variants that were returned and report that count.

#### Scenario: Editing the requested variants

- **WHEN** the merchant arrives with `ids` naming twelve variants that all exist
- **THEN** the grid shows those twelve variants
- **AND** the top bar reports that twelve variants are being edited

#### Scenario: No variants selected

- **WHEN** the merchant arrives with an absent or empty `ids` parameter
- **THEN** an empty state is shown explaining that no variants were selected
- **AND** a control is offered to return to the previous page

### Requirement: Edits propagate across the selection

While a range of cells is selected, changing the value of any cell in that range SHALL apply the same value to every cell in the range, replacing their previous values. Propagation SHALL take effect as the value changes, not only when editing finishes.

Propagation SHALL apply the value even to rows whose gate for that column is currently off; the gate itself SHALL NOT be altered.

#### Scenario: Editing one cell in a range updates them all

- **WHEN** a range of six Price cells is selected and the merchant edits any one of them
- **THEN** all six rows take the edited value

#### Scenario: Deselecting stops propagation

- **WHEN** the merchant clears the selection and then edits a single Price cell
- **THEN** only that row's price changes

#### Scenario: Gated rows receive the value without being ungated

- **WHEN** an Availability range spans rows that do not track inventory and the merchant enters a quantity
- **THEN** every row in the range records that quantity
- **AND** no row's inventory tracking setting is changed
- **AND** untracked rows continue to show a placeholder until tracking is enabled

### Requirement: Validation before save

Variant values SHALL be validated against the same rules the product form applies, including that a sale price may not exceed its row's regular price. A cell holding an invalid value SHALL be visually distinguished and SHALL make its message available without changing the row's height. Saving SHALL be refused while any value is invalid, and the merchant SHALL be told how many rows are affected and be taken to the first one.

#### Scenario: Sale price above regular price is rejected

- **WHEN** the merchant enters a sale price greater than that row's regular price
- **THEN** the cell is marked invalid and its message is available to the merchant
- **AND** saving is refused

#### Scenario: Invalid row far down the list can be found

- **WHEN** the merchant attempts to save with an invalid value on a row outside the visible area
- **THEN** the merchant is told how many rows are invalid
- **AND** the grid scrolls to the first invalid row

#### Scenario: Row height is unaffected by errors

- **WHEN** a cell becomes invalid
- **THEN** its row keeps the same height as every other row

### Requirement: Unsaved changes are tracked and protected

The page SHALL indicate unsaved changes only while the merchant has actually modified a value, and SHALL stop indicating them once the changes are saved or discarded. Attempting to navigate away in the application while changes are unsaved SHALL be interrupted and require confirmation; leaving the application while changes are unsaved SHALL trigger the browser's native prompt. Cancel SHALL ask for confirmation while changes are unsaved, and on confirmation SHALL discard them and return to the previous page.

#### Scenario: Indicator reflects real edits

- **WHEN** the merchant loads the page and changes nothing
- **THEN** no unsaved-changes indication is shown

#### Scenario: Indicator appears on first edit

- **WHEN** the merchant changes any value
- **THEN** the page indicates that there are unsaved changes

#### Scenario: Navigation is interrupted while dirty

- **WHEN** the merchant has unsaved changes and attempts to navigate away within the application
- **THEN** the navigation is interrupted and confirmation is required

#### Scenario: Cancel confirms before discarding

- **WHEN** the merchant has unsaved changes and chooses Cancel
- **THEN** confirmation is requested
- **AND** on confirmation the edits are discarded and the merchant returns to the previous page

### Requirement: Saving variants

Saving SHALL submit the edited variants to the bulk variant update endpoint. Monetary values SHALL be submitted in major currency units. Values the server does not accept — derived totals, display-currency projections, committed quantity, and record timestamps — MUST NOT be submitted.

On success the merchant SHALL remain on the page with their scroll position, column visibility, and selection intact; the page SHALL reconcile its values with the server's response so that no unsaved changes remain; and variant data shown elsewhere in the admin SHALL be refreshed.

#### Scenario: Successful save clears the unsaved state

- **WHEN** the merchant saves valid edits
- **THEN** a success message is shown
- **AND** the page no longer indicates unsaved changes
- **AND** the merchant remains on the grid at the same scroll position

#### Scenario: Other views reflect the save

- **WHEN** a save succeeds and the merchant then opens the inventory or product list
- **THEN** those views show the updated variant values

#### Scenario: Failed save keeps the edits

- **WHEN** the server rejects the save
- **THEN** the error is reported to the merchant
- **AND** the merchant's edits remain in the grid and the page still indicates unsaved changes
