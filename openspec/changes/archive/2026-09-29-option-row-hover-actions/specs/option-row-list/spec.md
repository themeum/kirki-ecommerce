## Purpose

Defines how a settings section presents a list of configurable options as rows — how each row
surfaces its actions, how those actions behave for pointer and keyboard users, and what the
section shows in place of the list when there is nothing to configure yet.

## ADDED Requirements

### Requirement: Row actions are reachable on every option list

Every row in an option list SHALL expose its configured actions (edit, delete, toggle, or a
menu) to the user, regardless of whether that list also configures an overflow menu.

#### Scenario: List without an overflow menu

- **WHEN** a section renders an option list that configures edit and delete but no overflow menu
- **THEN** pointing at a row reveals its edit and delete controls
- **AND** activating either control performs that action on that row

#### Scenario: List with an overflow menu

- **WHEN** a section renders an option list that configures an overflow menu
- **THEN** pointing at a row reveals the overflow trigger alongside its other controls

### Requirement: Revealing row actions does not move any content

Revealing a row's actions SHALL NOT change the position or size of any element on the page.

#### Scenario: Pointer enters a row

- **WHEN** the pointer moves onto a row and its actions become visible
- **THEN** the row's height, the position of its icon, title and badges, and the position of
  every other row are unchanged from the at-rest state

#### Scenario: Row carries trailing text

- **WHEN** a row displays trailing text or an icon in the same place the actions occupy
- **THEN** that content is concealed while the actions are shown, without collapsing or
  reflowing the row
- **AND** it reappears in its original position once the actions are hidden again

### Requirement: Row actions respond to keyboard focus

An option row SHALL reveal its actions when focus moves into the row, so the controls are
operable without a pointer.

#### Scenario: Tabbing into a row

- **WHEN** keyboard focus enters any control inside a row
- **THEN** that row's actions are visible and operable

### Requirement: An open row menu keeps its row's actions visible

While a row's overflow menu is open, that row's actions SHALL remain visible even though the
pointer has left the row and focus has moved into the menu.

#### Scenario: Pointer moves from the trigger into the open menu

- **WHEN** a row's overflow menu is open and the pointer moves off the row into the menu
- **THEN** the row's actions, including the overflow trigger, stay visible

#### Scenario: Menu closes

- **WHEN** the menu closes and the pointer is not over the row
- **THEN** the row's actions return to hidden

### Requirement: An option list is presented as one bordered group

An option list SHALL render as a single bordered, rounded container whose rows are divided by
separators, rather than as individually bordered rows.

#### Scenario: Multiple rows

- **WHEN** an option list renders two or more rows
- **THEN** one border encloses the whole list, the outer corners are rounded, and adjacent rows
  are divided by a single separator with no doubled border between them

#### Scenario: Single row

- **WHEN** an option list renders exactly one row
- **THEN** the container is rounded on all corners and shows no separator

### Requirement: Row state is legible without interaction

A row whose option is disabled SHALL indicate that at rest, without requiring the user to
hover or focus it.

#### Scenario: Disabled row at rest

- **WHEN** a row's option is disabled and the row is neither hovered nor focused
- **THEN** the row displays an "Inactive" badge

### Requirement: An empty section states what will appear

A settings section whose list has no entries SHALL present a placeholder naming what will
appear there once entries exist, instead of an empty container.

#### Scenario: No entries yet

- **WHEN** a section's list is empty
- **THEN** the section shows a placeholder with an illustrative icon and text naming the kind
  of entry that will appear there
- **AND** the control for creating a new entry remains available
