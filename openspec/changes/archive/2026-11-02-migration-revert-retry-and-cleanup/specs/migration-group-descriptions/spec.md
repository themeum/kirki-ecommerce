## ADDED Requirements

### Requirement: Each group has a short description

On the scan step, the system SHALL show a short description under the label of each group, in the secondary text color and the small text size. The description SHALL say what the group moves, in one sentence.

#### Scenario: Description is shown

- **WHEN** the scan step lists the group Products
- **THEN** a one-sentence description is shown under "Products (109)"

#### Scenario: A source adds its own group

- **WHEN** a source reports a group with a description
- **THEN** the scan step shows that description in the same way
