## MODIFIED Requirements

### Requirement: Search Engines editable fields

The Search Engines tab SHALL provide editable Title and Meta description fields that sync to `seo_title` and `seo_description` in the unified product form.

#### Scenario: SEO field sync

- **WHEN** the merchant edits the Search Engines title or meta description
- **THEN** the unified product form updates the corresponding SEO fields

### Requirement: AEO LLM instructions field

The AEO tab SHALL provide a single labeled field "LLM Instructions" as a plain multi-line textarea. The field MUST sync to `llm_instructions` on the unified product form. No markdown preview is required.

#### Scenario: LLM instructions entry

- **WHEN** the merchant enters text in the LLM Instructions field
- **THEN** the unified product form `llm_instructions` value updates

### Requirement: Social Share editable fields without og_image upload

The Social Share tab SHALL provide editable Title and Meta description fields syncing to `og_title` and `og_description` in the unified product form. The product save payload MUST send `og_image` as null. The form layer MAY retain an `og_image` field internally but MUST keep it null.

#### Scenario: OG fields sync without image upload

- **WHEN** the merchant edits Social Share title or description
- **THEN** `og_title` and `og_description` update in the unified product form
- **AND** no og_image upload UI is shown

#### Scenario: Save clears og_image

- **WHEN** the merchant saves the product
- **THEN** the API payload includes `og_image: null`

### Requirement: Featured image previews update live

Changes to the product media gallery MUST be reflected in Search Engines, Social Share, and Schema previews without requiring a page reload. Preview hooks MUST read the first media item from the unified product form `media` field.

#### Scenario: Gallery change updates preview

- **WHEN** the merchant adds or reorders product gallery media
- **THEN** SEO previews update to use the first gallery item as the featured image

### Requirement: SEO form sync preserved

All AI & Web Presence fields MUST sync to the unified product form via RHF field binding and persist through the standard product create/update API without backend changes.

#### Scenario: SEO fields persist on save

- **WHEN** the merchant saves the product after editing AI & Web Presence fields
- **THEN** seo_title, seo_description, llm_instructions, og_title, og_description, schema_id, and og_image null are included in the save payload
