# product-form Specification

## Purpose

Provides a unified product create and edit form backed by a single React Hook Form instance, shared across separate create and edit pages, with consistent field binding, validation, and API payload mapping for simple and variant products.

## Requirements

### Requirement: Single form instance with form context

The product form SHALL use exactly one `useForm()` instance owned by `ProductForm`. All section components MUST consume the form via `useFormContext()` and bind fields through `Controller` or shared form field components from `resources/app/components/form/`.

#### Scenario: Sections read shared form state

- **WHEN** a merchant edits any product form section
- **THEN** the change is reflected in the single RHF form state
- **AND** no separate section-level `useForm()` instances exist for product fields

#### Scenario: Form field components use Controller

- **WHEN** a section renders an input
- **THEN** it uses a form directory component or RHF `Controller` bound to the shared form control

### Requirement: Separate create and edit pages

Product creation and editing SHALL be separate page components. Create lives at `/products/create`. Edit lives at `/products/:id` for numeric product IDs. Both pages render the shared `ProductForm` component.

#### Scenario: Create page has no product fetch

- **WHEN** a merchant navigates to `/products/create`
- **THEN** the create page renders `ProductForm` with empty or seeded default values
- **AND** no product detail query is executed

#### Scenario: Edit page loads product before form

- **WHEN** a merchant navigates to `/products/:id` with a valid product ID
- **THEN** the edit page fetches the product via TanStack Query
- **AND** shows a loading indicator until the fetch succeeds
- **AND** renders `ProductForm` with loaded data after success

#### Scenario: Edit page handles load failure

- **WHEN** the product fetch fails or returns no data
- **THEN** the edit page shows an appropriate error or empty state
- **AND** does not render the product form with stale defaults

### Requirement: Variant fields nested under variants array

Price, inventory, shipping, and related variant-specific fields SHALL be stored in form state under `variants[0]` for simple products (`has_variants: false`). The API always returns at least one variant for simple products. If the loaded product has an empty `variants` array, the form MUST synthesize a default variant entry before rendering.

#### Scenario: Simple product binds to default variant

- **WHEN** a simple product form is displayed
- **THEN** price, SKU, inventory, and shipping fields bind to `variants.0.*` paths

#### Scenario: Empty variants normalized on load

- **WHEN** loaded product data has `variants: []`
- **THEN** the form initializes with one default variant containing empty variant fields

### Requirement: useFieldArray for dynamic collections

The form SHALL use RHF `useFieldArray` for `additional_info`, `attributes`, and `variants` arrays. Dialog and card sub-forms for adding or editing array items MAY use local `useForm` instances but MUST push confirmed values into the parent field array via `append`, `update`, or `setValue`. Sub-form confirm actions (e.g. an "Apply" or "Save" button local to the sub-form) MUST NOT trigger a submit of the parent product form; only the page header's Save action persists the product to the server.

#### Scenario: Additional info managed via field array

- **WHEN** a merchant adds, edits, or deletes an additional info item
- **THEN** the `additional_info` field array is updated in the shared form

#### Scenario: Attribute add regenerates variants

- **WHEN** a merchant saves a new or updated attribute
- **THEN** the parent `attributes` field array is updated
- **AND** `variants` is regenerated from the updated attribute combinations

#### Scenario: Sub-form confirm does not submit the product

- **WHEN** a merchant confirms a section sub-form (e.g. clicks Apply in the attribute editor)
- **THEN** the confirmed values are written into the parent form via `setValue`/`append`/`update`
- **AND** no product create/update network request is sent as a result

### Requirement: Conditional section visibility for variant products

When a product has attributes and multiple variants (`has_variants: true` with non-empty `attribute_values` on variants), the standalone Price, Inventory, and Shipping sections MUST NOT be shown. Per-variant data MUST be managed through the Variants section and variation table.

#### Scenario: Simple product shows price sections

- **WHEN** the product has no attributes or `variants[0].attribute_values` is empty
- **THEN** Price, Inventory, and Shipping sections are visible

