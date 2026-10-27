## RENAMED Requirements

- FROM: `### Requirement: Card presents four tabbed sections`
- TO: `### Requirement: Card presents two tabbed sections`

## MODIFIED Requirements

### Requirement: Card presents two tabbed sections
The AI & Web Presence card on the product edit form SHALL provide exactly two tabs: Search Engines and Social Share. Each tab MUST render its own fields and previews without navigating away from the product form. The card SHALL NOT offer an AEO tab or a Schema tab.

#### Scenario: Tab navigation
- **WHEN** a merchant opens the AI & Web Presence card
- **THEN** two tabs labeled Search Engines and Social Share are visible
- **AND** selecting a tab shows that section's content

#### Scenario: No AEO or Schema tab
- **WHEN** a merchant opens the AI & Web Presence card
- **THEN** no AEO tab and no Schema tab are offered

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

## REMOVED Requirements

### Requirement: AEO LLM instructions field
**Reason**: Products no longer store LLM instructions. The column, its API field, and the AEO tab that edited it are removed; nothing ever read the value.
**Migration**: None. Pre-release installs reinstall fresh, and API clients stop sending or reading `llm_instructions`.

### Requirement: Schema profile select from settings
**Reason**: The Schema tab was removed from the product form in commit `480ff712`; this requirement described UI that no longer ships.
**Migration**: None for merchants. Schema profiles are still managed under Settings, and `schema_id` remains part of the product payload.

### Requirement: Schema read-only property display
**Reason**: Part of the Schema tab, which the product form no longer has (commit `480ff712`).
**Migration**: None. Schema profile contents are viewed and edited in Settings.

### Requirement: Schema live preview with sale price
**Reason**: Part of the Schema tab, which the product form no longer has (commit `480ff712`).
**Migration**: None. The Search Engines preview still shows the product's price.
