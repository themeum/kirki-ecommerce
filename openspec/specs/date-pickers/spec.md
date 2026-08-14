# date-pickers Specification

## Purpose
Provides calendar and date/time selection controls for the admin UI, so features can capture single dates, date ranges, times, and combined date-times through themed, accessible, form-bindable components instead of native browser inputs.
## Requirements
### Requirement: Calendar renders a navigable month grid

The system SHALL provide a `Calendar` control that renders one or more months as a grid of days, with the weekday header row, controls to move to the previous and next month, and a visible indication of today's date.

#### Scenario: Month grid is rendered

- **WHEN** a `Calendar` is rendered without an explicit month
- **THEN** the grid shows the current month, its weekday header row, and marks today's date as distinct from other days

#### Scenario: Navigating between months

- **WHEN** the user activates the next-month control
- **THEN** the grid advances to the following month and the displayed month label updates

#### Scenario: Days outside the current month

- **WHEN** the first or last week of the displayed month is partially filled
- **THEN** the remaining cells show the adjacent months' days, visually de-emphasised from in-month days

#### Scenario: Week begins on the configured day

- **WHEN** no week-start is supplied
- **THEN** the weekday header begins on Sunday
- **AND WHEN** a caller supplies a different week-start
- **THEN** the header and day columns shift to begin on that day

### Requirement: Calendar supports single, multiple, and range selection

The `Calendar` SHALL support selecting exactly one day, several independent days, or a contiguous start-to-end range, determined by the caller.

#### Scenario: Selecting a single day

- **WHEN** the calendar is in single-selection mode and the user activates a day
- **THEN** that day is marked selected and any previously selected day is deselected

#### Scenario: Selecting a range

- **WHEN** the calendar is in range mode and the user activates a start day and then a later day
- **THEN** both endpoints are marked as range boundaries and every day between them is marked as inside the range

#### Scenario: Reversed range selection

- **WHEN** the user activates a second day that falls before the current start day
- **THEN** the range re-anchors so that the earlier day is the start and the later day is the end

### Requirement: Date and time values are exchanged as formatted strings

All picker controls SHALL accept and emit their value as a formatted string rather than a date object, so values can be stored directly in form state and sent to the API without conversion. Dates use `yyyy-MM-dd`, times use `HH:mm`, and combined date-times use `yyyy-MM-dd HH:mm`.

#### Scenario: Selection emits a formatted string

- **WHEN** the user selects 3 June 2026 in a date picker
- **THEN** the change handler receives exactly `'2026-06-03'`

#### Scenario: Unparseable value is treated as empty

- **WHEN** a picker receives a value that is not a valid date in its expected format
- **THEN** the control renders its placeholder and reports no selection, rather than rendering an invalid date

#### Scenario: Cleared selection emits null

- **WHEN** the user clears a clearable picker's value
- **THEN** the change handler receives `null`

### Requirement: Date picker presents the calendar in an overlay

The system SHALL provide a `DatePicker` that renders a trigger showing the formatted selection or a placeholder, and reveals the calendar in a dismissible overlay anchored to that trigger.

#### Scenario: Opening and selecting

- **WHEN** the user activates the trigger and then activates a day
- **THEN** the overlay closes and the trigger displays the newly selected date in the caller-supplied display format

#### Scenario: Empty state

- **WHEN** the picker has no value
- **THEN** the trigger shows the placeholder text, visually distinguished from a real selection

#### Scenario: Dismissing without selecting

- **WHEN** the overlay is open and the user presses Escape or clicks outside it
- **THEN** the overlay closes and the value is unchanged

### Requirement: Date range picker selects a start and end date

The system SHALL provide a `DateRangePicker` whose value is a start/end pair of date strings and which displays two consecutive months at once.

#### Scenario: Trigger shows both endpoints

- **WHEN** a range with both endpoints is selected
- **THEN** the trigger displays the start and end dates separated by a range delimiter

#### Scenario: Overlay stays open mid-range

- **WHEN** the user has selected only the start of a range
- **THEN** the overlay remains open so the end date can be selected

### Requirement: Time picker selects an hour and minute

The system SHALL provide a `TimePicker` presenting a single time-entry field together with one dismissible overlay that offers an hour list and a minute list side by side, and a meridiem list as well when the picker is in 12-hour presentation. The user SHALL be able to set the value either by choosing from those lists or by entering a time directly into the field, and the picker SHALL always emit a 24-hour `HH:mm` string. The field SHALL behave as a time control rather than free text: it accepts only a well-formed time, so a partial or malformed entry is never emitted.

#### Scenario: Selecting a time

- **WHEN** the user chooses hour `14` and then minute `30`
- **THEN** the change handler receives `'14:30'`
- **AND** the overlay stays open while the first of the two is chosen

#### Scenario: Twelve-hour presentation

- **WHEN** the picker is in 12-hour mode and the user chooses `2`, `30`, and the afternoon meridiem from the overlay
- **THEN** the change handler still receives `'14:30'`

#### Scenario: Minute granularity

- **WHEN** the overlay is open
- **THEN** every minute from `00` to `59` is offered, and every hour of the day is offered

