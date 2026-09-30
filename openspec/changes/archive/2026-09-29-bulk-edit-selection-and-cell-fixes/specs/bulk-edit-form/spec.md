## MODIFIED Requirements

### Requirement: Edits propagate across the selection

While a range of cells is selected, changing the value of any cell in that range SHALL apply the same value to every cell in the range, replacing their previous values. Propagation SHALL take effect as the value changes, not only when editing finishes.

Propagation SHALL apply the value even to rows whose gate for that column is currently off; the gate itself SHALL NOT be altered.

Where a column presents different controls depending on a row's own state — as
Availability does — propagation SHALL apply only to rows presenting the same
control as the edited cell, and SHALL leave the others unchanged rather than
writing a value their cell does not show.

#### Scenario: Editing one cell in a range updates them all

- **WHEN** a range of six Price cells is selected and the merchant edits any one of them
- **THEN** all six rows take the edited value

#### Scenario: Deselecting stops propagation

- **WHEN** the merchant clears the selection and then edits a single Price cell
- **THEN** only that row's price changes

#### Scenario: Gated rows receive the value without being ungated

- **WHEN** a Low Stock Threshold range spans rows that do not track inventory and the merchant enters a threshold
- **THEN** every row in the range records that threshold
- **AND** no row's inventory tracking setting is changed
- **AND** untracked rows continue to show a placeholder until tracking is enabled

#### Scenario: Availability propagates only to rows in the same state

- **WHEN** an Availability range spans tracked and untracked rows and the merchant enters a quantity into a tracked row
- **THEN** every tracked row in the range records that quantity
- **AND** the untracked rows keep their stock status and their own quantity
- **AND** no row's inventory tracking setting is changed
