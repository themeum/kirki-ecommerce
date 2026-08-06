# settings-page-actions Specification

## Purpose

Defines how an individual settings page publishes its save and discard affordances to the shared settings header, and how unsaved changes on a settings page block navigation and page unload.

## Requirements

### Requirement: Save and Discard live in the shared settings header

The settings shell SHALL own a single sticky header spanning both columns, and that header SHALL be the only place Save and Discard actions for a settings page appear. An individual settings page SHALL NOT render its own top-level header or its own Save/Discard buttons.

#### Scenario: Only one header is rendered

- **WHEN** any settings page is displayed
- **THEN** exactly one sticky settings header is visible
- **AND** it spans the full width of both the sidebar and the content column

#### Scenario: Save aligns with the content column

- **WHEN** the settings header renders its actions on a page using the standard settings content width
- **THEN** the trailing edge of the Save action aligns with the trailing edge of the content column below it

#### Scenario: Header width is fixed

- **WHEN** a settings page presents a content area wider than the standard settings width
- **THEN** the settings header keeps the standard settings width rather than resizing to follow the page

### Requirement: A settings page publishes its save affordances to the header

A settings page that can be saved SHALL publish its unsaved state, its in-progress save state, and its save and discard handlers to the shell. The shell SHALL render Save and Discard in the header only while a page reports unsaved changes, and SHALL reflect the page's in-progress save state on the Save action.

#### Scenario: Actions appear when the page becomes dirty

- **WHEN** the merchant edits a field on a settings page that had no unsaved changes
- **THEN** Save and Discard appear in the settings header

#### Scenario: Save runs the page's own save flow

- **WHEN** the merchant activates Save in the settings header
- **THEN** the currently displayed settings page's save flow runs, including its own validation
- **AND** the Save action shows an in-progress state until the save settles

#### Scenario: Successful save clears the actions

- **WHEN** a save completes successfully
- **THEN** the page no longer reports unsaved changes
- **AND** Save and Discard are removed from the settings header

#### Scenario: Failed save keeps the actions

- **WHEN** a save fails validation or is rejected by the server
- **THEN** the page still reports unsaved changes
- **AND** Save and Discard remain in the settings header

#### Scenario: Discard reverts the page

- **WHEN** the merchant activates Discard in the settings header
- **THEN** the page's fields revert to their last saved values
- **AND** Save and Discard are removed from the settings header

### Requirement: Pages with nothing to save show no actions

A settings page that has no save flow SHALL result in a header with no Save or Discard actions.

#### Scenario: A read-only settings page

- **WHEN** the merchant opens a settings page that manages its data through its own inline controls rather than a page-level save
- **THEN** the settings header shows no Save or Discard actions

### Requirement: Unsaved state does not leak between settings pages

The unsaved state reported to the header SHALL belong to the settings page currently displayed. Leaving a settings page SHALL clear whatever unsaved state that page had published.

#### Scenario: Moving to a page with no unsaved changes

- **WHEN** the merchant saves a settings page and then navigates to a different settings page that has no unsaved changes
- **THEN** the settings header shows no Save or Discard actions

#### Scenario: Abandoning changes does not carry them forward

- **WHEN** the merchant has unsaved changes on one settings page, confirms leaving it, and lands on another settings page
- **THEN** the settings header shows no Save or Discard actions for the new page

### Requirement: Unsaved changes block in-app navigation

While a settings page reports unsaved changes, any attempt to navigate away within the application SHALL be intercepted and a confirmation SHALL be presented before the navigation completes. This SHALL apply to selecting another sidebar item, using the browser's back and forward buttons, and navigating out of the settings section entirely.

#### Scenario: Selecting another sidebar item while dirty

- **WHEN** the merchant has unsaved changes and selects a different settings sidebar item
- **THEN** the navigation does not complete
- **AND** an unsaved-changes confirmation is presented

#### Scenario: Confirming the prompt completes the navigation

- **WHEN** the merchant confirms the unsaved-changes prompt
- **THEN** the originally attempted navigation completes
- **AND** the abandoned changes are discarded

#### Scenario: Dismissing the prompt stays put

- **WHEN** the merchant dismisses the unsaved-changes prompt
- **THEN** the merchant remains on the current settings page
- **AND** their unsaved changes are still present

#### Scenario: Browser back while dirty

- **WHEN** the merchant has unsaved changes and triggers the browser's back navigation
- **THEN** the navigation does not complete and an unsaved-changes confirmation is presented

#### Scenario: Leaving settings entirely while dirty

- **WHEN** the merchant has unsaved changes and navigates to a route outside the settings section
- **THEN** the navigation does not complete and an unsaved-changes confirmation is presented

#### Scenario: Clean page navigates freely

- **WHEN** the merchant has no unsaved changes and navigates anywhere
- **THEN** the navigation completes with no confirmation

#### Scenario: Saving in progress does not trigger the prompt

- **WHEN** a save is in progress and the resulting state change causes navigation
- **THEN** no unsaved-changes confirmation is presented

### Requirement: Unsaved changes warn on reload and tab close

Reloading the page or closing the tab with unsaved settings changes SHALL surface the browser's native unsaved-changes prompt.

#### Scenario: Reloading with unsaved changes

- **WHEN** the merchant has unsaved changes on a settings page and reloads or closes the tab
- **THEN** the browser's native unsaved-changes prompt is shown

#### Scenario: Reloading with no unsaved changes

- **WHEN** the merchant has no unsaved changes and reloads
- **THEN** no prompt is shown

### Requirement: Each settings page identifies itself with a consistent header

Every settings page and drill-down page SHALL render a page header at the top of the content column, presenting an icon and the page title in a consistent design across all settings pages. Drill-down pages SHALL additionally present a back affordance returning to their parent settings page.

#### Scenario: Top-level page header

- **WHEN** the General settings page is displayed
- **THEN** the content column begins with a page header showing the General icon and the title "General"
- **AND** the header presents no back affordance

#### Scenario: Drill-down page header

- **WHEN** a shipping zone page is displayed
- **THEN** the content column begins with a page header in the same design, showing that page's icon and title
- **AND** the header presents a back affordance returning to the Shipping settings page