#### Scenario: Opening from the field

- **WHEN** the user focuses or clicks the time field
- **THEN** the overlay opens, including when a previous overlay was dismissed while the field kept focus

#### Scenario: Editing the field with the overlay open

- **WHEN** the overlay is open and the user clicks or moves focus into the time field
- **THEN** the overlay stays open

#### Scenario: Entering a time in the field

- **WHEN** the user enters a complete time into the field
- **THEN** the change handler receives that time as a 24-hour `HH:mm` string

#### Scenario: Incomplete entry

- **WHEN** the user has entered only part of a time
- **THEN** no change is emitted until the entry is complete

#### Scenario: Emptying the field

- **WHEN** the user clears the field and moves focus away
- **THEN** the change handler receives `null`

### Requirement: Date-time picker combines a calendar and a time control

The system SHALL provide a `DateTimePicker` presenting a calendar and a time control together in one overlay, emitting a single combined `yyyy-MM-dd HH:mm` string.

#### Scenario: Changing the date preserves the time

- **WHEN** the value is `'2026-06-03 14:30'` and the user selects a different day
- **THEN** the emitted value keeps `14:30` and changes only the date portion

#### Scenario: Choosing a time before a date

- **WHEN** no date has been selected and the user changes the time
- **THEN** the date defaults to the currently displayed day and the combined value is emitted

#### Scenario: Date selected without a time

- **WHEN** the user selects a date while no time is set
- **THEN** the time defaults to the start of day (`00:00`)

### Requirement: Pickers honour bounds, disabled state, and validation state

Every picker SHALL support being disabled, being constrained to a minimum and/or maximum selectable date, and rendering an error appearance when its value is invalid.

#### Scenario: Out-of-bounds days are not selectable

- **WHEN** a minimum date is supplied
- **THEN** days before it are presented as unavailable and activating them does not change the value

#### Scenario: Disabled picker cannot be opened

- **WHEN** a picker is disabled and the user activates its trigger
- **THEN** the overlay does not open and no change is emitted

#### Scenario: Error appearance

- **WHEN** a picker is marked as being in error
- **THEN** its trigger renders the design system's error treatment and is marked invalid for assistive technology

### Requirement: Pickers are operable by keyboard and exposed to assistive technology

Calendar and picker controls SHALL be fully operable without a pointer and SHALL expose their structure and state to assistive technology.

#### Scenario: Keyboard navigation across days

- **WHEN** focus is inside the month grid and the user presses the arrow keys
- **THEN** focus moves between days, crossing into the adjacent month when moving past the first or last day

#### Scenario: Selection state is announced

- **WHEN** a day is selected, disabled, or is today
- **THEN** that state is exposed to assistive technology, not conveyed by colour alone

#### Scenario: Trigger describes the overlay

- **WHEN** a picker trigger is focused
- **THEN** it exposes whether its overlay is currently expanded

### Requirement: Picker overlays render within the plugin's own root and above wp-admin chrome

Because the admin UI is mounted inside wp-admin, picker overlays SHALL render inside the plugin's portal root and SHALL stack above the WordPress admin bar and admin menu. No global stylesheet from a third party may be loaded that could affect elements outside the plugin's root.

#### Scenario: Overlay is inside the plugin root

- **WHEN** a picker overlay is open
- **THEN** its element is a descendant of the plugin's portal root, so the app's scoped styles apply to it

#### Scenario: Overlay is not obscured by admin chrome

- **WHEN** a picker overlay opens near the WordPress admin bar or admin menu
- **THEN** the overlay is rendered above them and remains fully interactive

#### Scenario: No unscoped third-party styles

- **WHEN** the admin app is loaded
- **THEN** no calendar stylesheet is loaded that applies rules outside the plugin's root

### Requirement: Form field wrappers bind pickers to form state

The system SHALL provide a single form-field wrapper — `DateField` — that binds a picker to a named form field and renders the same label, description, and error affordances as every other field in the design system. The caller SHALL select which picker is bound through a mode, covering single date, date range, time, and combined date-time selection; when no mode is supplied the field SHALL bind the single-date picker.

#### Scenario: Value flows to and from form state

- **WHEN** a `DateField` is bound to a form field holding `'2026-06-03'`
- **THEN** the picker displays that date, and selecting a different day writes the new string back to that form field

#### Scenario: Mode selects the bound picker

- **WHEN** a caller supplies the time mode
- **THEN** the field binds the time picker and writes an `HH:mm` string back to form state
- **AND WHEN** a caller supplies the date-range mode
- **THEN** the field binds the range picker and writes a start/end pair back to form state

#### Scenario: Validation errors are surfaced

- **WHEN** the bound form field has a validation error
- **THEN** the field renders the error message beneath the control and the control takes on the error appearance

#### Scenario: Label is associated with the control

- **WHEN** a label is supplied
- **THEN** activating the label moves focus to the picker's trigger

#### Scenario: Empty selection is normalised

- **WHEN** the user clears the picker
- **THEN** the form field is written as `null` rather than an empty string

