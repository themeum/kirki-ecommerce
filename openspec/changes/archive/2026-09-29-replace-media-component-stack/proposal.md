## Why

Single-image selection in the admin UI is spread across four overlapping
components — `thumbnail-field`, `thumbnail-selector`, `ui/thumbnail` and
`ui/placeholder` — with no shared image primitive behind them. Three concrete
problems follow from that:

1. **No image primitive.** Nine raw `<img>` tags render across the app with no
   loading state, no fallback when a URL fails, no lazy loading, and no
   responsive sources — even though every API response already carries the full
   WordPress size map on `MediaRefSchema.sizes`, which nothing reads. A 32px
   table avatar downloads the full-size original.
2. **The preview-URL state lift.** The thumbnail field writes a bare attachment
   id back to form state, discarding the URL. Five of its six call sites
   therefore keep a parallel `useState` for the preview and thread it back down
   as props. `mediaId()` in `libs/zod.ts` already accepts a whole media object
   and flattens it to an id at submit, so this duplication buys nothing.
3. **Drag and drop is advertised but absent.** The copy "Drag and drop, or
   upload image" has no handler behind it; there is no native file drop anywhere
   in the app, and no path from a dropped file to a WordPress attachment.

## What Changes

- Add an **image primitive** that accepts either a media reference or a plain
  URL, derives responsive sources from the media reference's size map, falls
  back to a placeholder asset when a source is absent or fails, shows a skeleton
  while loading, and lazy-loads by default.
- Add a **media picker**: a single-media selection surface with a real
  drag-and-drop dropzone that uploads dropped files to the WordPress media
  library, plus browse-from-library, preview, replace and remove.
- Add a **media field** binding that picker to react-hook-form, following the
  established field envelope.
- Extract the WordPress media-library frame into a hook that opens frames on
  demand instead of building one per component instance at mount.
- **BREAKING (internal):** remove `components/form/thumbnail-field.tsx`,
  `components/thumbnail-selector.tsx`, `components/ui/thumbnail.tsx`,
  `components/ui/placeholder.tsx` and `components/media-selector.tsx`, along
  with the `ThumbnailPlaceholder` icon and the `ThumbnailSize`/`ThumbnailType`
  types. All call sites migrate in this change; no compatibility shim is kept.
- **BREAKING (internal):** the media field stores the whole media reference in
  form state rather than a bare id, removing the `valueAs`, `previewUrl`,
  `onPreviewChange` and `getPreviewUrl` props and the parallel preview state at
  every call site. No form schema changes — `mediaId()` and the two
  URL-unwrapping transforms already accept this input.

## Capabilities

### New Capabilities

- `image-primitive`: how a single image renders — source resolution from a media
  reference or URL, responsive source selection, fallback on missing or failed
  sources, loading affordance, lazy loading, and the size and shape vocabulary
  every display surface shares.
- `media-selection`: how a person attaches one media item — browsing the
  WordPress library, dropping a file to upload it, what is accepted and how
  rejection is reported, how a chosen item is previewed, replaced and removed,
  and what a bound form field stores.

### Modified Capabilities

<!-- None. The new field satisfies form-field-binding's existing requirements
     without changing them; skeleton-primitive and theme-primitives are consumed
     as-is. -->

## Impact

- **New**: `components/ui/image.tsx`, `components/media-picker.tsx`,
  `components/form/media-field.tsx`, `hooks/use-media-library.ts`,
  `services/media.ts`, `assets/placeholder.svg`, and colocated tests for the
  three components.
- **Removed**: the five components listed above, the `ThumbnailPlaceholder`
  export in `icons.tsx`, and `ThumbnailSize`/`ThumbnailType` in
  `types/components/common.ts`.
- **Migrated call sites**: 6 thumbnail-field sites, 27 thumbnail render sites
  across 16 files, and 6 of the 9 raw `<img>` tags. `media-gallery.tsx` and
  `variant-thumbnail-selector.tsx` move off the deleted selector and placeholder.
- **Network**: a new upload path posting to WordPress core's `wp/v2/media`
  endpoint. The nonce already exposed as `rest_nonce` is a `wp_rest` nonce, so
  **no PHP changes are required**.
- **Types**: `global.d.ts`'s `WpMediaFrame` gains the frame teardown and modal
  members that are used today but typed only locally.
- **Not addressed**: `barcode-generation.tsx` renders a hardcoded
  `kirki-ecommerce.test` dev-host URL that 404s elsewhere. It is a separate bug
  and is deliberately left untouched. Drop-upload for the multi-select gallery
  is also out of scope; the gallery gains the image primitive only.
