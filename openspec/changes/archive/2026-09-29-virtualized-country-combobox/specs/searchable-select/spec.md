## Purpose

Defines how the admin's searchable select behaves when its option list is long enough that mounting every row would be felt as lag, and how a caller attaches a leading icon to an option so that icon appears consistently wherever that option is shown.

## ADDED Requirements

### Requirement: Long option lists render only what is visible

The searchable select SHALL offer a mode, chosen by the caller per instance, in which only the option rows within the scrolled viewport plus a small overscan margin are rendered, regardless of how many options the caller supplies. In that mode the scroll extent MUST represent the full matched option count, so the scrollbar reflects the real list length and scrolling reaches every option. A caller that does not choose this mode SHALL get the existing behavior unchanged.

#### Scenario: Opening a list of several hundred options

- **WHEN** a merchant opens a searchable select that has opted into this mode and supplied several hundred options
- **THEN** only the rows in view plus a small overscan are present
- **AND** the list scrolls through the full set of options

#### Scenario: Callers that have not opted in are unaffected

- **WHEN** a searchable select that has not opted into this mode is opened
- **THEN** every option is rendered exactly as before, with no change to its behavior

### Requirement: Search matching and ranking are unchanged by the rendering mode

The set of options a search query matches, and the order those matches appear in, SHALL be identical whether or not the caller opted into rendering only visible rows. A query that matches an option today MUST still match it, and matches MUST remain ordered by descending match quality.

#### Scenario: Same query, same results

- **WHEN** a merchant types a query into a searchable select that renders only visible rows
- **THEN** the options shown, and their order, are the same as they would be in the unchanged mode

#### Scenario: Query matching nothing

- **WHEN** a merchant types a query that matches no option
- **THEN** the empty-results message is shown and no option rows are present

#### Scenario: Scroll position after a query narrows the list

- **WHEN** a merchant has scrolled down the list and then types a query that narrows it
- **THEN** the list shows the matches from the top rather than leaving a blank region below the previous scroll offset

### Requirement: An option may carry a leading icon

An option SHALL accept an optional leading icon. Where supplied, that icon MUST be rendered before the option's label in the dropdown row, before the selected option's label on the closed trigger, and before the label inside each chip when the control is in multi-select mode. An option with no leading icon MUST NOT disturb the label alignment of sibling options that have one.

#### Scenario: Icon shown in the list and on the trigger

- **WHEN** a caller supplies a leading icon for an option and a merchant selects that option
- **THEN** the icon appears beside the option's label in the dropdown row
- **AND** the icon appears beside the selected label on the closed trigger

#### Scenario: Icon shown on multi-select chips

- **WHEN** a multi-select searchable select has selections whose options carry leading icons
- **THEN** each chip shows its option's icon before the label

#### Scenario: Mixed list keeps labels aligned

- **WHEN** a list contains options both with and without leading icons
- **THEN** every option's label starts at the same horizontal position

#### Scenario: Options without icons are unchanged

- **WHEN** a caller supplies no leading icon for any option
- **THEN** rows, trigger, and chips render exactly as they do today, with no reserved icon space

### Requirement: Panel height follows the matched option count

The option panel SHALL grow with the number of matched options up to its maximum height and no further. A result set shorter than that maximum MUST NOT leave empty space below the last row, and the panel MUST NOT change height as the merchant scrolls within a fixed result set.

#### Scenario: Few matches

- **WHEN** a query narrows the list to two options
- **THEN** the panel is tall enough for those two rows and shows no empty region beneath them

#### Scenario: Many matches

- **WHEN** a query matches more options than fit within the maximum height
- **THEN** the panel is at its maximum height and the list scrolls
