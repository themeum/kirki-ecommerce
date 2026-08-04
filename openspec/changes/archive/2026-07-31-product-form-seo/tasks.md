## 1. Media sync and save behavior

- [x] 1.1 Sync `mediaItems` to `ProductFormContext` via `updateProduct({ key: 'media', value })` in `edit-product.tsx` on gallery update
- [x] 1.2 Set `og_image: null` in product save payload in `edit-product.tsx`
- [x] 1.3 Force `og_image: null` in `mapProductToSeoValues` and keep null via SEO form reset in `seo-settings.tsx`

## 2. Shared preview hook

- [x] 2.1 Create `resources/app/pages/products/edit-product/seo-settings/use-seo-preview-data.ts`
- [x] 2.2 Implement store branding from `useSettingsQuery('general')`, breadcrumb `{site_url} › products › {slug}`, and featured image from `product.media[0]`
- [x] 2.3 Implement title/description fallbacks per mode (search vs social) and price/sale-price formatting with strikethrough logic

## 3. Preview components

- [x] 3.1 Create `search-engine-preview.tsx` — store row, horizontal content + 92×92 thumbnail, price line, CSS line-clamp
- [x] 3.2 Create `social-share-preview.tsx` — full-width image top, URL/title/description below, read-only placeholder
- [x] 3.3 Create `schema-preview.tsx` — search layout plus sale-price strikethrough when sale < regular

## 4. Search Engines tab

- [x] 4.1 Update `search-engines.tsx`: add preview card, separator, keep Title and Meta description fields

## 5. Social Share tab

- [x] 5.1 Update `social-share.tsx`: remove `ThumbnailField` and og_image local state
- [x] 5.2 Add `SocialSharePreview`, separator, and Title + Meta description fields only

## 6. AEO tab

- [x] 6.1 Update `aeo.tsx`: label to "LLM Instructions", increase textarea rows (~12–15)

## 7. Schema tab

- [x] 7.1 Wire `schema.tsx` to `useSchemasQuery({ limit: -1 })` with empty-state helper text when no profiles
- [x] 7.2 Implement display-only default profile selection when `schema_id` is null (custom Controller)
- [x] 7.3 Show read-only `GroupTagTable` (`hasSelect={false}`, `isEditable={false}`) from active profile schema
- [x] 7.4 Add `SchemaPreview` below property tags; remove placeholder text and editable field picker

## 8. Verification

- [x] 8.1 Verify Search Engines preview updates live for title, slug, short description, SEO fields, price, and featured image
- [x] 8.2 Verify Social Share preview layout matches design (full-width image, no upload, OG fallbacks)
- [x] 8.3 Verify Schema select lists settings profiles, shows read-only tags, and preview with sale strikethrough
- [x] 8.4 Verify AEO label and textarea height
- [x] 8.5 Verify product save sends `og_image: null` and all other SEO fields persist correctly
