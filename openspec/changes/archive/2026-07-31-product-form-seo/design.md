## Context

See proposal.md for motivation. The AI & Web Presence card lives in `resources/app/pages/products/edit-product/seo-settings/` with four tab components and a nested RHF form synced to `ProductFormContext`. Schema profiles are managed in Settings → Essentials via `/product-schemas`. The closest preview pattern is collection-details SEO (inner card + URL/title/description + Thumbnail).

Constraints: React + Emotion, RHF + zod, existing product SEO API fields, `GroupTagTable` for schema tag display, grill-me decisions locked in during planning.

## Goals / Non-Goals

**Goals:**

- Figma-aligned previews on Search Engines, Social Share, and Schema tabs
- Shared preview data hook with documented fallbacks
- Schema tab wired to real schema profiles (read-only properties)
- Live featured-image updates via media gallery sync to product context
- Preserve existing nested-form → context → save pipeline

**Non-Goals:**

- Backend API or database changes
- Markdown preview on AEO tab
- Per-product schema field editing (remains in Settings)
- og_image upload UI or storefront rendering logic
- seo_keywords UI (field exists on model but has no card UI today)

## Decisions

### 1. Shared `useSeoPreviewData` hook with mode parameter

- **Choice:** Single hook accepting `'search' | 'social' | 'schema'` mode; returns store branding, breadcrumb, title, description, image URL, and price strings.
- **Why:** Three previews share 90% of data sources; mode switches OG vs SEO field fallbacks.
- **Alternatives:** Three separate hooks (duplication); prop-drilling from parent (fragile).

### 2. Preview components as presentational siblings

- **Choice:** `search-engine-preview.tsx`, `social-share-preview.tsx`, `schema-preview.tsx` each call the hook internally; styled with `cardStyles.innerCard` and collection-details color tokens.
- **Why:** Matches existing tab file structure; keeps tab files thin (preview + separator + fields).
- **Alternatives:** One mega-preview with variant prop (harder to match distinct layouts).

### 3. Search/Schema horizontal layout; Social vertical OG layout

- **Choice:** Search + Schema: store row, then content + 92×92 thumbnail right. Social: full-width image top, text below. No price on Social Share preview.
- **Why:** Matches provided screenshots and grill-me decisions.
- **Alternatives:** Unified layout for all tabs (rejected — designs differ).

### 4. Featured image via product context media sync

- **Choice:** In `edit-product.tsx`, when `MediaGallery.onUpdate` fires, also `updateProduct({ key: 'media', value: items })`. Hook reads `product.media[0]?.url`.
- **Why:** Media gallery currently lives in local state only; previews would be stale without sync.
- **Alternatives:** Pass mediaItems prop into SEOSettings (couples components).

### 5. og_image — no UI, always null

- **Choice:** Remove `ThumbnailField` from social-share.tsx; keep `og_image` in `ProductSeoFormSchema`; force null on reset and via save payload in edit-product.
- **Why:** Grill-me confirmed featured-image-only; retain type for backward compatibility.
- **Alternatives:** Remove field from schema entirely (more churn, breaks mapping).

### 6. Schema select — display default without persisting

- **Choice:** Custom Controller: select `value` shows `schema_id ?? defaultProfile.id` for display; `onValueChange` writes numeric id to form. Properties panel uses same resolved id. Form `schema_id` stays null until user interacts.
- **Why:** Grill-me confirmed UI-only default; avoids silent DB mutation on load.
- **Alternatives:** Auto-write default to context on load (rejected).

### 7. Schema properties — read-only GroupTagTable

- **Choice:** Pass selected profile's `schema` object as `selectedValues`; `hasSelect={false}`, `isEditable={false}`. Reuse `utils.tsx` groupDetails/optionsList.
- **Why:** Existing component renders exact tag-chip design from settings dialog.
- **Alternatives:** New read-only component (unnecessary).

### 8. Price formatting inline in hook

- **Choice:** `{symbol}{amount.toFixed(2)} {code}` from variant[0] price/sale_price and product.currency. Sale strikethrough when sale < regular.
- **Why:** No shared money formatter exists; matches price.tsx symbol usage.
- **Alternatives:** New shared formatMoney util (out of scope).

### 9. Store branding from general settings

- **Choice:** `useSettingsQuery('general')` for store_name and store_logo URL; circular Thumbnail for logo.
- **Why:** Grill-me confirmed; matches screenshot store rows.

### 10. Text truncation via CSS line-clamp

- **Choice:** Emotion styles with `-webkit-line-clamp` on title (2 lines), description (2 lines), breadcrumb (ellipsis).
- **Why:** Grill-me confirmed CSS truncate over hard char limits.

## Risks / Trade-offs

- **[Risk] Media sync doubles product context updates on gallery change** → Acceptable; gallery changes are infrequent; only media array reference updates.
- **[Risk] Default schema display vs null schema_id confuses save** → Mitigation: only persist schema_id when user explicitly selects; UI shows default for guidance only.
- **[Risk] og_image null overwrites existing stored values on save** → Intentional per grill-me; featured image becomes single source at render time.
- **[Risk] General settings query adds network dependency to previews** → Mitigation: query likely cached from app init; graceful empty store name/logo.

## Migration Plan

- Frontend-only deploy; no migration scripts
- Existing products with custom og_image will have og_image cleared on next save (intentional)
- Rollback: revert seo-settings and edit-product changes

## Open Questions

- None — grill-me resolved all design branches before this proposal.
