## RENAMED Requirements

- FROM: `### Requirement: Variation Values uses a multi-select combobox`
- TO: `### Requirement: Variation Values uses the shared multi-select`

## MODIFIED Requirements

### Requirement: Variation Values uses the shared multi-select

The **Variation Values** field SHALL be implemented as `AttributeValuesField` on top of the shared `MultiSelect`, presenting the selected attribute's values as checkable options with removable chips, not a free-text tag input. It MUST NOT be built by modifying another primitive to reach this design. For `color`-type attributes, each option and chip SHALL display a colour swatch, supplied through `MultiSelect`'s render slots.

#### Scenario: Selecting a value

- **WHEN** a merchant opens the Variation Values dropdown and selects an unselected value
- **THEN** the value is added as a chip and its row shows a checked state

#### Scenario: Removing a value

- **WHEN** a merchant clicks a chip's remove control or unchecks a selected row
- **THEN** the value is removed from the field's selection

#### Scenario: Color attribute shows swatches

- **WHEN** the active attribute's type is `color`
- **THEN** each option row and chip renders a swatch using that value's colour

### Requirement: Creating a new variation value

Typing a value not present in the option list SHALL offer an inline "create" action. Per-type creation behaviour SHALL be resolved from the attribute value type registry rather than from conditionals inside the field: `list`-type attributes create the value directly, `color`-type attributes open a dialog to collect a colour before creating it. Newly created values SHALL be selected automatically and SHALL appear as a chip before the attribute list refetches.

#### Scenario: Creating a list value

- **WHEN** a merchant types a new value for a `list`-type attribute and confirms the create action
- **THEN** the value is created and added to the selection without further input

#### Scenario: Creating a color value

- **WHEN** a merchant types a new value for a `color`-type attribute and confirms the create action
- **THEN** a dialog opens to collect a colour
- **AND** confirming the dialog creates the value with that colour and adds it to the selection

#### Scenario: Duplicate value name

- **WHEN** creating a value fails validation because the name already exists
- **THEN** the option list stays open with the typed text intact
- **AND** the field shows the error

#### Scenario: Adding a new attribute type

- **WHEN** a new attribute type needs its own option presentation or creation flow
- **THEN** it is added as an entry in the attribute value type registry
- **AND** `AttributeValuesField` and `MultiSelect` are unchanged
