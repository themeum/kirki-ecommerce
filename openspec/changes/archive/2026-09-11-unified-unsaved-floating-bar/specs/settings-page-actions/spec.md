## MODIFIED Requirements

### Requirement: Save and Discard live in the shared settings header

Save and Discard for a settings page SHALL appear in the shared floating bar at the bottom of the
screen, and that bar SHALL be the only place they appear. An individual settings page SHALL NOT
render its own top-level header or its own Save/Discard buttons, and the settings shell SHALL NOT
render Save or Discard in a header of its own.

#### Scenario: Only one header is rendered

- **WHEN** any settings page is displayed
- **THEN** exactly one settings page header is visible at the top of the content column
- **AND** it presents no Save or Discard action

#### Scenario: Save appears in the floating bar

- **WHEN** a settings page reports unsaved changes
- **THEN** Save and Discard are presented in the floating bar at the bottom of the screen
- **AND** they are presented nowhere else

#### Scenario: The bar is independent of the content width

- **WHEN** a settings page presents a content area wider or narrower than the standard settings width
- **THEN** the floating bar keeps its own position and width rather than resizing to follow the page

### Requirement: A settings page publishes its save affordances to the header

A settings page that can be saved SHALL publish its unsaved state, its in-progress save state, and
its save and discard handlers to the shell. The shell SHALL present Save and Discard in the
floating bar only while a page reports unsaved changes, and SHALL reflect the page's in-progress
save state on the Save action.

#### Scenario: Actions appear when the page becomes dirty

- **WHEN** the merchant edits a field on a settings page that had no unsaved changes
- **THEN** the floating bar rises into view presenting Save and Discard

#### Scenario: Save runs the page's own save flow

- **WHEN** the merchant activates Save in the floating bar
- **THEN** the currently displayed settings page's save flow runs, including its own validation
- **AND** the Save action shows an in-progress state until the save settles

#### Scenario: Successful save clears the actions

- **WHEN** a save completes successfully
- **THEN** the page no longer reports unsaved changes
- **AND** the floating bar is hidden

#### Scenario: Failed save keeps the actions

- **WHEN** a save fails validation or is rejected by the server
- **THEN** the page still reports unsaved changes
- **AND** the floating bar remains visible

#### Scenario: Discard reverts the page

- **WHEN** the merchant activates Discard in the floating bar
- **THEN** the page's fields revert to their last saved values
- **AND** the floating bar is hidden

### Requirement: Pages with nothing to save show no actions

A settings page that has no save flow SHALL result in no floating bar being presented.

#### Scenario: A read-only settings page

- **WHEN** the merchant opens a settings page that manages its data through its own inline controls
  rather than a page-level save
- **THEN** no floating bar is presented

### Requirement: Unsaved changes block in-app navigation

While a settings page reports unsaved changes, any attempt to navigate away within the application
SHALL be refused and the floating bar SHALL shake, rather than a confirmation being presented. This
SHALL apply to selecting another sidebar item, using the browser's back and forward buttons, and
navigating out of the settings section entirely. The merchant SHALL leave by choosing Save or
Discard in the bar.

#### Scenario: Selecting another sidebar item while dirty

- **WHEN** the merchant has unsaved changes and selects a different settings sidebar item
- **THEN** the navigation does not complete
- **AND** the floating bar shakes
- **AND** no confirmation dialog is presented

#### Scenario: Discard completes the navigation

- **WHEN** the merchant activates Discard after a navigation was refused
- **THEN** the abandoned changes are discarded
- **AND** the originally attempted navigation completes

#### Scenario: Saving completes and releases the block

- **WHEN** the merchant activates Save after a navigation was refused and the save succeeds
- **THEN** the page no longer reports unsaved changes
- **AND** the floating bar is hidden

#### Scenario: Browser back while dirty

- **WHEN** the merchant has unsaved changes and triggers the browser's back navigation
- **THEN** the navigation does not complete and the floating bar shakes

#### Scenario: Leaving settings entirely while dirty

- **WHEN** the merchant has unsaved changes and navigates to a route outside the settings section
- **THEN** the navigation does not complete and the floating bar shakes

#### Scenario: Clean page navigates freely

- **WHEN** the merchant has no unsaved changes and navigates anywhere
- **THEN** the navigation completes with no interruption

#### Scenario: Saving in progress does not block

- **WHEN** a save is in progress and the resulting state change causes navigation
- **THEN** the navigation completes and the floating bar does not shake

### Requirement: Unsaved state does not leak between settings pages

The unsaved state reported to the shell SHALL belong to the settings page currently displayed.
Leaving a settings page SHALL clear whatever unsaved state that page had published, and that state
SHALL NOT continue to cause unsaved-changes warnings anywhere else in the application.

#### Scenario: Moving to a page with no unsaved changes

- **WHEN** the merchant saves a settings page and then navigates to a different settings page that
  has no unsaved changes
- **THEN** no floating bar is presented

#### Scenario: Abandoning changes does not carry them forward

- **WHEN** the merchant has unsaved changes on one settings page, discards them from the floating
  bar, and lands on another settings page
- **THEN** no floating bar is presented for the new page

#### Scenario: An abandoned settings page stops warning elsewhere

- **WHEN** the merchant leaves a settings page that had unsaved changes, navigates to an unrelated
  part of the admin, and reloads
- **THEN** the browser's native unsaved-changes prompt is not shown
