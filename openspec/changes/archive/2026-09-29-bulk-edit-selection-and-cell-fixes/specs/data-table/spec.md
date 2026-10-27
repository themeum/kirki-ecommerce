## MODIFIED Requirements

### Requirement: Selection can extend to all rows matching the current filters

The table SHALL support a selection mode meaning "every row matching the current
filters", including rows not currently loaded. This mode SHALL be distinguishable
from a selection of individually chosen rows, and SHALL be offered only when more
matching rows exist than are currently shown.

A caller SHALL be able to withhold the offer entirely. A caller whose bulk action
can only address an enumerated set of rows SHALL do so, since the offer would
otherwise promise a selection that action cannot carry. Withholding the offer
SHALL NOT affect ordinary row selection or the bulk-action bar.

#### Scenario: Selecting all matching rows

- **WHEN** a user chooses to select all matching rows
- **THEN** the table reports that all matching rows are selected
- **AND** reports the total matching count as the selected count

#### Scenario: Bulk action distinguishes the two modes

- **WHEN** a bulk action is applied
- **THEN** the action receives both the individually selected row identifiers and
  whether the all-matching mode is active, so it can address the whole matching
  set rather than an enumerated list

#### Scenario: Offer withheld when everything is already shown

- **WHEN** the total number of matching rows does not exceed the number shown
- **THEN** no select-all-matching offer is presented

#### Scenario: Offer withheld by the caller

- **WHEN** a caller declares that its bulk action addresses only enumerated rows,
  and more matching rows exist than are shown
- **THEN** no select-all-matching offer is presented
- **AND** the user can still select individual rows and apply the bulk action to them
