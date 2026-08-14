## MODIFIED Requirements

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
