## MODIFIED Requirements

### Requirement: Drill-down settings pages render inside the shell

All settings drill-down pages — shipping zone, shipping delivery method, tax region, and variation library detail pages — SHALL render inside the settings shell rather than as standalone full-page views, and SHALL offer a way back to their parent settings page.

A settings page MAY instead be designated a full-page editor. A full-page editor SHALL render as a standalone page with no settings sidebar and no settings shell chrome, while its URL remains nested under `/settings`, and it SHALL provide its own way back to its parent settings page in its own page header. The email template editor is a full-page editor.

#### Scenario: Opening a tax region

- **WHEN** the merchant opens a tax region from the Tax settings page
- **THEN** the region page renders in the right-hand content area with the sidebar still visible
- **AND** a back affordance in the page header returns to the Tax settings page

#### Scenario: Opening the email template editor

- **WHEN** the merchant opens the email template editor from the Email settings page
- **THEN** the editor renders as a standalone full page with no settings sidebar
- **AND** its own header provides a way back to the Email settings page
