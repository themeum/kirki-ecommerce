## ADDED Requirements

### Requirement: Date range picker accepts a custom preset list

The `DateRangePicker` presets SHALL accept, in addition to the built-in preset
keys, a list of custom presets. Each custom preset SHALL have a key, a label,
and a function that returns its range for a given day. The picker SHALL show the
custom presets in the given order and SHALL mark a preset active when the
selected range matches its range. A picker that does not pass custom presets
SHALL show the built-in presets as before.

#### Scenario: Custom presets in order

- **WHEN** a picker gets the custom presets Today, Last 90 days, and Year to date
- **THEN** the preset list shows those three labels in that order

#### Scenario: Active custom preset

- **WHEN** today is Oct 14, 2026, a custom preset Last 90 days is passed, and the selected range is Jul 17 – Oct 14, 2026
- **THEN** Last 90 days is marked active

#### Scenario: Built-in presets unchanged

- **WHEN** a picker passes `presets` as true
- **THEN** it shows the built-in presets, as before this change

### Requirement: Date range picker confirm mode

The `DateRangePicker` SHALL have an opt-in confirm mode. In confirm mode, the
panel SHALL show read-only Start and End fields above the calendar and a footer
with a day count and Cancel and Apply buttons. Clicks on days and presets SHALL
change only a pending range, and the overlay SHALL stay open after the end date
is selected. Apply SHALL send the pending range to the change handler and close
the overlay. Cancel, Escape, or a click outside SHALL close the overlay without
a change. Apply SHALL be disabled until the pending range has a start and an
end. Without confirm mode, the picker SHALL behave as before: it commits the
range when the end date is selected.

#### Scenario: Pending range is not committed

- **WHEN** a confirm-mode picker has the value Oct 8 – 14, 2026 and the user selects Sep 7 and Sep 15
- **THEN** the overlay stays open, the Start field shows "Sep 7, 2026", the End field shows "Sep 15, 2026", the footer shows "9 days", and the change handler is not called

#### Scenario: Apply commits

- **WHEN** the user then selects Apply
- **THEN** the change handler gets Sep 7 – Sep 15, 2026 and the overlay closes

#### Scenario: Click outside discards

- **WHEN** a confirm-mode picker has a pending range and the user clicks outside the overlay
- **THEN** the overlay closes, the change handler is not called, and the next open shows the committed value

#### Scenario: Start/End fields are read-only

- **WHEN** the user focuses the Start field
- **THEN** the user cannot type in it

#### Scenario: Default mode unchanged

- **WHEN** a picker without confirm mode gets a start and an end date
- **THEN** it commits the range and closes, as before this change

### Requirement: Date range picker custom trigger

The `DateRangePicker` SHALL accept a custom trigger element. When one is given,
the picker SHALL render it as the control that opens the overlay, in place of
the default field trigger, and SHALL keep the overlay's accessibility
attributes on it. Without a custom trigger, the picker SHALL show the default
field trigger.

#### Scenario: Custom trigger opens the overlay

- **WHEN** a picker gets a custom button as its trigger and the user selects that button
- **THEN** the overlay opens and the button has `aria-expanded="true"`

#### Scenario: Default trigger unchanged

- **WHEN** a picker gets no custom trigger
- **THEN** it shows the default field trigger with the start and end dates
