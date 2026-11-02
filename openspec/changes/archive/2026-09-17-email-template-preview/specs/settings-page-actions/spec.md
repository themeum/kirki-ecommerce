## MODIFIED Requirements

### Requirement: Save and Discard live in the shared settings header

Save and Discard for a settings page rendered inside the settings shell SHALL appear in the shared floating bar at the bottom of the
screen, and that bar SHALL be the only place they appear. A settings page rendered inside the shell SHALL NOT
render its own top-level header or its own Save/Discard buttons, and the settings shell SHALL NOT
render Save or Discard in a header of its own.

A settings page designated a full-page editor (see settings-navigation-shell) is exempt from this requirement: it SHALL own its Save and Discard actions directly in its own page header instead of publishing them to the shell's floating bar, and it SHALL implement its own equivalent of the unsaved-changes navigation guard and reload/tab-close warning described later in this spec, since it does not participate in the shell's shared mechanism for those.

#### Scenario: Only one header is rendered

- **WHEN** any settings page rendered inside the shell is displayed
- **THEN** exactly one settings page header is visible at the top of the content column
- **AND** it presents no Save or Discard action

#### Scenario: Save appears in the floating bar

- **WHEN** a settings page reports unsaved changes
- **THEN** Save and Discard are presented in the floating bar at the bottom of the screen
- **AND** they are presented nowhere else

#### Scenario: The bar is independent of the content width

- **WHEN** a settings page presents a content area wider or narrower than the standard settings width
- **THEN** the floating bar keeps its own position and width rather than resizing to follow the page

#### Scenario: A full-page editor owns its own actions

- **WHEN** the merchant has unsaved changes on the email template editor
- **THEN** Save and Discard are presented in the editor's own page header
- **AND** no floating bar is presented anywhere on the page

### Requirement: Each settings page identifies itself with a consistent header

Every settings page and drill-down page rendered inside the settings shell SHALL render a page header at the top of the content column, presenting an icon and the page title in a consistent design across all settings pages. Drill-down pages SHALL additionally present a back affordance returning to their parent settings page.

A settings page designated a full-page editor is exempt from this requirement: its heading is governed by the page-layout-shell capability instead of the settings content-column header, and it presents its own back affordance to its parent settings page directly in that heading.

#### Scenario: Top-level page header

- **WHEN** the General settings page is displayed
- **THEN** the content column begins with a page header showing the General icon and the title "General"
- **AND** the header presents no back affordance

#### Scenario: Drill-down page header

- **WHEN** a shipping zone page is displayed
- **THEN** the content column begins with a page header in the same design, showing that page's icon and title
- **AND** the header presents a back affordance returning to the Shipping settings page

#### Scenario: Full-page editor header

- **WHEN** the email template editor is displayed
- **THEN** its own full-page heading shows a back affordance to the Email settings page, an icon, and the title "Email Template"
- **AND** this heading is not the settings shell's content-column header
