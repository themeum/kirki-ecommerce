## ADDED Requirements

### Requirement: Chips and the text cursor share one row inside the box

The selection SHALL render as chips inside the field's bordered box, on the same wrapping row as the text input, in selection order and ahead of the input. The input MUST remain the row's last item and MUST keep a usable minimum width when chips precede it. The box MUST grow in height as the row wraps and MUST NOT scroll its chips horizontally or clip them.

Clicking anywhere in the box that is not a chip's own control SHALL place the cursor in the text input.

#### Scenario: Selecting adds a chip ahead of the cursor

- **WHEN** a merchant chooses an option
- **THEN** a chip for it appears inside the box before the text input
- **AND** the cursor stays in the text input

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

Each option row SHALL show a checkbox in its leading gutter reflecting whether that option is selected. The checkbox MUST read as selected for an option in the current selection and unselected otherwise, and MUST be visible whether or not the row is hovered or active. The row itself MUST remain the click target, so the checkbox reports state rather than receiving the click.

#### Scenario: Unselected option

- **WHEN** an option is not in the current selection
- **THEN** its row shows an unchecked checkbox

#### Scenario: Selected option

- **WHEN** an option is in the current selection
- **THEN** its row shows a checked checkbox

#### Scenario: Toggling from the row

- **WHEN** a merchant activates an option row anywhere along its width
- **THEN** that option's selected state flips and its checkbox follows

### Requirement: A field may cap how many chips it shows

A multi-select SHALL accept an optional cap on visible chips. Where a cap is set and the selection exceeds it, only that many chips render, followed by a control reading how many are hidden. That control MUST NOT offer a remove control, because it stands for several selections at once. Activating it SHALL reveal every chip and replace it with a control that collapses the set back, placed after the last chip. Where no cap is set, every chip renders and the row wraps.

The expanded state MUST reset when the selection falls back within the cap, so a collapsed row never shows a stale collapse control.

#### Scenario: Uncapped field

- **WHEN** a field sets no cap
- **THEN** every selected option renders as a chip and the row wraps as needed

#### Scenario: Selection within the cap

- **WHEN** a capped field's selection is no larger than its cap
- **THEN** every chip renders and no counter appears

#### Scenario: Selection beyond the cap

- **WHEN** a capped field's selection exceeds its cap
- **THEN** only the capped number of chips render, followed by a control reading the number hidden
- **AND** that control offers no remove control

#### Scenario: Expanding and collapsing

- **WHEN** a merchant activates the counter
- **THEN** every chip in the selection renders across as many rows as needed
- **AND** a collapse control follows the last chip
- **WHEN** the merchant activates that collapse control
- **THEN** the row returns to the capped number of chips and the counter

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

## MODIFIED Requirements

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

### Requirement: Keyboard navigation

The option list SHALL be navigable from the keyboard: arrow keys MUST move the active option, Enter MUST choose it, and Escape MUST close the panel and return focus to the text input. The text input MUST expose the active option through `aria-activedescendant`.

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
