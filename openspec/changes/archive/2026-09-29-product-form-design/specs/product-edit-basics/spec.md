## Purpose

Defines the product edit basics card layout, field set, and spacing so merchants can enter core product content in an order and rhythm that matches the Kirki eCommerce design system.

## ADDED Requirements

### Requirement: Basics card field order

The product edit basics card SHALL present fields in this top-to-bottom order: Title and Ribbon (two-column row), Slug, Images and videos, Short description, Description (rich text), separator, Additional Info.

#### Scenario: Field order on edit screen

- **WHEN** a merchant opens the product create or edit page
- **THEN** the basics card displays fields in the prescribed order with Title and Ribbon on the same row

### Requirement: Short description field

The basics card SHALL include a **Short description** field implemented as a multi-line textarea with 3 visible rows. The field SHALL be optional (not required to save). The label SHALL read "Short description".

#### Scenario: Short description accepts plain text

- **WHEN** a merchant types into the Short description textarea
- **THEN** the value is stored in product form state as plain text (not rich HTML)

#### Scenario: Short description is optional

- **WHEN** a merchant saves a product with an empty Short description
- **THEN** save proceeds without a validation error for that field

#### Scenario: Short description placement

- **WHEN** the basics card is rendered
- **THEN** Short description appears immediately after Images and videos and immediately before Description

### Requirement: Description remains rich text

The **Description** field SHALL continue to use the existing rich text editor. Its visual design and toolbar behavior SHALL not change as part of this capability.

#### Scenario: Rich text description unchanged

- **WHEN** a merchant interacts with the Description field
- **THEN** the rich text editor toolbar and editing behavior match the pre-change implementation

### Requirement: Consistent section spacing

Major sections within the basics card SHALL be separated by a uniform vertical gap of 16px (`theme.spacing[4]`). Sections include: Title/Ribbon row, Slug, Images and videos, Short description, Description, separator block, and Additional Info header/content.

#### Scenario: Even gaps between form sections

- **WHEN** the basics card is rendered
- **THEN** adjacent major sections have equal vertical spacing of 16px

#### Scenario: Additional Info internal spacing

- **WHEN** Additional Info displays its header, info item list, and "Add an Info Section" button
- **THEN** those sub-sections use the same 16px vertical gap rhythm as the rest of the card

### Requirement: Separator before Additional Info

A horizontal separator SHALL remain between Description and Additional Info. Separator margins SHALL be adjusted so spacing above and below the separator is consistent with the 16px section gap (no extra margin that breaks the rhythm).

#### Scenario: Separator visible between sections

- **WHEN** the basics card is rendered with Additional Info below Description
- **THEN** a horizontal separator line appears between Description and Additional Info

### Requirement: Short description in save payload

Create and update product requests from the admin UI SHALL include `short_description` in the request body when the merchant saves. The value SHALL reflect the current form state (string or null/empty).

#### Scenario: Save sends short_description

- **WHEN** a merchant saves a product with Short description "Compact summary text"
- **THEN** the create or update API request body includes `short_description` with that value

#### Scenario: Empty short description on save

- **WHEN** a merchant saves a product with an empty Short description
- **THEN** the request body includes `short_description` as an empty string or null consistent with other optional text fields

### Requirement: Unchanged sub-section designs

Images and videos gallery appearance, Description rich text editor appearance, and the "Add an Info Section" button background color SHALL NOT change as part of this capability.

#### Scenario: Images section unchanged

- **WHEN** the basics card is rendered
- **THEN** the Images and videos section matches its pre-change visual design

#### Scenario: Add Info button color unchanged

- **WHEN** Additional Info shows the add button
- **THEN** the button uses the existing design-system secondary variant colors
