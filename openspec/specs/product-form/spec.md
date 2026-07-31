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

The form SHALL use RHF `useFieldArray` for `additional_info`, `attributes`, and `variants` arrays. Dialog sub-forms for adding or editing array items MAY use local `useForm` instances but MUST push confirmed values into the parent field array via `append` or `update`.

#### Scenario: Additional info managed via field array

- **WHEN** a merchant adds, edits, or deletes an additional info item
- **THEN** the `additional_info` field array is updated in the shared form

#### Scenario: Attribute add regenerates variants

- **WHEN** a merchant saves a new or updated attribute
- **THEN** variant combinations are regenerated
- **AND** the `variants` field array is replaced with the new combinations
- **AND** `has_variants` is set to true

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

The form SHALL validate against a composed `ProductFormSchema` merging existing section schemas. Server validation errors MUST be applied to the unified form via `applyServerErrors` without a `formSyncKey` reset pattern.

#### Scenario: Client validation on submit

- **WHEN** the merchant submits the form with invalid data
- **THEN** Zod validation errors appear on the corresponding unified form fields

#### Scenario: Server errors map to unified form

- **WHEN** the API returns validation errors including variant-prefixed paths
- **THEN** errors are mapped onto the corresponding form field paths

### Requirement: Payload mapping on submit

On submit, form values MUST be transformed to `ProductFormData` for create/update mutations. Media MUST be sent as numeric IDs. Relations (brand, categories, tags, collections) MUST be flattened to IDs. Variant media MUST be sent as `number | null`. Inventory fields MUST be sent via the variants payload only; top-level `allow_back_order` MUST NOT be included in the payload.

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
