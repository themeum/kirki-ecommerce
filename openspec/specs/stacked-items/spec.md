# stacked-items Specification

## Purpose
Defines the composable row-stack UI primitive: how a caller builds a bordered, rounded list of
rows by nesting components instead of configuring a shared component through props, how a row
establishes its identity, and how the group's visual edges and a row's focus outline behave.
## Requirements
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

### Requirement: A ghost row's highlight fills the full row to the card edges

In the `ghost` variant, each row SHALL extend past its content to the inner edges of the
surrounding card, and the row content SHALL stay aligned with the other card content. The hover
highlight SHALL fill the full row: its full width and its full height. The keyboard focus outline
of a row SHALL have the same position and size as its hover highlight. Outside a card, the row
SHALL extend past its content by a smaller default amount. Showing or hiding the highlight SHALL
NOT change the position or size of any content.

#### Scenario: Pointer hovers a ghost row in a card

- **WHEN** the pointer moves over a row in a `ghost` stack inside a card
- **THEN** the hover highlight goes from the left inner edge of the card to the right inner edge
- **AND** the hover highlight fills the full height of the row
- **AND** the row content stays at the same position as before the hover, aligned with the card
  header

#### Scenario: Hover and focus have the same shape

- **WHEN** a ghost row shows its hover highlight, and later the same row shows its keyboard focus
  outline
- **THEN** the two shapes have the same left, right, top, and bottom edges

#### Scenario: Ghost stack outside a card

- **WHEN** a `ghost` stack is rendered without a surrounding card
- **THEN** the row extends past its content by the default amount
- **AND** the highlight is not clipped by the stack container

#### Scenario: Other variants are not affected

- **WHEN** a stack uses the `outline` or `card` variant
- **THEN** the row hover highlight, the focus outline, and the dividers are the same as before this
  change

### Requirement: The dividers of a highlighted ghost row grow to the row edges

In the `ghost` variant, a divider between two rows SHALL be as wide as the row content while
neither row next to it is highlighted. When a row is hovered or has keyboard focus, the divider
above it and the divider below it SHALL grow to the full row width with an animated transition,
and SHALL go back to content width with a transition when the highlight stops. The dividers SHALL
NOT change the height of any row.

#### Scenario: Hover a middle row

- **WHEN** the pointer moves over a row that has a row above it and a row below it
- **THEN** the divider above it and the divider below it grow to the card edges with a transition
- **AND** all other dividers stay at content width

#### Scenario: Hover stops

- **WHEN** the pointer leaves a hovered row
- **THEN** its dividers go back to content width with a transition

#### Scenario: Hover the first or last row

- **WHEN** the pointer moves over the first row or the last row
- **THEN** only the divider that is between that row and its neighbour grows
- **AND** no divider shows above the first row or below the last row
