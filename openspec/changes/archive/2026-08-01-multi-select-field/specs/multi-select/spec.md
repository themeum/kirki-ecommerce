## Purpose

Provides the single multi-select control for the admin: a search input with a popover option list and the current selection listed as chips beneath it, plus the react-hook-form field components built on it.

## ADDED Requirements

### Requirement: One multi-select primitive

The system SHALL provide exactly one multi-select control, `MultiSelect`. Controls that need a bordered box with a control row and chips beneath but are not searchable multi-selects SHALL compose the `ChipField` frame directly rather than adding modes to `MultiSelect`.

#### Scenario: Selecting and deselecting

- **WHEN** a merchant opens the option list and chooses an unselected option
- **THEN** the option is added as a chip beneath the input
- **AND** the option remains in the list showing a checked state

#### Scenario: Deselecting from the list or the chip

- **WHEN** a merchant chooses an already-selected option, or activates its chip's remove control
- **THEN** the option is removed from the selection

#### Scenario: Read-only picker reuses the frame only

- **WHEN** a control presents chips but delegates picking to its own dialog
- **THEN** it composes `ChipField` with its own trigger
- **AND** `MultiSelect` gains no read-only or click-through mode

### Requirement: Presentation is supplied by the caller

`MultiSelect` SHALL accept optional `renderOption` and `renderChip` slots that render an option's content, each defaulting to the option's title. Decorations beyond the title — colour swatches, thumbnails, subtitles — MUST be composed through these slots. The system MUST NOT require changes to `MultiSelect` or to the option type to add a new decoration.

#### Scenario: Colour swatch through the render slots

- **WHEN** a caller supplies `renderOption` and `renderChip` that compose a `ColorSwatch` with the title
- **THEN** each option row and each chip shows that swatch beside the title

#### Scenario: Default rendering

- **WHEN** a caller supplies neither slot
- **THEN** option rows and chips show the option's title alone

### Requirement: Selection is carried as option objects

`MultiSelect` SHALL be controlled with the selected option objects rather than their ids, and SHALL determine identity through `getOptionId`, defaulting to the option's `value`. A selected option that is absent from the current option list MUST still render as a chip.

#### Scenario: Newly created value before the list refreshes

- **WHEN** a value is created and added to the selection before its option list has refetched
- **THEN** it renders as a chip immediately

### Requirement: Creation is recoverable

Where a create action is offered, typing text that does not exactly match an existing option SHALL offer a create row. When the handler returns a promise, the system MUST keep the create row in a pending state until it settles, MUST clear the search text and close the popover only when it resolves, and MUST leave the popover open with the typed text intact when it rejects.

#### Scenario: Create succeeds

- **WHEN** a merchant confirms the create row and the handler resolves
- **THEN** the search text clears and the popover closes

#### Scenario: Create fails validation

- **WHEN** a merchant confirms the create row and the handler rejects
- **THEN** the popover stays open with the typed text still present
- **AND** the field shows the validation error

#### Scenario: Create hands off to a dialog

- **WHEN** the handler opens a dialog instead of persisting directly and returns no promise
- **THEN** the popover closes immediately and the dialog takes over

### Requirement: Keyboard navigation

The option list SHALL be navigable from the keyboard: arrow keys MUST move the active option, Enter MUST choose it, and Escape MUST close the popover. The search input MUST expose the active option through `aria-activedescendant`.

#### Scenario: Choosing an option by keyboard

- **WHEN** a merchant types to filter, presses ArrowDown and then Enter
- **THEN** the active option is added to the selection

#### Scenario: Removing a chip by keyboard

- **WHEN** a merchant focuses a chip's remove control and presses Enter
- **THEN** that option is removed from the selection

### Requirement: Domain fields own their own data

Each data type presented through a multi-select SHALL have one field component that owns its option query, its create mutation, its error mapping, and the mapping between the form's value shape and the option shape. Pages SHALL NOT re-implement that wiring.

#### Scenario: Tags in the product form

- **WHEN** the product form renders its Tags field
- **THEN** it renders `TagsField` with a field name and label only
- **AND** `TagsField` resolves the tag list, creates new tags, and maps `{ id, name }` refs itself

#### Scenario: Free-text values

- **WHEN** a field stores a plain list of strings and allows free-text entry
- **THEN** the field wrapper maps each string to and from an option and appends newly typed entries
