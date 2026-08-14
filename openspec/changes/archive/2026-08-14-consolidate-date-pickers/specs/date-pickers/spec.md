## MODIFIED Requirements

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
