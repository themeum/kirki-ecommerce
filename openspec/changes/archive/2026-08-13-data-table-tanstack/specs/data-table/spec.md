## Purpose

Defines the admin's server-driven list table: how a caller supplies rows and
addressable columns, how paging, sorting and filtering are delegated back to the
caller, how in-flight and empty results are presented without disturbing the
surrounding layout, and how row selection — including selection that spans pages
— is expressed and reported.

## ADDED Requirements

### Requirement: The table delegates paging, sorting and filtering to its caller

The list table SHALL treat the rows it is given as the complete, already-paged,
already-sorted, already-filtered result for the current view. It SHALL NOT slice,
reorder or filter rows itself. It SHALL report every paging and sorting request
to its caller and re-render only from the rows subsequently supplied.

#### Scenario: Requesting a different page

- **WHEN** a user activates a page control
- **THEN** the table reports the requested page to its caller
- **AND** the displayed rows do not change until the caller supplies new rows

#### Scenario: Requesting a sort

- **WHEN** a user activates a sortable column header
- **THEN** the table reports the requested column and direction to its caller
- **AND** the displayed row order does not change until the caller supplies new rows

#### Scenario: Total page count comes from the caller

- **WHEN** the caller supplies a total page count alongside the current rows
- **THEN** the pagination control reflects that count, not the number of rows on screen

### Requirement: Columns are addressable and self-describing

Every column SHALL carry a stable identifier, a header, and a cell presentation.
A column's identifier SHALL be the name the backing service uses to sort by that
column, so no separate sort-key declaration is needed. Columns SHALL be
addressable by identifier rather than by position.

#### Scenario: Sorting reports the column identifier

- **WHEN** a user sorts by a column
- **THEN** the reported sort field is that column's identifier

#### Scenario: Sorting is opt-in per column

- **WHEN** a column does not declare itself sortable
- **THEN** its header presents no sort affordance and cannot be activated to sort

#### Scenario: Addressing a column for pinning or visibility

- **WHEN** a caller pins or hides a column
- **THEN** it does so by that column's identifier
- **AND** the result is unaffected by the column's position in the column list

### Requirement: Cells can declare alignment and style overrides

A column SHALL be able to declare the horizontal alignment and style override
applied to its cells, and these SHALL be carried through to the rendered cells.

#### Scenario: Right-aligned column

- **WHEN** a column declares right alignment
- **THEN** every cell rendered for that column is right-aligned

### Requirement: An in-flight refresh replaces only the rows

While the caller reports that results are in flight, the table SHALL replace only
its row area with a loading indicator. The column headers, the toolbar, the filter
bar and the pagination control SHALL all remain rendered, and the pagination
control SHALL be inert. The surrounding page layout SHALL NOT shift.

#### Scenario: Searching an already-loaded table

- **WHEN** a user types a search term and a request is in flight
- **THEN** a loading indicator replaces the rows
- **AND** the column headers remain visible
- **AND** the toolbar and filter bar remain visible and in place
- **AND** the pagination control remains visible but cannot be activated

#### Scenario: First load of a table

- **WHEN** the table's first request is in flight
- **THEN** the same treatment applies — headers and surrounding controls render,
  with a loading indicator in the row area

#### Scenario: Loading a table whose caller reuses the previous page's rows

- **WHEN** the caller keeps the previous results visible while refetching, and
  reports that a request is in flight
- **THEN** the table shows the loading indicator rather than the stale rows

### Requirement: An empty result is stated explicitly and can be customised

When there are no rows and no request is in flight, the table SHALL present an
empty-result message in place of the rows. A caller SHALL be able to supply its
own empty-result presentation for a given table; absent one, a default SHALL be
presented.

#### Scenario: No results by default

- **WHEN** a table has no rows and nothing is in flight
- **THEN** a default empty-result presentation is shown in the row area
- **AND** the column headers and surrounding controls remain rendered

#### Scenario: Table-specific empty result

- **WHEN** a caller supplies its own empty-result presentation
- **THEN** that presentation is shown instead of the default

#### Scenario: Empty is not conflated with loading

- **WHEN** a request is in flight and there are no rows yet
- **THEN** the loading indicator is shown, not the empty-result presentation

### Requirement: Row selection is opt-in and identified by entity

The table SHALL present per-row and select-all-on-page selection controls only
when the caller enables selection. Selection SHALL be keyed by each row's own
identity, not by its position in the current page's rows.

