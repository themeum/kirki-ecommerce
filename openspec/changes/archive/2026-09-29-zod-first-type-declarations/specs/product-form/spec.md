## MODIFIED Requirements

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
