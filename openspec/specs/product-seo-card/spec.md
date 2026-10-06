# product-seo-card Specification

## Purpose

Defines the product edit AI & Web Presence card so merchants can configure search engine metadata and social share appearance with live previews that reflect product data and overrides.

## Requirements

### Requirement: Card presents two tabbed sections
The AI & Web Presence card on the product edit form SHALL provide exactly two tabs: Search Engines and Social Share. Each tab MUST render its own fields and previews without navigating away from the product form. The card SHALL NOT offer an AEO tab or a Schema tab.

#### Scenario: Tab navigation
- **WHEN** a merchant opens the AI & Web Presence card
- **THEN** two tabs labeled Search Engines and Social Share are visible
- **AND** selecting a tab shows that section's content

#### Scenario: No AEO or Schema tab
- **WHEN** a merchant opens the AI & Web Presence card
- **THEN** no AEO tab and no Schema tab are offered

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
The Search Engines tab SHALL provide editable Title and Meta description fields that sync to `seo_title` and `seo_description` in the unified product form.

#### Scenario: SEO field sync
- **WHEN** the merchant edits the Search Engines title or meta description
- **THEN** the unified product form updates the corresponding SEO fields

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
The Social Share tab SHALL provide editable Title and Meta description fields syncing to `og_title` and `og_description` in the unified product form. The product save payload MUST send `og_image` as null. The form layer MAY retain an `og_image` field internally but MUST keep it null.

#### Scenario: OG fields sync without image upload
- **WHEN** the merchant edits Social Share title or description
- **THEN** `og_title` and `og_description` update in the unified product form
- **AND** no og_image upload UI is shown

#### Scenario: Save clears og_image
- **WHEN** the merchant saves the product
- **THEN** the API payload includes `og_image: null`

### Requirement: Featured image previews update live
Changes to the product media gallery MUST be reflected in the Search Engines and Social Share previews without requiring a page reload. Preview hooks MUST read the first media item from the unified product form `media` field.

#### Scenario: Gallery change updates preview
- **WHEN** the merchant adds or reorders product gallery media
- **THEN** SEO previews update to use the first gallery item as the featured image

### Requirement: SEO form sync preserved
All AI & Web Presence fields MUST sync to the unified product form via RHF field binding and persist through the standard product create/update API without backend changes.

#### Scenario: SEO fields persist on save
- **WHEN** the merchant saves the product after editing AI & Web Presence fields
- **THEN** seo_title, seo_description, og_title, og_description, schema_id, and og_image null are included in the save payload
- **AND** the save payload contains no `llm_instructions` field
