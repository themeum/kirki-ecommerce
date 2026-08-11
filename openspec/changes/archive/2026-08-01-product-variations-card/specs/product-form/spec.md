## MODIFIED Requirements

### Requirement: useFieldArray for dynamic collections

The form SHALL use RHF `useFieldArray` for `additional_info`, `attributes`, and `variants` arrays. Dialog and card sub-forms for adding or editing array items MAY use local `useForm` instances but MUST push confirmed values into the parent field array via `append`, `update`, or `setValue`. Sub-form confirm actions (e.g. an "Apply" or "Save" button local to the sub-form) MUST NOT trigger a submit of the parent product form; only the page header's Save action persists the product to the server.

#### Scenario: Attribute add regenerates variants

- **WHEN** a merchant saves a new or updated attribute
- **THEN** the parent `attributes` field array is updated
- **AND** `variants` is regenerated from the updated attribute combinations

#### Scenario: Sub-form confirm does not submit the product

- **WHEN** a merchant confirms a section sub-form (e.g. clicks Apply in the attribute editor)
- **THEN** the confirmed values are written into the parent form via `setValue`/`append`/`update`
- **AND** no product create/update network request is sent as a result

### Requirement: Unsaved changes tracking

The product form SHALL report its dirty state (`formState.isDirty`) to the shared unsaved-changes store so navigation away from an unsaved product form warns the merchant, consistent with other forms in the application.

#### Scenario: Dirty form warns on navigation

- **WHEN** the product form has unsaved changes and the merchant attempts to navigate away or close the tab
- **THEN** the unsaved-changes confirmation is shown

#### Scenario: Saved form does not warn

- **WHEN** the product form has been successfully saved with no further edits
- **THEN** navigating away shows no unsaved-changes warning
