## RENAMED Requirements

- FROM: `### Requirement: An in-flight refresh replaces only the rows`
- TO: `### Requirement: An in-flight refresh replaces the whole table`

## MODIFIED Requirements

### Requirement: An in-flight refresh replaces the whole table

While the caller reports that results are in flight, the table SHALL replace the
whole tabular region — its column header row as well as its row area — with
placeholder shapes, and SHALL mark that region busy. The card surrounding the
table, the toolbar carrying search and filter controls, the filter bar and the
pagination control SHALL all remain rendered and unchanged; the pagination
control SHALL be inert. Because the header row is replaced, sorting SHALL be
unavailable for the duration of the request. The surrounding page layout SHALL
NOT shift.

The placeholder region SHALL preserve the table's own geometry: one placeholder
header cell and one placeholder body cell per visible column, honouring column
visibility, pinning and alignment, so that hiding a column removes its
placeholders too. A column that carries only a selection control SHALL render a
placeholder of that control's size rather than a full-width one, so its narrow
column does not collapse.

#### Scenario: Searching an already-loaded table

- **WHEN** a user types a search term and a request is in flight
- **THEN** placeholder shapes replace both the column headers and the rows
- **AND** the tabular region reports itself as busy
- **AND** the toolbar and filter bar remain visible, in place, and interactive
- **AND** the pagination control remains visible but cannot be activated

#### Scenario: First load of a table

- **WHEN** the table's first request is in flight
- **THEN** the same treatment applies — the card, toolbar, filter bar and
  pagination render as normal, with placeholders filling the tabular region

#### Scenario: Loading a table whose caller reuses the previous page's rows

- **WHEN** the caller keeps the previous results visible while refetching, and
  reports that a request is in flight
- **THEN** the table shows placeholders rather than the stale rows

#### Scenario: Sorting during a request

- **WHEN** a request is in flight
- **THEN** no sortable column header is presented, and sorting cannot be
  triggered until the request resolves

#### Scenario: Hidden column during a request

- **WHEN** a request is in flight and a column is hidden
- **THEN** no placeholder header cell or placeholder body cell is rendered for
  that column

## ADDED Requirements

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
