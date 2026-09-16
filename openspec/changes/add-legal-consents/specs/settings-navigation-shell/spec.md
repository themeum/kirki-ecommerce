## MODIFIED Requirements

### Requirement: Every settings section is reachable from the sidebar

Each settings page that exists SHALL have a corresponding sidebar entry, and no sidebar entry SHALL be permanently non-navigable. Each sidebar entry SHALL navigate to its own page — an entry SHALL NOT resolve to a page belonging to a different sidebar entry. Sections whose full functionality is not yet built SHALL still be navigable and render a placeholder page.

#### Scenario: Checkout is listed

- **WHEN** the sidebar renders
- **THEN** a Checkout entry is present and navigates to the checkout settings page

#### Scenario: Advanced and License are navigable placeholders

- **WHEN** the merchant selects the Advanced or License sidebar item
- **THEN** the item navigates rather than being inert
- **AND** the right-hand content area renders a placeholder page for that section

#### Scenario: Legal opens the Legal page

- **WHEN** the merchant selects the Legal sidebar item
- **THEN** the Legal settings page is shown
- **AND** the Legal item is marked active
- **AND** no other settings page's content is shown in its place

#### Scenario: No two entries resolve to the same page

- **WHEN** the sidebar renders
- **THEN** each entry resolves to a distinct settings page
