# product-variations-card Specification

## Purpose

Defines the Product Variations card's attribute editor: the Variation Values control, its gating against Variation Name, Apply's local-commit behavior, and the card's spacing so it matches the Kirki eCommerce design system.
## Requirements
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

### Requirement: Variation Values disabled until a name is selected

The Variation Values field SHALL be disabled whenever no Variation Name (attribute) is selected, since its option list is derived from that selection.

#### Scenario: Values disabled with no name

- **WHEN** the attribute editor is opened for a new attribute and no Variation Name has been chosen
- **THEN** the Variation Values field is disabled and not interactive

#### Scenario: Values enabled after selecting a name

- **WHEN** a merchant selects or creates a Variation Name
- **THEN** the Variation Values field becomes enabled and lists that attribute's values

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

### Requirement: Apply commits locally without saving the product

Clicking **Apply** in the attribute editor SHALL validate the attribute sub-form and, on success, commit the attribute to the product form, regenerate the variant grid according to the `product-variant-matrix` capability, and close the editor. It SHALL NOT submit or otherwise persist the product to the server.

Committing an attribute — whether added, edited, removed or reordered — SHALL go through a single write path, so that the attribute list, the variant grid and the product's has-variants state can never disagree. Each commit SHALL read the current form state at the moment it runs rather than a snapshot taken when the editor was opened.

#### Scenario: Apply with valid data

- **WHEN** a merchant fills in a Variation Name and at least one Variation Value and clicks Apply
- **THEN** the product form's attribute list and variant grid update together
- **AND** no product create/update request is sent
- **AND** the editor closes

#### Scenario: Apply with invalid data

- **WHEN** a merchant clicks Apply without a Variation Name or without any Variation Values
- **THEN** the attribute sub-form shows inline validation errors
- **AND** the editor remains open
- **AND** no form state outside the attribute sub-form changes

#### Scenario: Apply regenerates the variant grid

- **WHEN** a merchant applies a second attribute to a product that already has variants
- **THEN** the variant grid shows every combination of the two attributes
- **AND** the previously saved variants keep their SKU, stock and price

#### Scenario: Applying an edit after another attribute changed

- **WHEN** a merchant opens the editor for one attribute, and the attribute list changes before Apply is clicked
- **THEN** applying the edit preserves the other change rather than reverting it

### Requirement: Card and editor spacing

The Product Variations card SHALL use a 16px (`theme.spacing[4]`) gap between the attribute list, a full-width divider, and the variation table. The attribute list and its "+ Add" button SHALL have a 16px gap. The open attribute editor card SHALL use 16px content padding.

#### Scenario: Divider between attribute list and table

- **WHEN** the card renders with at least one attribute and the variation table
- **THEN** a full-bleed divider separates the attribute area from the variation table

#### Scenario: Editor card padding

- **WHEN** the attribute editor is open
- **THEN** its content is padded 16px on all sides

### Requirement: Removal is confirmed when saved variants would be discarded

Removing an attribute, or removing a value from an attribute, SHALL prompt for confirmation when the resulting grid would discard one or more variants that have already been saved to the product. The prompt SHALL state how many saved variants will be deleted and identify them by their combination. Cancelling SHALL leave the attribute list and variant grid untouched.

When no already-saved variant would be discarded — for example on a product that has never been saved — the removal SHALL proceed without a prompt.

Nothing SHALL be deleted from storage until the merchant saves the product.

#### Scenario: Removing an attribute from a saved product

- **WHEN** a merchant removes an attribute from a product whose variants have been saved, and the removal would collapse four variants into two
- **THEN** a confirmation prompt names the two saved variants that will be deleted
- **AND** cancelling leaves the attribute list and variant grid unchanged

#### Scenario: Confirming the removal

- **WHEN** a merchant confirms the prompt
- **THEN** the attribute is removed and the variant grid collapses
- **AND** no delete request is sent until the product is saved

#### Scenario: Removing an attribute from an unsaved product

- **WHEN** a merchant removes an attribute from a product that has never been saved
- **THEN** no confirmation is shown and the attribute is removed immediately

#### Scenario: Removing a value that only affects unsaved variants

- **WHEN** a merchant removes an attribute value whose variants have never been saved
- **THEN** no confirmation is shown

### Requirement: The variation table tolerates an emptied value group

The variation table SHALL continue to render while the merchant edits attributes, including when a value group momentarily contains no variants. Regenerating the grid SHALL NOT crash the card.

#### Scenario: Removing a value that empties a group

- **WHEN** a merchant removes an attribute value that the variation table is currently grouping by
- **THEN** the table re-renders without that group
- **AND** the card does not crash

