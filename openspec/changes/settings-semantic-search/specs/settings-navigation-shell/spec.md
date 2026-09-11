## MODIFIED Requirements

### Requirement: Sidebar navigation items are single-line and searchable

Sidebar items SHALL display an icon and the item's label only; the longer
descriptive text associated with each item SHALL NOT be rendered in the sidebar.
The sidebar SHALL provide a search box. Searching SHALL NOT filter the grouped
navigation in place — while a query is active the sidebar SHALL hand its content
over to the settings search capability, which replaces the grouped sections with
a flat ranked list of matching settings and shows "No results found" when nothing
matches. The navigation item's descriptive text SHALL remain part of what a query
can match, so an item still reaches the merchant through wording that never
appears on screen. Clearing the query SHALL restore the grouped sections.

#### Scenario: Item rendering

- **WHEN** the sidebar renders the General item
- **THEN** it shows the General icon and the label "General"
- **AND** it does not show the descriptive text "Basic settings of your store"

#### Scenario: Search matches descriptive text

- **WHEN** the merchant types text that appears only in an item's descriptive text
  and not in its label
- **THEN** that item is returned among the search results

#### Scenario: Grouping is replaced, not filtered

- **WHEN** a search query is active
- **THEN** the sidebar shows the ranked result list without its section headings
- **AND** no section heading is shown with a reduced set of its own items beneath it

#### Scenario: No results at all

- **WHEN** a search query matches nothing
- **THEN** a "No results found" message is shown in place of the results list

#### Scenario: Clearing the query restores the sections

- **WHEN** the merchant clears the search box
- **THEN** all grouped sections and their headings are rendered again in their
  original order