#### Scenario: Variant product hides price sections

- **WHEN** the product has attributes and generated variant combinations
- **THEN** Price, Inventory, and Shipping standalone sections are hidden
- **AND** the Variants section remains visible

### Requirement: Create page default seeding

The create page SHALL fetch default settings (currency, weight unit, dimension unit) and shipping boxes, then merge seeded values into form default values before rendering `ProductForm`. Seeded fields include currency and `variants.0` shipping/weight defaults.

#### Scenario: Create form seeded from settings

- **WHEN** the create page loads and settings queries resolve
- **THEN** the form default values include currency from default settings
- **AND** `variants.0.weight_unit`, `variants.0.dimension_unit`, and `variants.0.shipping_box_id` are seeded from product settings and shipping boxes

### Requirement: Unified validation schema

The form SHALL validate against a composed `ProductFormSchema` merging existing section schemas. Section schemas that are composed into it MUST remain plain object schemas, carrying no cross-field validation wrapper and no payload transform of their own; only the composed `ProductFormSchema` is prepared for cross-field validation and carries the payload transform. Server validation errors MUST be applied to the unified form via `applyServerErrors` without a `formSyncKey` reset pattern.

#### Scenario: Client validation on submit

- **WHEN** the merchant submits the form with invalid data
- **THEN** Zod validation errors appear on the corresponding unified form fields

#### Scenario: Server errors map to unified form

- **WHEN** the API returns validation errors including variant-prefixed paths
- **THEN** errors are mapped onto the corresponding form field paths

#### Scenario: Section schema composed into the unified schema

- **WHEN** a section schema is merged or extended into `ProductFormSchema`
- **THEN** composition succeeds because the section schema carries no transform or cross-field wrapper

### Requirement: Payload mapping on submit

On submit, form values MUST be transformed to the product save payload for create/update mutations. The payload type MUST be derived from `ProductFormSchema` rather than declared separately, and the mapping MUST be part of the schema declaration rather than a separate build step invoked by the page. Media MUST be sent as numeric IDs. Relations (brand, categories, tags, collections) MUST be flattened to IDs. Variant media MUST be sent as `number | null`. Inventory fields MUST be sent via the variants payload only; top-level `allow_back_order` MUST NOT be included in the payload.

Per-variant mapping MUST be declared on the variant schema itself, so any editor that adopts it produces the same variant payload shape. The bulk-edit table does not go through this schema — it has its own reducer-based state and an untyped request body — and bringing it onto this pipeline is out of scope for this change.

#### Scenario: Save sends variant inventory fields

- **WHEN** the merchant saves a simple product with sell-when-out-of-stock enabled
- **THEN** `allow_back_order` is included on `variants[0]` in the API payload
- **AND** no top-level `allow_back_order` field is sent

#### Scenario: Save transforms media and relations

- **WHEN** the merchant saves a product with gallery media and categories
- **THEN** the payload includes `media` as an array of numeric IDs
- **AND** categories, tags, and collections are sent as ID arrays

### Requirement: Media gallery in form state

Product gallery media SHALL be managed through `MediaGalleryField` bound to the `media` form field. Preview components that depend on featured image MUST read the first gallery item from form state.

#### Scenario: Gallery updates form state

- **WHEN** the merchant adds, removes, or reorders gallery items
- **THEN** the `media` field in the shared form updates accordingly

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

### Requirement: Inventory tracking does not dirty the form on mount

Toggling inventory tracking SHALL only affect the form's dirty state when the merchant actively changes the tracking setting. Loading the product form, whether for a new product or an existing one, SHALL NOT by itself mark the form as having unsaved changes.

#### Scenario: Freshly loaded create form is not dirty

- **WHEN** the merchant opens the product form to create a new product and makes no edits
- **THEN** the form is not marked as having unsaved changes

#### Scenario: Turning off tracking clears the quantity as a user action

- **WHEN** the merchant unchecks "Track quantity" on a form that was previously clean
- **THEN** the available quantity is reset
- **AND** the form is marked as having unsaved changes as a result of that action
