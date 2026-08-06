## Purpose

Defines the composable row-stack UI primitive: how a caller builds a bordered, rounded list of
rows by nesting components instead of configuring a shared component through props, how a row
establishes its identity, and how the group's visual edges and a row's focus outline behave.

## ADDED Requirements

### Requirement: A row's presentation is composed, not configured

The row-stack primitive SHALL NOT expose a data-array-plus-handler-map API. A caller SHALL build
each row's content and actions by nesting components as children.

#### Scenario: Adding a new element to a row

- **WHEN** a caller wants a row to show additional content or a new action
- **THEN** the caller composes that content as a child element in that row
- **AND** no shared component's prop list needs to change to support it

### Requirement: A row establishes identity independent of its position

Each row in the stack SHALL be identified by a caller-supplied identifier, not by its position
among sibling rows.

#### Scenario: A row is removed from the list

- **WHEN** a row is removed from the stack (for example, after a delete)
- **THEN** the identity and open/closed menu state of every remaining row stays associated with
  that row's own identifier
- **AND** no remaining row's state shifts to reflect its new position in the list

### Requirement: The first and last rows have their own corner radius

The first and last rows in the stack SHALL each render with an explicit corner radius matching
the group's outer shape, independent of any clipping applied by the group container.

#### Scenario: First and last row corners

- **WHEN** the stack renders two or more rows
- **THEN** the first row's top corners and the last row's bottom corners are rounded to match the
  group's outer radius

#### Scenario: Keyboard focus on an edge row

- **WHEN** a control inside the first or last row receives keyboard focus
- **THEN** that row's focus outline renders in full, uncut by the group container's edges

### Requirement: A row's action menu can be opened from a nested control

The row-stack primitive SHALL provide a way for a control nested arbitrarily deep inside a row to
read and change that row's own open/closed menu state, without that control needing to know the
row's position or receive the row's identifier as a separate argument.

#### Scenario: A nested menu trigger toggles its own row

- **WHEN** a control inside a row's composed content requests that row's menu be opened
- **THEN** that row's open state changes
- **AND** no other row's open state is affected
