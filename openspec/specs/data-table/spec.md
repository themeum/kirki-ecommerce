# data-table Specification

## Purpose

Defines the admin's server-driven list table: how a caller supplies rows and
addressable columns, how paging, sorting and filtering are delegated back to the
caller, how in-flight and empty results are presented without disturbing the
surrounding layout, and how row selection — including selection that spans pages
— is expressed and reported.

## Requirements

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

While the caller reports that results are in flight, the table SHALL replace its
row area with placeholder shapes and SHALL mark the tabular region busy. The
column header row SHALL remain rendered and legible throughout, so the merchant
can still read what each column holds and see which column the results are
ordered by. The card surrounding the table, the toolbar carrying search, filter
and column controls, and the pagination control SHALL all remain rendered and
unchanged; the pagination control SHALL be inert. Sorting SHALL be unavailable
for the duration of the request, matching the inert pagination control, even
though its affordance stays visible. The surrounding page layout SHALL NOT shift.

The placeholder rows SHALL preserve the table's own geometry: one placeholder
body cell per visible column, honouring column visibility, pinning and
alignment, so that hiding a column removes its placeholders too. A column that
carries only a selection control SHALL render a placeholder of that control's
size rather than a full-width one, so its narrow column does not collapse.

Because column widths are derived from cell content, the table SHALL hold the
column widths and row heights measured from its last populated render for the
duration of the request, so that neither entering nor leaving the placeholder
state resizes a column. Where no such measurement exists — a first load — the
table SHALL leave sizing to the browser rather than inventing a geometry.

#### Scenario: Searching an already-loaded table

- **WHEN** a user types a search term and a request is in flight
- **THEN** placeholder shapes replace the rows
- **AND** the column headers remain visible and unchanged
- **AND** the tabular region reports itself as busy
- **AND** the toolbar remains visible, in place, and interactive
- **AND** the pagination control remains visible but cannot be activated

#### Scenario: First load of a table

- **WHEN** the table's first request is in flight
- **THEN** the same treatment applies — the card, toolbar, column headers and
  pagination render as normal, with placeholders filling the row area

#### Scenario: Loading a table whose caller reuses the previous page's rows

- **WHEN** the caller keeps the previous results visible while refetching, and
  reports that a request is in flight
- **THEN** the table shows placeholders rather than the stale rows

#### Scenario: Sorting during a request

- **WHEN** a request is in flight and a sortable column header is activated
- **THEN** the header and its direction indicator remain visible
- **AND** no sort change is reported until the request resolves

#### Scenario: Re-sorting a populated table

- **WHEN** a merchant sorts by a column and the rows become placeholders
- **THEN** every column keeps the width it had before the request
- **AND** the rows keep the height they had before the request

#### Scenario: First load with nothing measured

- **WHEN** the table's first request is in flight and no populated render has
  happened yet
- **THEN** the table applies no fixed geometry of its own

#### Scenario: Changing column visibility during a request

- **WHEN** a request is in flight and a merchant hides a column
- **THEN** the column control remains usable
- **AND** neither that column's header nor a placeholder body cell for it is
  rendered

#### Scenario: Hidden column during a request

- **WHEN** a request is in flight and a column is hidden
- **THEN** neither that column's header nor a placeholder body cell for it is
  rendered

### Requirement: The placeholder row count matches the rows being replaced

While a request is in flight, the table SHALL render as many placeholder rows as
there were rows immediately before the request began, so that a pagination, sort,
search or filter change reserves exactly the height it is about to fill. When
there are no previous rows — the table's first load — it SHALL fall back to the
caller's current page size.

#### Scenario: Filtering a full page of results

- **WHEN** ten rows are on screen and the user applies a filter
- **THEN** ten placeholder rows are rendered while the request is in flight

#### Scenario: Paging away from a partial last page

- **WHEN** three rows are on screen because the last page is partial, and the
  user navigates to another page
- **THEN** three placeholder rows are rendered while the request is in flight

#### Scenario: First load

- **WHEN** the table's first request is in flight and no rows have been shown yet
- **THEN** the table renders as many placeholder rows as its current page size

### Requirement: A placeholder row is as tall as the row it replaces

A placeholder row SHALL reserve the height of a real row rather than the height
of the placeholder bar it contains, and a placeholder header row SHALL reserve
the height of the real header row. Because row height varies by table — a table
whose rows carry a thumbnail is markedly taller than a text-only one — the table
SHALL take that height from the rows it last displayed, and SHALL fall back to a
default only when it has displayed none.

#### Scenario: Paging a table with taller rows

