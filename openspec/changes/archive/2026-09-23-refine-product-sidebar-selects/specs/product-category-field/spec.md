## MODIFIED Requirements

### Requirement: The list renders the tree, and search flattens it

While the input is empty, option rows SHALL be ordered depth-first and indented in proportion to their depth, so the parent/child structure is legible. The indent MUST move the whole row, its checkbox included, so the column of checkboxes steps inward with the names and traces the tree. An indent applied to the name alone leaves every checkbox in one column, which reads as a flat list wearing a ragged left margin.

While a query is present, rows MUST instead render unindented, each prefixed with its full ancestor path, so a nested match reads in context without its ancestors having to be on screen.

Search MUST preserve ancestors of a match: an ancestor whose own name does not match MUST still be reachable in the results if one of its descendants matches.

#### Scenario: Browsing the tree

- **WHEN** a merchant opens the field without typing
- **THEN** root categories are listed with their children indented beneath them in depth-first order

#### Scenario: A child's checkbox sits inboard of its parent's

- **WHEN** a merchant looks at a child row beneath its parent
- **THEN** the child's checkbox is indented from the parent's by the same step as its name

#### Scenario: Searching

- **WHEN** a merchant types a query
- **THEN** matching rows render unindented, each showing its full ancestor path ahead of its own name
- **AND** every checkbox returns to one column

#### Scenario: A nested match

- **WHEN** a query matches only a deeply nested category
- **THEN** that category appears in the results with its ancestors readable in its path
