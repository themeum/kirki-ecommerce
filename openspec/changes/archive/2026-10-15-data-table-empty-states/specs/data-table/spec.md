## MODIFIED Requirements

### Requirement: An empty result is stated explicitly and can be customised

When there are no rows and no request is in flight, the table SHALL present an
empty-result message in place of the rows. Which message depends on why the result
is empty:

- When no filters are active and the caller has reported a total of zero, nothing
  has been created yet. The table SHALL present a first-use message.
- When filters are active, the criteria matched nothing. The table SHALL present a
  filtered-empty message.
- Otherwise, including when the caller reported no total, the table SHALL present a
  default empty-result message in the row area.

A caller SHALL be able to supply its own presentation for the first-use message and
for the filtered-empty message. Absent one, a default SHALL be presented.

#### Scenario: No results by default

- **WHEN** a table has no rows, nothing is in flight, and the caller reported no total
- **THEN** a default empty-result presentation is shown in the row area
- **AND** the column headers and surrounding controls remain rendered

#### Scenario: Table-specific empty result

- **WHEN** a caller supplies its own first-use presentation
- **AND** no filters are active and the reported total is zero
- **THEN** that presentation is shown instead of the default

#### Scenario: Empty is not conflated with loading

- **WHEN** a request is in flight and there are no rows yet
- **THEN** the loading indicator is shown, not any empty-result presentation

#### Scenario: Nothing created yet

- **WHEN** no filters are active, the reported total is zero, and nothing is in flight
- **THEN** the first-use message is shown inside the table's card
- **AND** the toolbar, column headers and pagination are not rendered

#### Scenario: Nothing created yet, on a later page

- **WHEN** no filters are active, the reported total is zero, and the current page is not the first
- **THEN** the first-use message is shown, as it is on the first page

#### Scenario: Filters match nothing

- **WHEN** filters are active, no rows match, and nothing is in flight
- **THEN** the filtered-empty message is shown in the row area
- **AND** the toolbar and column headers remain rendered, so the criteria can be changed

#### Scenario: Table-specific filtered-empty result

- **WHEN** a caller supplies its own filtered-empty presentation
- **AND** filters are active and no rows match
- **THEN** that presentation is shown instead of the default

#### Scenario: A failed request is not read as first use

- **WHEN** the caller reports no total because the request failed, and there are no rows
- **THEN** the first-use message is not shown
- **AND** the default empty-result presentation is shown instead

## ADDED Requirements

### Requirement: Whether filters are active is declared by the caller

The table SHALL take whether filters are active as a declared input and SHALL NOT
infer it from the browser address or from its own state. When the caller says
nothing, filters SHALL be treated as not active.

#### Scenario: Filters declared active

- **WHEN** a caller declares filters active and the table has no rows
- **THEN** the filtered-empty message is chosen over the first-use message

#### Scenario: Nothing declared

- **WHEN** a caller does not declare whether filters are active
- **THEN** the table behaves as if no filters were active

### Requirement: Empty-result messages share one layout

The first-use and filtered-empty messages SHALL each accept an icon, a title, a
description and a set of actions, and SHALL present them centred in that order. Each
of the four parts SHALL be optional. A part that is not supplied SHALL NOT leave a gap.

#### Scenario: All parts supplied

- **WHEN** an icon, title, description and actions are supplied
- **THEN** they are presented centred, from top to bottom, in that order

#### Scenario: Actions omitted

- **WHEN** no actions are supplied
- **THEN** no action row is presented and no empty space is reserved for it

#### Scenario: Filtered-empty defaults

- **WHEN** a caller supplies nothing for the filtered-empty message
- **THEN** a search icon, a no-results title and a "try a different search or clear your filters" description are presented
