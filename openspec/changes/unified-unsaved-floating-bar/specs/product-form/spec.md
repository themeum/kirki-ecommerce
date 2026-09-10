## MODIFIED Requirements

### Requirement: Unsaved changes tracking

The product form SHALL report its dirty state (`formState.isDirty`) to the shared unsaved-changes
store so navigation away from an unsaved product form warns the merchant, consistent with other
forms in the application. While the form is dirty the unsaved-changes floating bar SHALL be
visible, and an in-app navigation attempt (back arrow, browser back, "Edit Variations") SHALL be
refused with the bar shaking rather than a confirmation dialog being shown. For reload, tab close,
and navigation away from the single-page application (e.g. the WordPress admin sidebar), the
warning SHALL remain the browser's native unsaved-changes prompt.

#### Scenario: Dirty form shows the floating bar

- **WHEN** the merchant makes the first edit to the product form
- **THEN** the unsaved-changes floating bar becomes visible

#### Scenario: Dirty form refuses in-app navigation

- **WHEN** the product form has unsaved changes and the merchant attempts to navigate away using an
  in-app control
- **THEN** the navigation is refused and the floating bar shakes

#### Scenario: Dirty form warns on leaving the application

- **WHEN** the product form has unsaved changes and the merchant reloads, closes the tab, or
  navigates away from the single-page application
- **THEN** the browser's native unsaved-changes prompt is shown

#### Scenario: Saved form does not warn

- **WHEN** the product form has been successfully saved with no further edits
- **THEN** the floating bar is hidden
- **AND** navigating away shows no unsaved-changes warning

### Requirement: useFieldArray for dynamic collections

The form SHALL use RHF `useFieldArray` for `additional_info`, `attributes`, and `variants` arrays. Dialog and card sub-forms for adding or editing array items MAY use local `useForm` instances but MUST push confirmed values into the parent field array via `append`, `update`, or `setValue`. Sub-form confirm actions (e.g. an "Apply" or "Save" button local to the sub-form) MUST NOT trigger a submit of the parent product form; only the floating bar's Save action persists the product to the server.

#### Scenario: Additional info managed via field array

- **WHEN** a merchant adds, edits, or deletes an additional info item
- **THEN** the `additional_info` field array is updated in the shared form

## ADDED Requirements

### Requirement: The product form keeps its header Save and Cancel

The product form and the variant form SHALL continue to present Save and Cancel actions in their
page header, available whether or not the form is dirty, alongside the back affordance. The
floating bar SHALL supplement those controls rather than replace them, appearing only when an
attempt to leave a dirty form is refused. The bar's own primary action SHALL carry the same label
as the header's.

#### Scenario: A clean form still offers Save

- **WHEN** the merchant opens the product form and makes no edits
- **THEN** the page header presents Save and Cancel alongside the back affordance
- **AND** the floating bar is not visible

#### Scenario: The create form labels its action "Create"

- **WHEN** the merchant edits a product form opened to create a new product
- **THEN** the floating bar's primary action reads "Create"

#### Scenario: The edit form labels its action "Save"

- **WHEN** the merchant edits an existing product
- **THEN** the floating bar's primary action reads "Save"
