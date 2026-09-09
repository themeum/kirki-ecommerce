# data-table-filter-popover Specification

## Purpose

Defines the shared filter overlay used by list screens: how edits are held as a draft until applied,
and how the control that opens it reports the number of filters currently in force and clears them.

## Requirements

### Requirement: Filter edits are a draft until applied

The overlay SHALL hold a merchant's edits as a draft, seeded from the filters currently in force at
the moment it opens. Changing a control in the overlay SHALL NOT change the listed results. Only
applying SHALL put the draft into force.

#### Scenario: Editing without applying

- **WHEN** a merchant opens the overlay and changes a filter control
- **THEN** the listed results are unchanged

#### Scenario: Dismissing without applying

- **WHEN** a merchant changes a filter control and then dismisses the overlay without applying
- **THEN** the filters in force are unchanged
- **AND** reopening the overlay shows the filters that are in force, not the abandoned edits

#### Scenario: Applying

- **WHEN** a merchant applies the draft
- **THEN** the overlay closes
- **AND** the list is re-requested with the new filters and returns to its first page

#### Scenario: Reopening after applying

- **WHEN** a merchant applies filters and then reopens the overlay
- **THEN** the controls show the filters now in force

### Requirement: The trigger reports how many filters are in force

The control that opens the overlay SHALL report the number of filters currently in force. Each
filter control holding a value other than its default SHALL count as one, however many values that
control holds. A control left at its default SHALL count as none. When nothing is in force, the
trigger SHALL report no count.

#### Scenario: A multi-valued filter

- **WHEN** one filter control holds six selected values and no other filter is set
- **THEN** the trigger reports one filter

#### Scenario: Several filters

- **WHEN** three separate filter controls each hold a non-default value
- **THEN** the trigger reports three filters

#### Scenario: A control left at its default

- **WHEN** a filter control is left at its default value
- **THEN** it does not contribute to the count

#### Scenario: Nothing filtered

- **WHEN** no filter is in force
- **THEN** the trigger reports no count

### Requirement: The trigger offers to clear every filter at once

While at least one filter is in force, the trigger SHALL present a clear control alongside it.
Activating it SHALL remove every filter the overlay governs and re-request the list. It SHALL NOT
clear the search term or the date range, which have their own controls in the toolbar.

#### Scenario: Clearing

- **WHEN** filters are in force and the merchant activates the clear control
- **THEN** every filter the overlay governs is removed
- **AND** the trigger reports no count
- **AND** the list is re-requested

#### Scenario: Search term survives clearing

- **WHEN** a merchant has entered a search term and applied filters, and then clears the filters
- **THEN** the search term is still in force and still shown in its own control

#### Scenario: No clear control when nothing is filtered

- **WHEN** no filter is in force
- **THEN** no clear control is presented

### Requirement: One overlay serves every filtered list

The overlay SHALL be a single shared presentation into which a feature supplies only its own filter
controls. A feature SHALL NOT restate the overlay's own structure, its apply and dismiss behaviour,
or its draft handling.

#### Scenario: Adding a filter to a screen

- **WHEN** a developer adds a filter control to a list screen
- **THEN** only that feature's filter controls are edited

#### Scenario: Consistency across screens

- **WHEN** a merchant opens the filter overlay on two different list screens
- **THEN** both present the same structure, apply behaviour and trigger
