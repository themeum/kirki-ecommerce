## Purpose

Defines the product edit AI & Web Presence card so merchants can configure search engine metadata, LLM instructions, social share appearance, and structured-data schema profiles with live previews that reflect product data and overrides.

## ADDED Requirements

### Requirement: Card presents four tabbed sections
The AI & Web Presence card on the product edit form SHALL provide four tabs: Search Engines, AEO, Social Share, and Schema. Each tab MUST render its own fields and previews without navigating away from the product form.

#### Scenario: Tab navigation
- **WHEN** a merchant opens the AI & Web Presence card
- **THEN** four tabs labeled Search Engines, AEO, Social Share, and Schema are visible
- **AND** selecting a tab shows that section's content

### Requirement: Search Engines live preview with fallbacks
The Search Engines tab SHALL display a live preview card above the title and meta description fields. The preview MUST show store name and logo from general settings, a URL breadcrumb, title, meta description, price when the product has a price, and a featured-image thumbnail. When custom SEO title or meta description fields are empty, the preview MUST fall back to the product title and short description respectively. When no featured image exists, the preview MUST show a placeholder thumbnail.

#### Scenario: Search preview uses product defaults
- **WHEN** SEO title and meta description fields are empty
- **THEN** the preview shows the product title and short description

#### Scenario: Search preview uses SEO overrides
- **WHEN** the merchant enters a SEO title or meta description
- **THEN** the preview updates to show those values

#### Scenario: Search preview URL breadcrumb
- **WHEN** the product has a slug
- **THEN** the preview breadcrumb shows `{site_url} › products › {slug}`

#### Scenario: Search preview shows price
- **WHEN** the product variant has a price set
- **THEN** the preview displays a formatted price line with currency symbol and code

#### Scenario: Search preview truncates long text
- **WHEN** title or description exceeds typical snippet length
- **THEN** the preview applies CSS line clamping rather than expanding the card indefinitely

### Requirement: Search Engines editable fields
The Search Engines tab SHALL provide editable Title and Meta description fields that sync to the product form context and save payload as `seo_title` and `seo_description`.

#### Scenario: SEO field sync
- **WHEN** the merchant edits the Search Engines title or meta description
- **THEN** the product form context updates the corresponding SEO fields

### Requirement: AEO LLM instructions field
The AEO tab SHALL provide a single labeled field "LLM Instructions" as a plain multi-line textarea. The field MUST sync to `llm_instructions` on the product. No markdown preview is required.

#### Scenario: LLM instructions entry
- **WHEN** the merchant enters text in the LLM Instructions field
- **THEN** the product form context `llm_instructions` value updates

### Requirement: Social Share live preview with fallbacks
The Social Share tab SHALL display a live Open Graph-style preview card above title and meta description fields. The preview MUST show a full-width featured product image or a read-only placeholder when no image exists, followed by URL breadcrumb, title, and description. When custom OG title or description fields are empty, the preview MUST fall back to product title and short description. The preview MUST NOT include a separate image upload control.

#### Scenario: Social preview uses product defaults
- **WHEN** OG title and description fields are empty
- **THEN** the preview shows the product title and short description

#### Scenario: Social preview uses OG overrides
- **WHEN** the merchant enters an OG title or description
- **THEN** the preview updates to show those values

#### Scenario: Social preview image is read-only
- **WHEN** no featured product image exists
- **THEN** the preview shows a static placeholder
- **AND** no image upload control is offered on the Social Share tab

### Requirement: Social Share editable fields without og_image upload
The Social Share tab SHALL provide editable Title and Meta description fields syncing to `og_title` and `og_description`. The product save payload MUST send `og_image` as null. The form layer MAY retain an `og_image` field internally but MUST keep it null.

#### Scenario: OG fields sync without image upload
- **WHEN** the merchant edits Social Share title or description
- **THEN** `og_title` and `og_description` update in product form context
- **AND** no og_image upload UI is shown

#### Scenario: Save clears og_image
- **WHEN** the merchant saves the product
- **THEN** the API payload includes `og_image: null`

### Requirement: Schema profile select from settings
The Schema tab SHALL load schema profiles from the product-schemas API and present them in a select control bound to `schema_id`. When no profiles exist, the select MUST be disabled and helper text MUST direct the merchant to create a profile in Settings.

#### Scenario: Schema profiles listed
- **WHEN** schema profiles exist in settings
- **THEN** the Schema tab select lists each profile by name

#### Scenario: No schema profiles empty state
- **WHEN** no schema profiles exist
- **THEN** the select is disabled
- **AND** helper text explains profiles can be created in Settings → Essentials

#### Scenario: Default profile display without persisting
- **WHEN** the product has no `schema_id` and a default profile exists
- **THEN** the select visually shows the default profile
- **AND** `schema_id` remains null in form context until the merchant explicitly selects a profile

### Requirement: Schema read-only property display
When a schema profile is selected or displayed by default, the Schema tab SHALL show a read-only list of schema.org groups and their selected field tags matching that profile's definition. Merchants MUST NOT edit schema field selections from the product form.

#### Scenario: Properties reflect selected profile
- **WHEN** a schema profile is active in the Schema tab
- **THEN** read-only tags show each group's configured fields (e.g., Product: name, image, description)

#### Scenario: No inline schema editing on product form
- **WHEN** the merchant views schema properties on the product form
- **THEN** no field picker or editable tag removal controls are available

### Requirement: Schema live preview with sale price
The Schema tab SHALL display a rich search-result-style preview below the property tags. The preview MUST match Search Engines preview branding and fallbacks for title, description, image, and URL, and MUST show formatted price. When sale price is set and lower than regular price, the preview MUST show the sale price prominently with the regular price struck through.

#### Scenario: Schema preview sale price
- **WHEN** sale price is set and less than regular price
- **THEN** the schema preview shows sale price as primary and regular price with strikethrough

#### Scenario: Schema preview without sale
- **WHEN** no qualifying sale price exists
- **THEN** the schema preview shows regular price only

### Requirement: Featured image previews update live
Changes to the product media gallery MUST be reflected in Search Engines, Social Share, and Schema previews without requiring a page reload. The first media item in the product gallery SHALL be treated as the featured image for all previews.

#### Scenario: Gallery change updates preview
- **WHEN** the merchant adds or reorders product gallery media
- **THEN** SEO previews update to use the first gallery item as the featured image

### Requirement: SEO form sync preserved
All AI & Web Presence fields MUST continue to sync to product form context via the existing nested form watch pattern and persist through the standard product create/update API without backend changes.

#### Scenario: SEO fields persist on save
- **WHEN** the merchant saves the product after editing AI & Web Presence fields
- **THEN** seo_title, seo_description, llm_instructions, og_title, og_description, schema_id, and og_image null are included in the save payload
