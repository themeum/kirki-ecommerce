# data-table-column-visibility Specification

## Purpose

Defines the list table's built-in column show/hide control: which columns it offers, how a merchant
toggles several at once, and how their choices are remembered for that table between visits.

## Requirements

### Requirement: Every list table offers column show/hide by default

A list table SHALL present a column show/hide control without its caller asking for one. A caller
SHALL be able to withhold the control for a particular table only by declaring so explicitly.

#### Scenario: A table that says nothing about column visibility

- **WHEN** a caller renders a list table without mentioning column visibility
- **THEN** the column show/hide control is present

#### Scenario: A table that opts out

- **WHEN** a caller explicitly declares that a table has no column show/hide
- **THEN** no such control is presented for that table

### Requirement: The control sits at the trailing edge of the table's toolbar row

The control SHALL be presented at the trailing edge of the row carrying the table's search and
filter controls, in the same position on every table. It SHALL be an icon-only control labelled for
assistive technology, and activating it SHALL reveal the list of columns.

#### Scenario: Consistent placement

- **WHEN** a merchant moves between two different list screens
- **THEN** the column control is in the same position on both

#### Scenario: Bulk-action bar is showing

- **WHEN** rows are selected and the bulk-action bar has replaced the toolbar row
- **THEN** the column control is not presented, for as long as the selection lasts

### Requirement: The control offers every column that carries a header

The control SHALL list each column that presents a header, labelled with that header. It SHALL NOT
offer the row-selection column, nor a column that presents no header, nor a column that declares
itself non-hideable.

#### Scenario: A table with a row-actions column

- **WHEN** a table carries a column of per-row actions with no header
- **THEN** that column is not offered in the control

#### Scenario: Selection column

- **WHEN** a table has row selection enabled
- **THEN** the selection column is not offered in the control

#### Scenario: Labelling

- **WHEN** a merchant opens the control
- **THEN** each column is named by the header it presents in the table

### Requirement: Several columns can be toggled without reopening the control

Toggling a column SHALL NOT dismiss the control. The control SHALL remain open until the merchant
dismisses it, either by activating something outside it or by pressing Escape.

#### Scenario: Hiding two columns in a row

- **WHEN** a merchant opens the control and hides one column and then another
- **THEN** the control is still open after the first toggle
- **AND** both columns are hidden

#### Scenario: Dismissing

- **WHEN** a merchant activates something outside the open control
- **THEN** the control closes and the toggles made remain in effect

### Requirement: At least one column always remains visible

The control SHALL NOT allow every column to be hidden. When only one column remains visible, that
column's toggle SHALL be unavailable.

#### Scenario: Hiding down to the last column

- **WHEN** a merchant has hidden every column but one
- **THEN** the remaining column cannot be hidden

### Requirement: A merchant's choices persist per table

A table's visible-column choices SHALL be remembered for that table and restored on a later visit.
Each table SHALL be remembered separately, so choices made on one list do not affect another. A
table SHALL declare a stable identifier under which its choices are held.

#### Scenario: Returning to a list

- **WHEN** a merchant hides a column, navigates away, and returns to that list
- **THEN** the column is still hidden

#### Scenario: Two different lists

- **WHEN** a merchant hides a column on one list
- **THEN** no column is hidden on any other list

#### Scenario: Nothing remembered yet

- **WHEN** a merchant opens a list for the first time
- **THEN** every column is visible

#### Scenario: Persistence is unavailable

- **WHEN** the browser refuses to store or return the merchant's choices
- **THEN** the table still renders with every column visible, and the control still works for the
  current visit
