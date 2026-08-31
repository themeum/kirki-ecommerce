## MODIFIED Requirements

### Requirement: Payload mapping on submit

On submit, form values MUST be transformed to the product save payload for create/update mutations. The payload type MUST be derived from `ProductFormSchema` rather than declared separately, and the mapping MUST be part of the schema declaration rather than a separate build step invoked by the page. Media MUST be sent as numeric IDs. Relations (brand, categories, tags, collections) MUST be flattened to IDs. Variant media MUST be sent as `number | null`. Inventory fields MUST be sent via the variants payload only; top-level `allow_back_order` MUST NOT be included in the payload.

Per-variant mapping MUST be declared on the variant schema itself, so any editor that adopts it produces the same variant payload shape. The bulk-edit grid reuses those per-variant rules for validation and submits a typed request body; it does not share this requirement's product-level payload mapping, because it edits variants directly rather than through a product.

#### Scenario: Save sends variant inventory fields

- **WHEN** the merchant saves a simple product with sell-when-out-of-stock enabled
- **THEN** `allow_back_order` is included on `variants[0]` in the API payload
- **AND** no top-level `allow_back_order` field is sent

#### Scenario: Save transforms media and relations

- **WHEN** the merchant saves a product with gallery media and categories
- **THEN** the payload includes `media` as an array of numeric IDs
- **AND** categories, tags, and collections are sent as ID arrays
