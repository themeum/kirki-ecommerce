# rule-items Specification

## Purpose
Defines the composable rule-row UI primitive: how a caller builds a numbered
list of "IF ... Then ..." rule cards by nesting components instead of
configuring a shared component through a rules-array-plus-formatter prop,
reusing the existing stacked-list container, dividers, and hover-reveal
behavior rather than a new copy of that presentation.
## Requirements
### Requirement: A rule row's content is composed, not configured

The rule-list primitive SHALL NOT expose a rules-array-plus-formatter API,
and SHALL NOT format condition or action label text itself. A caller SHALL
build each rule row's badge, condition line(s), action line, and actions by
nesting components as children, supplying already-formatted text.

#### Scenario: Two callers format the same condition differently

- **WHEN** one caller renders a condition using a lookup-table label (e.g.
  resolving a condition type to a display title) and another caller renders
  the same condition using the raw stored value
- **THEN** both render correctly through the same primitive
- **AND** no shared formatting logic inside the primitive needs to change to
  support either caller

### Requirement: A rule list reuses the stacked-list container and row behavior

The rule-list primitive SHALL present its rows inside the existing
stacked-list container primitive, inheriting its bordered group presentation,
row dividers, first/last-row corner radius, and hover/focus-reveal action
behavior, rather than re-implementing that presentation.

#### Scenario: Rule list container presentation

- **WHEN** a rule list renders two or more rule rows
- **THEN** the rows render inside one bordered container with a divider
  between adjacent rows and rounded outer corners on the first and last row,
  matching the stacked-list container's existing behavior

#### Scenario: Row actions stay hidden until interaction

- **WHEN** a rule row is not hovered and none of its content has keyboard
  focus
- **THEN** that row's action buttons (edit/delete) are not visible
- **AND** hovering the row, or focusing a control inside it, reveals its
  action buttons without shifting the row's layout

### Requirement: A rule row displays a numbered badge

Each rule row SHALL display a badge showing the caller-supplied label for
that rule's position (for example, "Rule 1").

#### Scenario: Rules render in order

- **WHEN** a caller renders a list of rule rows, each passing its own
  position label to the badge
- **THEN** each row's badge displays the label passed to it

### Requirement: A rule row displays one or more condition lines and one action line

A rule row SHALL support rendering one or more condition lines (for a rule
with multiple conditions) followed by a single action line, each as a
distinct, separately styled line within the row.

#### Scenario: A rule with multiple conditions

- **WHEN** a caller renders a rule row with more than one condition line
- **THEN** each condition line renders on its own line above the action line
- **AND** the action line renders as the row's final line

