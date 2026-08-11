## Purpose

Provides optional label-adjacent info tooltips for form fields so editors can explain a control without crowding the layout with always-visible helper text.

## ADDED Requirements

### Requirement: Field labels support optional info text
The system SHALL allow a field label to accept optional `infoText`. When `infoText` is provided, the system MUST show a fixed info icon beside the label and MUST show the `infoText` content in a tooltip on hover (and keyboard focus where the tooltip supports it). When `infoText` is omitted, the system MUST NOT show the info icon.

#### Scenario: Info icon and tooltip when infoText is set
- **WHEN** a field label is rendered with non-empty `infoText`
- **THEN** a fixed info icon appears beside the label
- **AND** hovering the icon reveals a tooltip containing that `infoText`

#### Scenario: No info icon when infoText is omitted
- **WHEN** a field label is rendered without `infoText`
- **THEN** no info icon is shown beside the label

### Requirement: Form field wrappers expose infoText
Form field wrappers that render a primary field label SHALL accept an optional `infoText` prop and MUST pass it through to the label. The existing below-field `description` behavior MUST remain unchanged and MUST NOT be replaced by `infoText`.

#### Scenario: Wrapper passes infoText to label
- **WHEN** a form field wrapper (for example textarea or checkbox field) is given `infoText`
- **THEN** the primary label shows the info icon and tooltip for that text

#### Scenario: Description remains below the control
- **WHEN** a form field wrapper is given both `description` and `infoText`
- **THEN** `infoText` appears as the label info tooltip
- **AND** `description` still appears as helper text below the control
