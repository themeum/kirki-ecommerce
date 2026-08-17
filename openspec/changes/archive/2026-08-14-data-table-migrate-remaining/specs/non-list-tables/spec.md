## Purpose

Defines which tables in the admin are list tables and which are not: the criteria
that place an editor grid, a read-only display table or a locally-held list outside
the list table's remit, and what those tables are obliged to do instead so that a
single table primitive layer still serves every table in the application.

## ADDED Requirements

### Requirement: A table is a list table only when it presents a server-paged result set

A table SHALL use the list table component when it presents a paged, server-filtered
result set of entities. A table that presents editable cells as its primary purpose,
that renders rows bound to a form, or that displays a fixed set of rows belonging to
a single parent record SHALL NOT use the list table component.

#### Scenario: A paginated entity list

- **WHEN** a screen lists entities with server-side paging, searching or filtering
- **THEN** it uses the list table component

#### Scenario: A spreadsheet-style editing grid

- **WHEN** a screen's purpose is editing many cells directly, with cell-range
  selection and fill affordances
- **THEN** it does not use the list table component

#### Scenario: Rows bound to a form

- **WHEN** table rows are fields of a form being edited, with their values held in
  form state
- **THEN** the table does not use the list table component

#### Scenario: A record's own line items

- **WHEN** a table shows the fixed line items belonging to one parent record, with
  no paging, searching or selection
- **THEN** it does not use the list table component

### Requirement: Every table uses the shared table primitives

A table that is not a list table SHALL still build its markup from the shared table
primitives. No table in the application SHALL render raw table elements directly, and
no table SHALL carry its own copy of the primitives' behaviour.

#### Scenario: Building a non-list table

- **WHEN** a developer builds an editing grid or a display table
- **THEN** its rows, cells and sections come from the shared table primitives

#### Scenario: Reviewing the application for raw table markup

- **WHEN** the application is searched for raw table elements
- **THEN** the only place they appear is inside the shared primitives themselves

### Requirement: Feature-specific table presentation is owned by the feature

Presentation that exists only for one screen — spreadsheet cell states, fill
affordances, drag handles, per-cell hover behaviour — SHALL be defined by the feature
that needs it and supplied to the primitives as a style override. The shared
primitives SHALL NOT carry it.

#### Scenario: An editing grid's cell states

- **WHEN** an editing grid needs selected, filled and edge cell states
- **THEN** those styles live with that feature and are passed to the table as an
  override

#### Scenario: A table with unusual hover behaviour

- **WHEN** one screen needs per-cell rather than per-row hover
- **THEN** that behaviour is defined by that screen, not added as a primitive option

### Requirement: A locally-held list filters its rows before supplying them

Where a list's rows are all present locally and there is no server request behind
searching or paging, the feature SHALL apply its own filtering and supply the
resulting rows to the list table, and SHALL disable the table's paging. The list table
SHALL NOT be asked to filter or slice rows itself.

#### Scenario: Searching a local list

- **WHEN** a user searches a list whose rows are all held locally
- **THEN** the feature filters the rows and supplies the filtered set to the table
- **AND** the table renders exactly the rows it was given

#### Scenario: A local list has no pages

- **WHEN** a list has no server paging
- **THEN** its table is rendered with paging disabled, and no pagination control
  appears

#### Scenario: A local list with no matches

- **WHEN** a local search matches nothing
- **THEN** the table presents its empty-result state, the same as a server-driven
  list would
