## Purpose

Defines the Product Variations card's attribute editor: the Variation Values control, its gating against Variation Name, Apply's local-commit behavior, and the card's spacing so it matches the Kirki eCommerce design system.

## ADDED Requirements

### Requirement: Variation Values uses a multi-select combobox

The **Variation Values** field SHALL be implemented as a multi-select combobox (`AttributeValuesField`) presenting the selected attribute's values as checkable options with removable chips, not a free-text tag input. For `color`-type attributes, each option and chip SHALL display a color swatch.

#### Scenario: Selecting a value

- **WHEN** a merchant opens the Variation Values dropdown and selects an unselected value
- **THEN** the value is added as a chip and its row shows a checked state

#### Scenario: Removing a value

- **WHEN** a merchant clicks a chip's remove control or unchecks a selected row
- **THEN** the value is removed from the field's selection

#### Scenario: Color attribute shows swatches

- **WHEN** the active attribute's type is `color`
- **THEN** each option row and chip renders a swatch using that value's color

### Requirement: Variation Values disabled until a name is selected

The Variation Values field SHALL be disabled whenever no Variation Name (attribute) is selected, since its option list is derived from that selection.

#### Scenario: Values disabled with no name

- **WHEN** the attribute editor is opened for a new attribute and no Variation Name has been chosen
- **THEN** the Variation Values field is disabled and not interactive

#### Scenario: Values enabled after selecting a name

- **WHEN** a merchant selects or creates a Variation Name
- **THEN** the Variation Values field becomes enabled and lists that attribute's values

### Requirement: Creating a new variation value

Typing a value not present in the option list SHALL offer an inline "create" action. For `list`-type attributes it SHALL create the value directly. For `color`-type attributes it SHALL open a dialog to collect a color before creating the value. Newly created values SHALL be selected automatically.

#### Scenario: Creating a list value

- **WHEN** a merchant types a new value for a `list`-type attribute and confirms the create action
- **THEN** the value is created and added to the selection without further input

#### Scenario: Creating a color value

- **WHEN** a merchant types a new value for a `color`-type attribute and confirms the create action
- **THEN** a dialog opens to collect a color
- **AND** confirming the dialog creates the value with that color and adds it to the selection

### Requirement: Apply commits locally without saving the product

Clicking **Apply** in the attribute editor SHALL validate the attribute sub-form and, on success, write the attribute into the product form's `attributes`, `variants`, and `has_variants` fields via `setValue`, then close the editor. It SHALL NOT submit or otherwise persist the product to the server.

#### Scenario: Apply with valid data

- **WHEN** a merchant fills in a Variation Name and at least one Variation Value and clicks Apply
- **THEN** the product form's `attributes` and `variants` state updates
- **AND** no product create/update request is sent
- **AND** the editor closes

#### Scenario: Apply with invalid data

- **WHEN** a merchant clicks Apply without a Variation Name or without any Variation Values
- **THEN** the attribute sub-form shows inline validation errors
- **AND** the editor remains open
- **AND** no form state outside the attribute sub-form changes

### Requirement: Card and editor spacing

The Product Variations card SHALL use a 16px (`theme.spacing[4]`) gap between the attribute list, a full-width divider, and the variation table. The attribute list and its "+ Add" button SHALL have a 16px gap. The open attribute editor card SHALL use 16px content padding.

#### Scenario: Divider between attribute list and table

- **WHEN** the card renders with at least one attribute and the variation table
- **THEN** a full-bleed divider separates the attribute area from the variation table

#### Scenario: Editor card padding

- **WHEN** the attribute editor is open
- **THEN** its content is padded 16px on all sides
