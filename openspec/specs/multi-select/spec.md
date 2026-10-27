# multi-select Specification

## Purpose

Provides the single multi-select control for the admin: a bordered box whose chips and text cursor share one wrapping row, with a searchable option list dropping beneath it, plus the react-hook-form field components built on it.

## Requirements

### Requirement: One multi-select primitive

The system SHALL provide exactly one multi-select control, `MultiSelect`, presenting its selection as chips inside its own bordered box. Controls that need a bordered box with a separate control row and chips beneath it, and are not searchable multi-selects, SHALL compose the `ChipField` frame directly rather than adding modes to `MultiSelect`.

A field that holds at most one value SHALL use the same box, capped to a single chip, rather than a second control with its own frame. Choosing a value while one is already held MUST replace it.

#### Scenario: Selecting and deselecting

- **WHEN** a merchant opens the option list and chooses an unselected option
- **THEN** the option is added as a chip inside the box
- **AND** the option remains in the list with its checkbox checked

#### Scenario: Deselecting from the list or the chip

- **WHEN** a merchant chooses an already-selected option, or activates its chip's remove control
- **THEN** the option is removed from the selection

#### Scenario: Single-value field

- **WHEN** a merchant chooses a value in a field that holds at most one
- **THEN** it replaces whatever was held, and the box shows exactly one chip

#### Scenario: Read-only picker reuses the frame only

- **WHEN** a control presents chips but delegates picking to its own dialog
- **THEN** it composes `ChipField` with its own trigger
- **AND** `MultiSelect` gains no read-only or click-through mode

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
### Requirement: Selection is carried as option objects

`MultiSelect` SHALL be controlled with the selected option objects rather than their ids, and SHALL determine identity through `getOptionId`, defaulting to the option's `value`. A selected option that is absent from the current option list MUST still render as a chip.

#### Scenario: Newly created value before the list refreshes

- **WHEN** a value is created and added to the selection before its option list has refetched
- **THEN** it renders as a chip immediately

### Requirement: Creation is recoverable

Where a create action is offered, the create row SHALL be pinned below the option list, separated from it, so it stays reachable however long the list is and whatever the query matches. Typing text that does not exactly match an existing option MUST label that row with the typed text rather than the kind of thing being created, so the merchant can read back exactly what will be created. A field MAY additionally supply a standing label for the row when nothing is typed, for creation that does not begin from a query; where it does not, the row appears only once there is an unmatched query.

The empty-result message SHALL still show when a query matches no option, because the pinned row no longer needs the space.

When the handler returns a promise, the system MUST keep the create row in a pending state until it settles. On resolution it MUST clear the search text and leave the panel open on the unfiltered list, so the merchant can keep choosing. On rejection it MUST leave the panel open with the typed text intact.

#### Scenario: The create row names the typed text

- **WHEN** a merchant types a value that matches no existing option
- **THEN** the pinned create row reads that value back, quoted

#### Scenario: The create row stays reachable

- **WHEN** a merchant scrolls a long option list
- **THEN** the create row stays in place below the list rather than scrolling away

#### Scenario: Standing create label

- **WHEN** a field supplies a standing label and the input is empty
- **THEN** the create row shows that label

#### Scenario: No standing label

- **WHEN** a field supplies no standing label and the input is empty
- **THEN** no create row shows

#### Scenario: No match

- **WHEN** a merchant's query matches no option
- **THEN** the panel shows its empty-result message above the create row

#### Scenario: Create succeeds

- **WHEN** a merchant confirms the create row and the handler resolves
- **THEN** the new value joins the selection as a chip
- **AND** the search text clears and the panel stays open showing the unfiltered list

#### Scenario: Create fails validation

- **WHEN** a merchant confirms the create row and the handler rejects
- **THEN** the panel stays open with the typed text still present
- **AND** the field shows the validation error

#### Scenario: Create hands off to other content

- **WHEN** the handler takes over the panel or opens a dialog instead of persisting directly, and returns no promise
- **THEN** the option list gives way and the typed text is preserved for that handler to use

### Requirement: The panel can host caller content in place of its list

A multi-select SHALL accept optional panel content that replaces the option list and the create row while it is present. While that content is shown the field MUST keep the panel open, MUST NOT close it on interaction inside it, and MUST NOT let the option list's keyboard handling act on keys pressed within it.

#### Scenario: A field asks a follow-up question

- **WHEN** a field supplies panel content
- **THEN** the panel shows that content instead of the option list and the create row

#### Scenario: Keys inside the panel content

- **WHEN** a merchant types or presses Enter inside the supplied content
- **THEN** the option list does not select an option and the panel does not close

#### Scenario: Returning to the list

- **WHEN** the field withdraws its panel content
- **THEN** the option list and the create row return and the panel is still open

### Requirement: Keyboard navigation

The option list SHALL be navigable from the keyboard: arrow keys MUST move the active option, Enter MUST choose it, and Escape MUST close the panel and return focus to the text input. The active option MUST be exposed to assistive technology as the list's selected row, so a merchant navigating by keyboard can tell which option Enter would choose.

Because the create row is pinned outside the list, arrow keys MUST NOT reach it. Where a create row is offered and the query matches no option, Enter MUST fall through to creation instead.

#### Scenario: Choosing an option by keyboard

- **WHEN** a merchant types to filter, presses ArrowDown and then Enter
- **THEN** the active option is added to the selection

#### Scenario: Creating by keyboard

- **WHEN** a merchant types a value matching no option on a creatable field and presses Enter
- **THEN** the value is created and added to the selection

#### Scenario: Enter prefers a match over creation

- **WHEN** a merchant's query matches at least one option and they press Enter
- **THEN** the active option is selected and nothing is created

#### Scenario: Removing a chip by keyboard

- **WHEN** a merchant focuses a chip's remove control and presses Enter
- **THEN** that option is removed from the selection, and the option list neither selects an option nor closes

#### Scenario: Dismissing the panel

- **WHEN** a merchant presses Escape or clicks outside the field
- **THEN** the panel closes and focus lands on the text input

### Requirement: Typing shortcuts commit and remove

Pressing Backspace in an empty text input SHALL remove the last chip in the selection. On a field that offers creation, pressing comma SHALL commit the trimmed typed text exactly as Enter does, and the comma MUST NOT reach the input.

Neither shortcut may fire while the input holds text that the merchant is still editing: Backspace with any text present MUST edit that text and leave the selection alone.

#### Scenario: Backspace on an empty input

- **WHEN** a merchant presses Backspace with the input empty and at least one chip selected
- **THEN** the last chip is removed from the selection

#### Scenario: Backspace while typing

- **WHEN** a merchant presses Backspace with text in the input
- **THEN** a character is deleted and the selection is unchanged

#### Scenario: Comma commits

- **WHEN** a merchant types a value matching no option on a creatable field and presses comma
- **THEN** the value is created and added to the selection, and no comma appears in the input

### Requirement: Domain fields own their own data

Each data type presented through a multi-select SHALL have one field component that owns its option query, its create mutation, its error mapping, and the mapping between the form's value shape and the option shape. Pages SHALL NOT re-implement that wiring.

#### Scenario: Tags in the product form

- **WHEN** the product form renders its Tags field
- **THEN** it renders `TagsField` with a field name and label only
- **AND** `TagsField` resolves the tag list, creates new tags, and maps `{ id, name }` refs itself

#### Scenario: Free-text values

- **WHEN** a field stores a plain list of strings and allows free-text entry
- **THEN** the field wrapper maps each string to and from an option and appends newly typed entries
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

