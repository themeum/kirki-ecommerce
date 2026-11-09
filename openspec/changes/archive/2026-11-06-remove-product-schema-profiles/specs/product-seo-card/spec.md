## MODIFIED Requirements

### Requirement: SEO form sync preserved
All AI & Web Presence fields MUST sync to the unified product form via RHF field binding and persist through the standard product create/update API without backend changes.

#### Scenario: SEO fields persist on save
- **WHEN** the merchant saves the product after editing AI & Web Presence fields
- **THEN** seo_title, seo_description, og_title, og_description, and og_image null are included in the save payload
- **AND** the save payload contains no `llm_instructions` field and no `schema_id` field
