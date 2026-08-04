## Why

The product edit **AI & Web Presence** card (`seo-settings/`) is a placeholder: Search Engines and Social Share tabs have no live previews, the Schema tab uses hardcoded profile options and an editable field picker instead of settings profiles, and the Social Share tab exposes a separate `og_image` upload that no longer matches the design. Merchants need pixel-aligned SERP, Open Graph, and schema previews with correct fallbacks so they can see how products will appear before publishing.

## What Changes

- Add live **Search Engines** preview: store branding row, URL breadcrumb, title, meta description, price, and featured-image thumbnail; fields override product defaults
- Add live **Social Share** preview: full-width featured image, URL breadcrumb, title, and description; remove separate `og_image` upload UI; always send `og_image: null` on save
- Polish **AEO** tab: label "LLM Instructions", taller plain textarea (no markdown preview)
- Rebuild **Schema** tab: select loads schema profiles from `/product-schemas` API; read-only property tags from selected profile; rich SERP preview with sale-price strikethrough when applicable
- Add shared `useSeoPreviewData` hook and three preview components following the collection-details SEO pattern
- Sync product gallery `mediaItems` to `ProductFormContext` so featured-image previews update live
- Keep `og_image` in form schema/types but always sync `null` via form watcher (no UI)
- Schema default profile shown in UI when `schema_id` is null (display-only until user selects or saves)

## Capabilities

### New Capabilities

- `product-seo-card`: Product edit AI & Web Presence card — tabbed Search Engines, AEO, Social Share, and Schema UI with live previews, schema profile selection, and preview data fallbacks

### Modified Capabilities

- (none — no existing specs under `openspec/specs/` for product SEO)

## Impact

- [`resources/app/pages/products/edit-product/seo-settings/`](resources/app/pages/products/edit-product/seo-settings/) — primary refactor (new hook + preview components; update all four tab files)
- [`resources/app/pages/products/edit-product/edit-product.tsx`](resources/app/pages/products/edit-product/edit-product.tsx) — media sync to context; `og_image: null` on save
- Reuses: `GroupTagTable`, `useSchemasQuery`, `useSettingsQuery('general')`, `ProductFormContext`, existing product SEO API fields
- No backend or migration changes