#### Scenario: Selection not enabled

- **WHEN** a caller does not enable row selection
- **THEN** no selection column is rendered

#### Scenario: Selection survives a data refresh

- **WHEN** rows are selected and the caller supplies a new set of rows in which
  those same entities appear at different positions
- **THEN** the same entities remain selected

#### Scenario: Partially selected page

- **WHEN** some but not all rows on the current page are selected
- **THEN** the select-all-on-page control presents an indeterminate state

### Requirement: Selection can extend to all rows matching the current filters

The table SHALL support a selection mode meaning "every row matching the current
filters", including rows not currently loaded. This mode SHALL be distinguishable
from a selection of individually chosen rows, and SHALL be offered only when more
matching rows exist than are currently shown.

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

### Requirement: Selection is reported to the caller

The table SHALL report the current selection to its caller whenever it changes,
including the selected row identifiers, whether the all-matching mode is active,
and the selected count.

#### Scenario: Caller acts on selected rows

- **WHEN** a user selects rows
- **THEN** the caller receives the selected identifiers and can act on them
  independently of any bulk action offered by the table

### Requirement: A stale selection is discarded when the result set changes meaning

The table SHALL clear its selection when the caller signals that the filter
criteria behind the current result set have changed. Paging and sorting SHALL NOT
clear the selection.

#### Scenario: Filters change while rows are selected

- **WHEN** rows are selected and the caller signals a filter change
- **THEN** the selection is cleared

#### Scenario: Paging while rows are selected

- **WHEN** rows are selected and the user moves to another page
- **THEN** the selection is retained

### Requirement: Selecting rows switches the toolbar to bulk actions

While a selection is active, the table SHALL present a bulk-action bar in place of
its toolbar, reporting the chosen action and the current selection to the caller.
After the caller finishes handling the action, the selection SHALL be cleared.

#### Scenario: Selection active

- **WHEN** at least one row is selected
- **THEN** the bulk-action bar is presented in place of the toolbar
- **AND** it reports how many rows are selected

#### Scenario: Applying a bulk action

- **WHEN** a user applies a bulk action and the caller finishes handling it
- **THEN** the selection is cleared

#### Scenario: No selection

- **WHEN** nothing is selected
- **THEN** the caller-supplied toolbar is presented

### Requirement: Columns can be pinned to either edge

The table SHALL support pinning columns to its leading or trailing edge. A pinned
column SHALL remain visible while the table is scrolled horizontally, positioned
clear of any other pinned columns on the same edge.

#### Scenario: Pinned column stays visible

- **WHEN** a column is pinned and the table is scrolled horizontally
- **THEN** that column remains in view at its edge

#### Scenario: Multiple columns pinned to one edge

- **WHEN** two columns are pinned to the same edge
- **THEN** neither overlaps the other

### Requirement: Columns can be hidden

The table SHALL support hiding columns by identifier. A hidden column SHALL
contribute neither a header nor cells, and the loading and empty presentations
SHALL span only the visible columns.

#### Scenario: Hiding a column

- **WHEN** a caller hides a column
- **THEN** neither its header nor any of its cells are rendered

#### Scenario: Loading row spans visible columns only

- **WHEN** a column is hidden and a request is in flight
- **THEN** the loading indicator spans exactly the visible columns

### Requirement: The table composes caller-supplied regions through declared inputs

The toolbar, filter bar and empty-result regions SHALL be supplied as declared,
individually named inputs. The table SHALL NOT determine these regions by
inspecting or matching against its children.

#### Scenario: Supplying a filter region

- **WHEN** a caller supplies a toolbar and a filter bar
- **THEN** both are rendered in their designated positions

#### Scenario: Regions are unambiguous

- **WHEN** a caller supplies a region
- **THEN** it is rendered regardless of how it is nested or wrapped

### Requirement: The table does not depend on routing or on where list state is held

The table SHALL NOT read or write the browser address, and SHALL NOT require a
router to be present. All list state SHALL arrive through its declared inputs.

#### Scenario: Use inside a dialog

- **WHEN** the table is used for a list whose state is held locally rather than in
  the address
- **THEN** it functions normally, including paging, selection and loading states

#### Scenario: Rendering without a router

- **WHEN** the table is rendered outside any router
- **THEN** it renders without error
