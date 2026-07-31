## Purpose

Provides a compound UI primitive for visually grouping related buttons and adjacent controls (inputs, labels, separators) with merged borders and consistent styling, matching the shadcn v4 Button Group API adapted to the project's Emotion-based design system.

## ADDED Requirements

### Requirement: ButtonGroup container exposes group semantics

The system SHALL provide a `ButtonGroup` container component that renders with `role="group"`, `data-slot="button-group"`, and an `orientation` prop accepting `horizontal` (default) or `vertical`.

#### Scenario: Horizontal group by default

- **WHEN** a caller renders `<ButtonGroup>` without an orientation prop
- **THEN** the container lays out direct children in a horizontal row with merged adjacent styling

#### Scenario: Vertical orientation

- **WHEN** a caller renders `<ButtonGroup orientation="vertical">`
- **THEN** the container lays out direct children in a vertical column with merged adjacent styling on top/bottom edges

#### Scenario: Accessibility group role

- **WHEN** assistive technology inspects a ButtonGroup
- **THEN** the root element has `role="group"` so callers can label it via `aria-label` or `aria-labelledby`

### Requirement: Adjacent children merge borders and radii

When direct children are buttons, inputs, text slots, or select triggers inside a ButtonGroup, the group SHALL remove inner border-radius and inner shared borders so adjacent controls appear visually connected.

#### Scenario: Horizontal middle button loses inner corners

- **WHEN** three outline buttons are direct children of a horizontal ButtonGroup
- **THEN** the first button retains left rounding, the last retains right rounding, and middle buttons have no left/right outer rounding and no inner vertical border between siblings

#### Scenario: Vertical stack merges top/bottom edges

- **WHEN** three buttons are direct children of a vertical ButtonGroup
- **THEN** the first retains top rounding, the last retains bottom rounding, and middle buttons have no top/bottom outer rounding and no inner horizontal border between siblings

#### Scenario: Input child grows within group

- **WHEN** a direct `input` element is a child of a horizontal ButtonGroup alongside buttons
- **THEN** the input receives flex growth so it fills remaining horizontal space

### Requirement: Nested ButtonGroups are spaced

When a ButtonGroup contains another ButtonGroup as a direct child, the parent SHALL apply spacing between nested groups equivalent to the project's standard small gap token.

#### Scenario: Two nested groups side by side

- **WHEN** a ButtonGroup contains two direct child ButtonGroups
- **THEN** visible gap separates the nested groups while each nested group's internal children remain merged

### Requirement: Focused children stack above siblings

Direct children of a ButtonGroup that receive keyboard focus SHALL render their focus ring above adjacent siblings without being clipped.

#### Scenario: Middle button focus visibility

- **WHEN** keyboard focus moves to a middle button in a horizontal ButtonGroup
- **THEN** the focused button's focus-visible ring is fully visible and not obscured by adjacent buttons

### Requirement: ButtonGroupText provides a label slot

The system SHALL provide `ButtonGroupText` for prefix/suffix label content inside a group, supporting optional `asChild` composition via Radix Slot.

#### Scenario: Static prefix text

- **WHEN** a caller renders `<ButtonGroupText>Prefix</ButtonGroupText>` as the first child of a ButtonGroup
- **THEN** muted label styling appears with borders aligned to merge with adjacent group children

#### Scenario: asChild composition

- **WHEN** a caller passes `asChild` to ButtonGroupText with a custom element child
- **THEN** the custom element receives ButtonGroupText styling and data attributes via Slot merging

### Requirement: ButtonGroupSeparator divides group segments

The system SHALL provide `ButtonGroupSeparator` that renders a visual divider between group segments, defaulting to vertical orientation within horizontal groups.

#### Scenario: Split button pattern

- **WHEN** a caller places `<ButtonGroupSeparator />` between two buttons in a horizontal ButtonGroup
- **THEN** a thin vertical divider appears between the buttons without breaking merged outer border of the group

#### Scenario: Separator orientation prop

- **WHEN** a caller sets `orientation="horizontal"` on ButtonGroupSeparator inside a vertical ButtonGroup
- **THEN** a horizontal divider spans the group width between segments

### Requirement: Child components expose data-slot for group targeting

The Button and SelectTrigger components SHALL expose stable `data-slot` attributes so ButtonGroup styles can target them reliably when nested or composed.

#### Scenario: Button data-slot

- **WHEN** any Button renders (native button or asChild Slot path)
- **THEN** the rendered element includes `data-slot="button"`

#### Scenario: SelectTrigger data-slot

- **WHEN** a SelectTrigger renders
- **THEN** the trigger element includes `data-slot="select-trigger"`

### Requirement: ButtonGroup accepts cssOverride

ButtonGroup, ButtonGroupText, and ButtonGroupSeparator SHALL each accept an optional `cssOverride` prop (CSSObject) that merges with internal styles per project Emotion conventions.

#### Scenario: Custom width on group

- **WHEN** a caller passes `cssOverride={{ width: '100%' }}` to ButtonGroup
- **THEN** the override width applies to the group container root element
