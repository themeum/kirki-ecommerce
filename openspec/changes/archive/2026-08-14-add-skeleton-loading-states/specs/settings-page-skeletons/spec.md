## Purpose

Governs how settings pages and self-fetching embedded lists — pickers, search
dropdowns and in-page list views — present themselves while their data is in
flight, so the settings pane and any list container hold their shape instead of
briefly shrinking to a line of placeholder text.

## ADDED Requirements

### Requirement: A settings page reserves its pane while its data loads

While a settings page's request is in flight, the page SHALL render placeholder
content shaped like its own field layout — a placeholder for each field's label
and each field's control, inside the real card chrome — rather than a line of
text. The settings shell around it, including its navigation sidebar and page
header, SHALL render as normal.

#### Scenario: Opening a settings page

- **WHEN** a user selects a settings page and its request is in flight
- **THEN** the content pane renders placeholder fields at the page's normal
  width, inside its normal cards

#### Scenario: Settings arrive

- **WHEN** the request resolves
- **THEN** the real form replaces the placeholders without the pane changing
  width

#### Scenario: Moving between settings pages

- **WHEN** a user switches from one settings page to another
- **THEN** the incoming page shows its own placeholder field layout while
  loading, and the sidebar stays interactive throughout

### Requirement: A self-fetching list shows placeholder rows

A list that issues its own request — a record picker, a search dropdown, or an
in-page list view — SHALL present repeating placeholder rows in the shape of its
loaded rows while that request is in flight, in place of a spinner or a status
string. The container's own chrome, including any header row and any search
input, SHALL remain rendered and interactive.

#### Scenario: Opening a record picker

- **WHEN** a picker dialog opens and its request is in flight
- **THEN** placeholder rows fill its list area and its header row and search
  input remain usable

#### Scenario: Typing in a search dropdown

- **WHEN** a user types into a search dropdown and a request is in flight
- **THEN** the dropdown shows placeholder rows shaped like its results

#### Scenario: Search returns nothing

- **WHEN** the request resolves with no matches
- **THEN** the existing empty-result message is shown, not placeholder rows

### Requirement: A list view's empty state is reserved for a genuinely empty result

A self-fetching list view SHALL present its empty state only once its request
has resolved and returned nothing. It SHALL NOT present the empty state while
the request is in flight, nor in the interval between the request resolving and
its rows appearing: the displayed rows SHALL be derived from the resolved data
as the view renders, rather than copied into separate state after the render, so
no frame is drawn in which data exists but the view believes it is empty. A view
that hides a row optimistically — a delete offering an undo — SHALL keep doing
so without reintroducing that gap.

#### Scenario: First load of a list view that has rows

- **WHEN** a list view's request is in flight
- **THEN** placeholder rows are shown, and the empty state is not

#### Scenario: Rows arrive

- **WHEN** the request resolves with rows
- **THEN** the rows are displayed directly, with the empty state never appearing
  in between

#### Scenario: The store genuinely has no rows

- **WHEN** the request resolves and returns nothing
- **THEN** the empty state is shown

#### Scenario: Deleting a row with an undo offer

- **WHEN** a user deletes a row and an undo offer is shown
- **THEN** the row disappears immediately, and accepting the undo restores it

### Requirement: Placeholders are reserved for fetching, not for submitting

Placeholder content SHALL be shown only while data is being fetched. An
operation that submits changes SHALL keep its existing pending treatment, and
SHALL NOT replace already-visible content with placeholders.

#### Scenario: Saving a settings page

- **WHEN** a user saves a settings page
- **THEN** the save control shows its pending state and the form stays visible
  and readable

#### Scenario: Deleting from a list view

- **WHEN** a user deletes a row from an embedded list view
- **THEN** the pending state appears on the control that triggered it, not as
  placeholders over the list

### Requirement: Controls fed by a background request keep their existing treatment

A request whose only role is to supply options to a control that is already on
screen, or to recalculate values already displayed, SHALL NOT replace that
control or those values with placeholders. Those surfaces SHALL keep their
existing inline treatment.

#### Scenario: A select whose options are still loading

- **WHEN** a form renders a select whose option list is still being fetched
- **THEN** the select and its label stay rendered in place rather than becoming
  placeholders

#### Scenario: Recalculating totals already on screen

- **WHEN** an amount already shown to the user is being recalculated
- **THEN** the existing value stays visible with its inline activity indicator,
  and is not replaced by a placeholder
