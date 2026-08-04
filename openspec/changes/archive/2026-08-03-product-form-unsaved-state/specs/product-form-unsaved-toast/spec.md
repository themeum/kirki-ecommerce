## Purpose

Defines the bottom-center slide-in toast that appears when the merchant attempts to navigate away from an unsaved product form, letting them save or dismiss without losing the in-app navigation attempt.

## ADDED Requirements

### Requirement: Toast appears when in-app navigation is blocked on a dirty form

When the product form has unsaved changes and the merchant attempts an in-app navigation away from it (the back arrow, the header Cancel button, the browser back button, or the "Edit Variations" action), the navigation SHALL be cancelled and the unsaved-product toast SHALL be shown instead of completing the navigation.

#### Scenario: Back arrow blocked while dirty

- **WHEN** the product form has unsaved changes and the merchant clicks the header back arrow
- **THEN** the navigation to the product list is cancelled
- **AND** the unsaved-product toast is shown

#### Scenario: Header Cancel blocked while dirty

- **WHEN** the product form has unsaved changes and the merchant clicks the header Cancel button
- **THEN** the navigation to the product list is cancelled
- **AND** the unsaved-product toast is shown

#### Scenario: Browser back button blocked while dirty

- **WHEN** the product form has unsaved changes and the merchant triggers the browser's back navigation
- **THEN** the navigation is cancelled and the product form remains rendered
- **AND** the unsaved-product toast is shown

#### Scenario: Edit Variations blocked while dirty

- **WHEN** the product form has unsaved changes and the merchant clicks "Edit Variations" (or "Bulk Edit")
- **THEN** the navigation to the bulk variants page is cancelled
- **AND** the unsaved-product toast is shown

#### Scenario: Clean form navigates without interruption

- **WHEN** the product form has no unsaved changes and the merchant attempts any of the above in-app navigations
- **THEN** the navigation completes normally
- **AND** the unsaved-product toast is not shown

### Requirement: Toast provides Cancel and Save actions

The unsaved-product toast SHALL present a Cancel action and a Save action. Cancel SHALL only dismiss the toast, leaving the merchant on the product form with their unsaved changes intact. Save SHALL run the product form's existing save flow.

#### Scenario: Cancel dismisses the toast only

- **WHEN** the merchant clicks Cancel on the unsaved-product toast
- **THEN** the toast is hidden
- **AND** the merchant remains on the product form with all field values unchanged
- **AND** the form is still marked as having unsaved changes

#### Scenario: Save on valid data clears the toast

- **WHEN** the merchant clicks Save on the unsaved-product toast and the form's required fields (Title, Price) are valid
- **THEN** the product is saved
- **AND** the form is no longer marked as having unsaved changes
- **AND** the toast is hidden
- **AND** no further navigation occurs automatically — the merchant must repeat their original navigation action

#### Scenario: Save on invalid data keeps the toast open

- **WHEN** the merchant clicks Save on the unsaved-product toast and a required field (Title or Price) is empty or invalid
- **THEN** the save is rejected
- **AND** the relevant field(s) show validation errors
- **AND** the unsaved-product toast remains visible

### Requirement: Toast visibility follows dirty state

The unsaved-product toast SHALL remain visible only while the form is both blocked from a navigation attempt and still dirty. It SHALL hide automatically whenever the form becomes clean, regardless of how it became clean.

#### Scenario: Header Save while toast is open

- **WHEN** the unsaved-product toast is visible and the merchant successfully saves using the product form's header Save button instead of the toast's Save button
- **THEN** the toast is hidden

#### Scenario: Repeated blocked navigation while toast is already open

- **WHEN** the unsaved-product toast is already visible and the merchant attempts another blocked in-app navigation
- **THEN** the toast remains visible with no visible re-animation

### Requirement: Toast does not cover reload or external navigation

The unsaved-product toast SHALL only govern in-app navigation attempts. Reloading the page, closing the tab, and navigating to the WordPress admin sidebar SHALL continue to rely on the browser's native unsaved-changes prompt.

#### Scenario: Reload with unsaved changes

- **WHEN** the product form has unsaved changes and the merchant reloads or closes the tab
- **THEN** the browser's native unsaved-changes prompt is shown
- **AND** the unsaved-product toast is not involved
