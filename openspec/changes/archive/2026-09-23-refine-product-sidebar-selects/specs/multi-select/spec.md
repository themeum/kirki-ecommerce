## ADDED Requirements

### Requirement: A field may hold a single selection

A multi-select SHALL accept a mode in which it holds at most one option. In that mode choosing an option replaces whatever was held and closes the panel, because there is nothing further to collect.

While an option is held the field SHALL render its chip across the full width of the box and SHALL withdraw the text cursor, so the box reads as a filled field rather than as a row of tokens with space for more. Removing the chip restores the cursor and the placeholder. Removal still runs through the chip's own remove control, and options are listed, searched and created exactly as they are when the field holds many.

Option rows in this mode SHALL NOT carry a checkbox.

#### Scenario: Choosing in single mode

- **WHEN** a merchant chooses an option in a single-selection field
- **THEN** that option becomes the field's only value and the panel closes

#### Scenario: Replacing in single mode

- **WHEN** a merchant reopens the panel and chooses a different option
- **THEN** the new option replaces the held one and the field still holds exactly one

#### Scenario: The held chip fills the box

- **WHEN** a single-selection field holds an option
- **THEN** its chip spans the full width of the box and no text cursor is offered

#### Scenario: Removing in single mode

- **WHEN** a merchant activates the held chip's remove control
- **THEN** the field holds nothing, and the text cursor and placeholder return

#### Scenario: No checkboxes in the list

- **WHEN** a merchant opens the list of a single-selection field
- **THEN** no row shows a checkbox

#### Scenario: Searching before a choice is made

- **WHEN** a single-selection field holds nothing and a merchant types
- **THEN** the list filters as it does in a many-value field

## MODIFIED Requirements

### Requirement: Option rows carry a checkbox

Each option row in a field that holds many values SHALL show a checkbox in its leading gutter reflecting whether that option is selected. The checkbox MUST read as selected for an option in the current selection and unselected otherwise, and MUST be visible whether or not the row is hovered or active. The row itself MUST remain the click target, so the checkbox reports state rather than receiving the click.

A field that holds a single value SHALL NOT show checkboxes. A checkbox offers a selection that can be combined with the others beside it, and in that mode it cannot be.

#### Scenario: Single-value list

- **WHEN** a merchant opens the list of a field that holds one value
- **THEN** no row shows a checkbox
- **AND** choosing a row still replaces the held value and closes the panel

### Requirement: A field may cap how many chips it shows

A multi-select SHALL accept an optional cap on visible chips, expressed either as a number of chips or as a number of rendered rows. A field SHALL NOT set both. Where a cap is set and the selection exceeds it, only the chips within the cap render, followed by a control reading how many are hidden. That control MUST NOT offer a remove control, because it stands for several selections at once. Activating it SHALL reveal every chip and replace it with a control that collapses the set back, placed after the last chip. Where no cap is set, every chip renders and the row wraps.

Where the cap is expressed in rows, the field SHALL determine which chips fall beyond the capped row by measuring where the chips actually wrap, so that the cap holds for any mix of short and long labels. That measurement MUST resolve before the chips are painted, and MUST be repeated when the field's width changes, so the row never visibly reflows.

The expanded state MUST reset when the selection falls back within the cap, so a collapsed row never shows a stale collapse control.

#### Scenario: Uncapped field

- **WHEN** a field sets no cap
- **THEN** every selected option renders as a chip and the row wraps as needed

#### Scenario: Selection within the cap

- **WHEN** a capped field's selection is no larger than its cap
- **THEN** every chip renders and no counter appears

#### Scenario: Selection beyond the cap

- **WHEN** a capped field's selection exceeds its cap
- **THEN** only the chips within the cap render, followed by a control reading the number hidden
- **AND** that control offers no remove control

#### Scenario: Row cap with short labels

- **WHEN** a field capped at a number of rows holds many short labels that together occupy no more than that many rows
- **THEN** every chip renders and no counter appears

#### Scenario: Row cap with long labels

- **WHEN** a field capped at a number of rows holds few labels long enough to wrap past that many rows
- **THEN** the chips that fall beyond the capped row are hidden behind the counter
- **AND** the visible chips occupy no more than the capped number of rows

#### Scenario: Field width changes

- **WHEN** the width available to a row-capped field changes so that a different number of chips fits within the cap
- **THEN** the set of visible chips and the counter update to match the new width

#### Scenario: Expanding and collapsing

- **WHEN** a merchant activates the counter
- **THEN** every chip in the selection renders across as many rows as needed
- **AND** a collapse control follows the last chip
- **WHEN** the merchant activates that collapse control
- **THEN** the row returns to the capped chips and the counter

### Requirement: Chips and the text cursor share one row inside the box

The selection SHALL render as chips inside the field's bordered box, on the same wrapping row as the text input, in selection order and ahead of the input. The input MUST remain the row's last item and MUST keep a usable minimum width when chips precede it. The box MUST grow in height as the row wraps and MUST NOT scroll its chips horizontally or clip them.

While the field holds nothing, the box SHALL rest at the same height as the project's plain text field, so a form mixing the two reads as one set of controls rather than two. It SHALL grow from that resting height as chips arrive and the row wraps, rather than reserving the taller room while empty.

Clicking anywhere in the box that is not a chip's own control SHALL place the cursor in the text input.

#### Scenario: Selecting adds a chip ahead of the cursor

- **WHEN** a merchant chooses an option
- **THEN** a chip for it appears inside the box before the text input
- **AND** the cursor stays in the text input

#### Scenario: An empty field rests at the standard field height

- **WHEN** a multi-select holding nothing is rendered beside a plain text field
- **THEN** the two stand at the same height

#### Scenario: The box grows once something is held

- **WHEN** a chip is added to a field that was empty
- **THEN** the box grows to fit the chip rather than the chip being clipped

#### Scenario: The row wraps

- **WHEN** the chips and the input no longer fit on one row
- **THEN** the box grows taller and the row wraps, with no chip clipped or scrolled out of view

#### Scenario: Clicking the box focuses the input

- **WHEN** a merchant clicks the padding of the box rather than a chip
- **THEN** the text input takes focus and the option list opens

#### Scenario: Removing a chip

- **WHEN** a merchant activates a chip's remove control
- **THEN** that option leaves the selection and the record it refers to is not deleted

### Requirement: Presentation is supplied by the caller

`MultiSelect` SHALL accept optional `renderOption` and `renderChip` slots that render an option's content, each defaulting to the option's title. Decorations beyond the title — colour swatches, thumbnails, subtitles — MUST be composed through these slots. The system MUST NOT require changes to `MultiSelect` or to the option type to add a new decoration.

`MultiSelect` SHALL additionally accept an optional per-option style for the row itself. The render slots compose content *after* the checkbox, so anything that must move the checkbox as well — a tree indent, for one — cannot be expressed through them. Where no such style is supplied every row is styled alike.

#### Scenario: Colour swatch through the render slots

- **WHEN** a caller supplies `renderOption` and `renderChip` that compose a `ColorSwatch` with the title
- **THEN** each option row and each chip shows that swatch beside the title

#### Scenario: Default rendering

- **WHEN** a caller supplies neither slot
- **THEN** option rows and chips show the option's title alone

#### Scenario: Styling the row itself

- **WHEN** a caller supplies a per-option row style that adds leading space
- **THEN** the whole row shifts, carrying its checkbox with it

#### Scenario: No row style supplied

- **WHEN** a caller supplies no per-option row style
- **THEN** every option row keeps the component's own padding
