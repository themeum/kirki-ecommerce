## MODIFIED Requirements

### Requirement: Unsaved changes tracking

The product form SHALL report its dirty state (`formState.isDirty`) to the shared unsaved-changes store so navigation away from an unsaved product form warns the merchant, consistent with other forms in the application. For in-app navigation attempts (back arrow, header Cancel, browser back, "Edit Variations"), the warning SHALL be the unsaved-product toast rather than the shared unsaved-changes confirmation dialog used elsewhere in the app. For reload, tab close, and navigation away from the single-page application (e.g. the WordPress admin sidebar), the warning SHALL remain the browser's native unsaved-changes prompt.

#### Scenario: Dirty form warns on in-app navigation

- **WHEN** the product form has unsaved changes and the merchant attempts to navigate away using an in-app control
- **THEN** the navigation is cancelled and the unsaved-product toast is shown

#### Scenario: Dirty form warns on leaving the application

- **WHEN** the product form has unsaved changes and the merchant reloads, closes the tab, or navigates away from the single-page application
- **THEN** the browser's native unsaved-changes prompt is shown

#### Scenario: Saved form does not warn

- **WHEN** the product form has been successfully saved with no further edits
- **THEN** navigating away shows no unsaved-changes warning

## ADDED Requirements

### Requirement: Inventory tracking does not dirty the form on mount

Toggling inventory tracking SHALL only affect the form's dirty state when the merchant actively changes the tracking setting. Loading the product form, whether for a new product or an existing one, SHALL NOT by itself mark the form as having unsaved changes.

#### Scenario: Freshly loaded create form is not dirty

- **WHEN** the merchant opens the product form to create a new product and makes no edits
- **THEN** the form is not marked as having unsaved changes

#### Scenario: Turning off tracking clears the quantity as a user action

- **WHEN** the merchant unchecks "Track quantity" on a form that was previously clean
- **THEN** the available quantity is reset
- **AND** the form is marked as having unsaved changes as a result of that action
