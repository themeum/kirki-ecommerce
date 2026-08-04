## Purpose

Defines the settings section's two-column shell: a left navigation sidebar shown alongside the selected settings page, along with how a settings URL resolves, which page is highlighted, and how the sidebar is searched.

## ADDED Requirements

### Requirement: Settings renders as a persistent two-column shell

Every route under `/settings` SHALL render inside a shared settings shell consisting of a navigation sidebar on the left and the selected settings page on the right. The sidebar SHALL be present on every settings route, including drill-down pages, and SHALL remain mounted — not destroyed and rebuilt — as the merchant moves between settings pages. Only the right-hand content area SHALL animate on navigation; the sidebar and header SHALL NOT shift, flicker, or replay any entrance animation.

#### Scenario: Navigating between settings pages keeps the sidebar mounted

- **WHEN** the merchant is on a settings page and selects a different item in the settings sidebar
- **THEN** the right-hand content area shows the newly selected settings page and plays an enter transition
- **AND** the sidebar element itself is not remounted — its DOM identity and any in-progress state (e.g. a typed search query) survive the navigation
- **AND** the sidebar and header do not visibly shift or flicker during the transition

#### Scenario: Sidebar search survives navigation

- **WHEN** the merchant has typed a query in the sidebar search box and then selects a settings page
- **THEN** the search box keeps the typed query and the filtered results stay applied

### Requirement: Bare settings URL resolves to a default page

Navigating to `/settings` SHALL NOT render a page of its own. It SHALL redirect to `/settings/general`, replacing the history entry so that the back button does not return to the bare URL.

#### Scenario: Opening the settings section

- **WHEN** the merchant navigates to `/settings`
- **THEN** the browser URL becomes `/settings/general`
- **AND** the General settings page is shown in the right-hand content area

#### Scenario: Back button after the redirect

- **WHEN** the merchant arrives at `/settings/general` via the `/settings` redirect and presses the browser back button
- **THEN** they return to the page they were on before entering settings, not to `/settings`

### Requirement: The current settings page survives a reload

Because the selected settings page is encoded in the URL, reloading SHALL restore the same settings page with the sidebar reflecting that selection.

#### Scenario: Reloading a settings sub-page

- **WHEN** the merchant is on `/settings/tax` and reloads the browser
- **THEN** the Tax settings page is shown again
- **AND** the Tax item is highlighted as active in the sidebar

### Requirement: Sidebar highlights the active page, including drill-downs

Exactly one sidebar item SHALL be marked active at a time. An item SHALL be active when the current URL matches its link exactly or is nested beneath it, so that drill-down pages keep their parent section highlighted.

#### Scenario: Top-level page active

- **WHEN** the current URL is `/settings/shipping`
- **THEN** the Shipping sidebar item is marked active
- **AND** no other sidebar item is marked active

#### Scenario: Drill-down page keeps the parent active

- **WHEN** the merchant opens a shipping zone at `/settings/shipping/zone/3`
- **THEN** the Shipping sidebar item is still marked active
- **AND** the sidebar remains visible alongside the zone page

### Requirement: Drill-down settings pages render inside the shell

All settings drill-down pages — shipping zone, shipping delivery method, tax region, email template editor, and variation library detail pages — SHALL render inside the settings shell rather than as standalone full-page views, and SHALL offer a way back to their parent settings page.

#### Scenario: Opening a tax region

- **WHEN** the merchant opens a tax region from the Tax settings page
- **THEN** the region page renders in the right-hand content area with the sidebar still visible
- **AND** a back affordance in the page header returns to the Tax settings page

### Requirement: Sidebar navigation items are single-line and searchable

Sidebar items SHALL display an icon and the item's label only; the longer descriptive text associated with each item SHALL NOT be rendered in the sidebar. The sidebar SHALL provide a search box that filters items by both their label and their descriptive text, and SHALL hide any section left with no matching items.

#### Scenario: Item rendering

- **WHEN** the sidebar renders the General item
- **THEN** it shows the General icon and the label "General"
- **AND** it does not show the descriptive text "Basic settings of your store"

#### Scenario: Search matches descriptive text

- **WHEN** the merchant types text that appears only in an item's descriptive text and not in its label
- **THEN** that item remains visible in the sidebar

#### Scenario: Empty sections are hidden

- **WHEN** a search query matches no items in a section
- **THEN** that section and its heading are not rendered

#### Scenario: No results at all

- **WHEN** a search query matches no items in any section
- **THEN** a "No settings found" message is shown in place of the sections

### Requirement: A settings page controls its own content width

The shell SHALL fix the sidebar's width but SHALL NOT constrain the width of the content area beyond enforcing a floor at the standard settings content width. Each settings page SHALL determine how wide its own content is, so that a page needing more room than the standard settings width can present it without the shell clamping it. The content area SHALL NOT narrow below the standard width regardless of how little content it currently holds.

#### Scenario: Standard settings page

- **WHEN** a settings page requests the standard settings content width
- **THEN** the sidebar and content together occupy the standard settings layout width
- **AND** the content is aligned beside the sidebar with the standard gap

#### Scenario: Page requesting a wider content area

- **WHEN** a settings page requests a content width wider than the standard settings width
- **THEN** its content area renders at that wider width rather than being clamped
- **AND** the sidebar keeps its fixed width and position

#### Scenario: Content area does not narrow while a page is loading

- **WHEN** a settings page has not yet finished loading its data and is showing a loading placeholder narrower than the standard settings content width
- **THEN** the content area still renders at no less than the standard settings content width
- **AND** it does not visibly narrow-then-widen once the page's real content replaces the placeholder

### Requirement: Sidebar stays reachable on long pages

The sidebar SHALL remain fixed in view while the content column scrolls, positioned so that it is never obscured by the sticky settings header above it.

#### Scenario: Scrolling a long settings page

- **WHEN** the merchant scrolls down a settings page taller than the viewport
- **THEN** the sidebar remains in view
- **AND** the sidebar's topmost content, including the search box, is fully visible and not covered by the sticky settings header

### Requirement: Every settings section is reachable from the sidebar

Each settings page that exists SHALL have a corresponding sidebar entry, and no sidebar entry SHALL be permanently non-navigable. Sections whose full functionality is not yet built SHALL still be navigable and render a placeholder page.

#### Scenario: Checkout is listed

- **WHEN** the sidebar renders
- **THEN** a Checkout entry is present and navigates to the checkout settings page

#### Scenario: Advanced and License are navigable placeholders

- **WHEN** the merchant selects the Advanced or License sidebar item
- **THEN** the item navigates rather than being inert
- **AND** the right-hand content area renders a placeholder page for that section
