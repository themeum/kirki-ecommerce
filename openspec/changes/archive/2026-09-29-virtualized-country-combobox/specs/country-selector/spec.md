## Purpose

Defines how the admin's country picker presents the full list of countries: responsive to open and search at full list length, and identifying each country by its flag alongside its name.

## ADDED Requirements

### Requirement: The country picker stays responsive across the full country list

The country picker SHALL render only the country rows in view plus a small overscan, so that opening it, scrolling it, and typing in its search box stay responsive with the complete country list loaded. It MUST NOT reduce the set of selectable countries to achieve this — every country returned by the countries source SHALL remain reachable by scrolling or by search.

#### Scenario: Opening the picker

- **WHEN** a merchant opens the country picker with the full country list loaded
- **THEN** the picker opens without perceptible delay
- **AND** only the country rows in view plus a small overscan are rendered

#### Scenario: Every country remains reachable

- **WHEN** a merchant scrolls to the end of the country list or searches for a country near the end of it
- **THEN** that country is present and selectable

#### Scenario: Searching

- **WHEN** a merchant types into the country picker's search box
- **THEN** the matching countries and their order are the same as before this change

### Requirement: Countries are identified by their flag

Each country SHALL be shown with its flag before its name in the dropdown row, before the selected country's name on the closed trigger, and before the name inside each chip when the picker is in multi-select mode. The flag SHALL be rendered at a 16px font size. A country for which no flag is available MUST still align its name with the names of countries that have one.

#### Scenario: Flag in the list

- **WHEN** a merchant opens the country picker
- **THEN** each country row shows that country's flag before its name, at a 16px font size

#### Scenario: Flag on the closed trigger

- **WHEN** a merchant selects a country and the picker closes
- **THEN** the trigger shows the selected country's flag before its name

#### Scenario: Flag on multi-select chips

- **WHEN** the country picker is in multi-select mode and countries are selected
- **THEN** each chip shows that country's flag before its name

#### Scenario: Country with no flag available

- **WHEN** the countries source returns a country with no flag
- **THEN** that country's name is still aligned with the names of the countries around it

### Requirement: The state picker is unaffected

The state and province picker SHALL keep its current behavior and presentation. It MUST NOT gain flags, and its option list rendering MUST be unchanged by this capability.

#### Scenario: State picker after the country picker changes

- **WHEN** a merchant opens the state and province picker
- **THEN** it behaves and renders exactly as it did before this change
