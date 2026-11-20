## ADDED Requirements

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
