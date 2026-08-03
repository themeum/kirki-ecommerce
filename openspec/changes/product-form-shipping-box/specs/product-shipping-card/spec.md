## Purpose

Defines the product edit Shipping card layout and interactions so weight, shipping box selection, preview, and shipping profile assignment match the designed merchant experience.

## ADDED Requirements

### Requirement: Weight field uses unified input group
The Shipping card weight control SHALL present a single bordered input group containing a numeric weight input and a unit dropdown. Supported weight units MUST be the backend-allowed values: g, kg, lb, and oz. When the product variant has no saved weight unit, the dropdown MUST default to the store product settings weight unit.

#### Scenario: Weight input group layout
- **WHEN** a merchant opens the product Shipping card
- **THEN** weight is shown as one combined input group with value input on the left and unit select on the right

#### Scenario: Default weight unit from store settings
- **WHEN** the variant has no weight unit saved
- **THEN** the unit dropdown displays the store product settings weight unit

### Requirement: Shipping box fieldset with integrated preview
The Shipping card SHALL include a fieldset-style Shipping Box section with a legend label, an eye toggle, a select listing predefined shipping boxes, and an integrated 3D preview area below the select within the same bordered section. The preview MUST reflect the dimensions of the currently selected shipping box.

#### Scenario: Shipping box section structure
- **WHEN** a merchant views the Shipping Box section
- **THEN** a select lists available shipping boxes formatted as name and dimensions
- **AND** a 3D box preview appears below the select inside the same bordered card

#### Scenario: Preview updates on box selection
- **WHEN** the merchant selects a different shipping box
- **THEN** the preview updates to reflect that box's length, width, height, and unit

### Requirement: Eye toggle controls preview visibility
The Shipping Box section SHALL provide an eye button that toggles visibility of the 3D preview area. The select control MUST remain visible regardless of preview visibility. Preview MUST be visible by default.

#### Scenario: Preview hidden via eye toggle
- **WHEN** the merchant clicks the eye toggle to hide the preview
- **THEN** the 3D preview area is hidden
- **AND** the shipping box select remains visible

#### Scenario: Preview shown by default
- **WHEN** the merchant first opens the Shipping card
- **THEN** the shipping box preview is visible

### Requirement: Add new shipping box from select dropdown
The shipping box select dropdown SHALL list predefined boxes and MUST include a footer action labeled "Add new shipping box". Selecting that action MUST open a create-shipping-box dialog. On successful creation, the new box MUST be selected in the product form.

#### Scenario: Create box from product shipping card
- **WHEN** the merchant clicks "Add new shipping box" in the dropdown footer
- **THEN** the shipping box select dropdown closes
- **AND** a create shipping box dialog opens unobstructed
- **AND** after saving a new box the product form selects that box

#### Scenario: No manage link in dropdown
- **WHEN** the merchant opens the shipping box select dropdown
- **THEN** no "Manage" link to shipping settings is shown

### Requirement: Create shipping box dialog layout
The create shipping box dialog SHALL include a title field, a dimensions fieldset with length, width, height, and unit inputs, and a live 3D preview that updates as dimensions change. The dialog MUST provide Cancel and Add actions. The dimensions row MUST use flexbox layout with equal flex share for length, width, and height fields and an auto-sized unit select; field widths MUST NOT use fixed pixel values that cause overflow outside the dimensions card. The dialog container MAY use a fixed max-width.

#### Scenario: Dialog fields and preview
- **WHEN** the create shipping box dialog is open
- **THEN** the merchant can enter a title and length, width, height, and unit
- **AND** all dimension fields and the unit select remain inside the dimensions card boundary
- **AND** a live preview reflects the entered dimensions

#### Scenario: Dimensions row flex layout
- **WHEN** the create shipping box dialog is open
- **THEN** length, width, and height fields share available horizontal space equally via flex
- **AND** the unit select sizes to its content without overflowing the card

#### Scenario: Live preview on dimension change
- **WHEN** the merchant changes length, width, or height in the dialog
- **THEN** the preview box resizes proportionally

### Requirement: Shipping profile row unchanged
The Shipping card SHALL retain the existing assign-shipping-profile checkbox and conditional shipping profile select behavior at the bottom of the card.

#### Scenario: Shipping profile toggle
- **WHEN** the merchant checks assign shipping profile
- **THEN** the shipping profile select becomes visible
- **WHEN** unchecked
- **THEN** the shipping profile select is hidden

### Requirement: Product form sync preserved
Changes to weight, weight unit, and shipping box on the Shipping card MUST continue to sync to the product form context and variant save payload using the existing product edit sync pattern.

#### Scenario: Weight change syncs to variant
- **WHEN** the merchant changes weight or weight unit
- **THEN** the product form context variant is updated

#### Scenario: Shipping box change syncs to variant
- **WHEN** the merchant selects a shipping box
- **THEN** the product form context variant shipping_box_id is updated