- **WHEN** a table whose rows are taller than a line of text is showing results
  and the user changes page
- **THEN** each placeholder row reserves the height of the rows just replaced,
  so the table occupies the same height throughout the request

#### Scenario: First load of a table

- **WHEN** the table's first request is in flight and it has displayed no rows
  to measure
- **THEN** placeholder rows and the placeholder header row each fall back to a
  default height rather than collapsing to the height of their placeholder bars

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
After the caller finishes handling the action successfully, the selection SHALL be
cleared.

When exactly one bulk action is offered, the bar SHALL present that action as a
single control that applies it directly, without first requiring the merchant to
choose it from a set. When more than one is offered, the merchant SHALL choose one
and then confirm. When none is offered, no action control SHALL be presented.

A bulk action SHALL be able to declare itself destructive, and a destructive action
presented as a single control SHALL be styled to say so.

While the caller is handling an action, the bar SHALL report that it is working and
SHALL NOT accept the action again. If the caller fails to handle the action, the
selection SHALL be retained so the merchant can retry.

#### Scenario: Selection active

- **WHEN** at least one row is selected
- **THEN** the bulk-action bar is presented in place of the toolbar
- **AND** it reports how many rows are selected

#### Scenario: Exactly one bulk action offered

- **WHEN** a table offers one bulk action and rows are selected
- **THEN** the bar presents that action as a single control naming it
- **AND** activating that control applies the action to the selection directly

#### Scenario: A single destructive action

- **WHEN** the single offered action declares itself destructive
- **THEN** its control is presented as destructive

#### Scenario: More than one bulk action offered

- **WHEN** a table offers two or more bulk actions and rows are selected
- **THEN** the merchant chooses one and then confirms it

#### Scenario: No bulk actions offered

- **WHEN** a table offers no bulk actions and rows are selected
- **THEN** the bar reports the selection but presents no action control

#### Scenario: Applying a bulk action

- **WHEN** a merchant applies a bulk action and the caller finishes handling it successfully
- **THEN** the selection is cleared

#### Scenario: An action that is still being handled

- **WHEN** the caller has not yet finished handling an applied action
- **THEN** the bar reports that it is working
- **AND** the action cannot be applied again

#### Scenario: An action the caller fails to handle

- **WHEN** the caller fails to handle an applied action
- **THEN** the selection is retained
- **AND** the action can be applied again

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

The table SHALL hold which columns are hidden itself, and SHALL offer merchants a
control for changing it. A caller MAY instead supply the hidden set directly, in
which case the table SHALL follow what it is given and SHALL NOT present its own
control.

#### Scenario: Hiding a column

- **WHEN** a column is hidden
- **THEN** neither its header nor any of its cells are rendered

#### Scenario: Loading row spans visible columns only

- **WHEN** a column is hidden and a request is in flight
- **THEN** the loading indicator spans exactly the visible columns

#### Scenario: The table holds the hidden set

- **WHEN** a caller says nothing about which columns are hidden
- **THEN** the table holds that state itself and presents its own control for changing it

#### Scenario: A caller supplies the hidden set

- **WHEN** a caller supplies which columns are hidden
- **THEN** the table renders exactly that
- **AND** presents no control of its own

### Requirement: The table composes caller-supplied regions through declared inputs

The toolbar and empty-result regions SHALL be supplied as declared, individually
named inputs. The table SHALL NOT determine these regions by inspecting or matching
against its children.

#### Scenario: Supplying a toolbar

- **WHEN** a caller supplies a toolbar
- **THEN** it is rendered in its designated position

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

### Requirement: Sorting cycles through ascending, descending and unsorted

Activating a sortable column header SHALL cycle that column through ascending, then descending, then
unsorted. Reaching the unsorted state SHALL be reported to the caller as no sort at all, so the
caller can return the list to its default order. Only one column SHALL be sorted at a time;
activating a different column's header SHALL replace the current sort rather than add to it.

#### Scenario: First activation

- **WHEN** a merchant activates the header of a column that is not currently sorted
- **THEN** the table reports that column sorted ascending

#### Scenario: Second activation

- **WHEN** a merchant activates the header of a column already sorted ascending
- **THEN** the table reports that column sorted descending

#### Scenario: Third activation

- **WHEN** a merchant activates the header of a column already sorted descending
- **THEN** the table reports no sort at all

#### Scenario: Sorting a different column

- **WHEN** one column is sorted and a merchant activates a different column's header
- **THEN** only the newly activated column is reported as sorted

#### Scenario: The sorted column is indicated

- **WHEN** a column is sorted
- **THEN** its header indicates the direction, and the headers of other columns do not
