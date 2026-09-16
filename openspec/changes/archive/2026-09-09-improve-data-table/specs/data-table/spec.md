## ADDED Requirements

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

## MODIFIED Requirements

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
