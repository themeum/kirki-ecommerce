## Purpose

Provides a reusable React Hook Form field that combines a numeric weight input and unit select in a single input group for consistent weight entry across forms.

## ADDED Requirements

### Requirement: Weight field combines input and unit select
The weight field form component SHALL render a labeled field containing an input group with a numeric weight input and a unit dropdown. The input group MUST own the outer border and focus ring; the unit select MUST appear as an inline-end addon without its own outer border.

#### Scenario: Combined input group presentation
- **WHEN** the weight field is rendered
- **THEN** weight value and unit appear as one unified control with a single outer border

#### Scenario: Supported unit options
- **WHEN** the unit dropdown is opened
- **THEN** only backend-supported weight units (g, kg, lb, oz) are available

### Requirement: Weight field integrates with React Hook Form
The weight field MUST register with React Hook Form via Controller for both the weight value field and the weight unit field. It MUST display validation errors for either field. It SHOULD accept an optional callback to notify parent forms when values change.

#### Scenario: RHF registration
- **WHEN** the weight field is used inside a Form provider with names "weight" and "weight_unit"
- **THEN** changes to input and unit update the corresponding form values

#### Scenario: Combined error display
- **WHEN** either weight or weight unit has a validation error
- **THEN** the input group shows error state and an error message is displayed

### Requirement: Default unit from store settings
When the form weight unit value is empty, the weight field MUST display the store product settings weight unit as the effective default without overwriting the form value until the merchant interacts.

#### Scenario: Empty form unit uses store default for display
- **WHEN** the form weight_unit value is empty and store settings specify kg
- **THEN** the unit dropdown shows kg

### Requirement: Weight field renders full layout
The weight field MUST render with a visible label and full input group layout. This capability does not define a compact or table variant.

#### Scenario: Full layout on Shipping card
- **WHEN** the weight field is used on the product Shipping card
- **THEN** it renders with label and full input group layout
