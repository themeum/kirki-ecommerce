## Context

See `proposal.md` — Why. Constraints that shape the approach:

- **Styling is pure Emotion.** There is no Tailwind, no `class-variance-authority`,
  no `clsx`. Every primitive under `components/ui/` bans `className` via
  `Omit<..., 'className' | 'css'>` and exposes `cssOverride?: CSSObject`, composing
  styles as `scopedMerge(base, variant, size, state, cssOverride)`. `scoped()`
  nests rules under `#wpbody-content .kirki-ecommerce-root &&` to outrank the
  WordPress admin stylesheet. A reference implementation written against Tailwind
  and CVA cannot be ported; only its behaviour transfers.
- **`mediaId()` already accepts objects.** `libs/zod.ts`'s `mediaId()` takes
  `MediaRef | number | string | nullish` and emits `number | { id, poster } | null`.
  The two URL-shaped fields (offline payment `icon`, email template `logo`) use
  unions that already unwrap `.url` from an object. So storing whole references in
  form state needs no schema edits.
- **`MediaRefSchema.sizes`** carries the full WordPress size map on every response
  and is read by nothing today.
- **The nonce is already right.** `app/Supports/Assets.php:94` exposes
  `wp_create_nonce('wp_rest')` as `rest_nonce`, which is exactly what WordPress
  core's `wp/v2/media` endpoint requires. No PHP change is needed to upload.
- **`libs/api.ts`'s `apiClient` is pinned** to the plugin namespace via
  `baseURL: APP_API_PREFIX` (`kirki/ecommerce/v1`), so a core-endpoint call has to
  bypass it.
- **The existing `wp.media` wrapper is fragile.** `components/media-selector.tsx`
  builds its frame once on mount inside an effect with `[]` deps, which staled the
  `onSelect` closure and forced an `onSelectToggler` boolean plus a second effect
  to work around it. Two `exhaustive-deps` suppressions document this.
- **No test coverage exists** for any component being replaced.

## Goals / Non-Goals

**Goals:**

- One image primitive behind every image in the app, including inside the
  existing gallery.
- One selection surface serving both bound (react-hook-form) and unbound callers,
  mirroring how `MediaGallery`/`MediaGalleryField` already split.
- Delete the old stack outright in this change — no compatibility shim, no
  deprecation window. The app is a single codebase with no external consumers.
- No form schema changes and no PHP changes.

**Non-Goals:**

- Drop-upload for the multi-select gallery. The gallery adopts the image
  primitive only; its add-flow stays library-only.
- A determinate upload progress readout.
- Any change to how the variants table computes its gallery — only its
  presentation and its access to the library move.
- Fixing `barcode-generation.tsx`'s hardcoded `kirki-ecommerce.test` URL.

## Decisions

### Upload goes to WordPress core's `wp/v2/media`, not a plugin endpoint

A dropped file has no attachment id, and every consuming schema demands one, so
the drop must genuinely upload. Three options were weighed:

- **Chosen: `POST` FormData to `${site_url}/wp-json/wp/v2/media` with `X-WP-Nonce`.**
  Works today with zero backend work because `rest_nonce` is already a `wp_rest`
  nonce. Core owns MIME validation, size limits, capability checks and thumbnail
  generation.
- *Rejected: drive `wp.Uploader`/plupload.* Most faithful to WordPress, but the
  API is undocumented for injecting an external `File`, resists typing, and the
  frame is built once-on-mount — precisely the wiring being removed.
- *Rejected: a `kirki/ecommerce/v1/media` endpoint wrapping `wp_handle_upload`.*
  Cleanest response contract and rides `apiClient`, but it is PHP work outside a
  frontend change and duplicates core.

The cost is a **shape mismatch**: `wp/v2/media` returns `source_url`,
`media_details.sizes`, `alt_text`, `mime_type`, while `wp.media`'s
`attachment.toJSON()` returns `url`, `sizes`, `alt`, `mime`. A normalizer in
`services/media.ts` maps the REST response onto `MediaRef` so both entry points
yield one type and the rest of the app never learns which was used.

The call bypasses `apiClient` by passing an absolute URL (axios skips `baseURL`
for absolute URLs). It does not use `parseData`/`parseResponse`, which assume the
plugin's `{ data }` envelope — core returns the object bare.

### Form state holds the whole `MediaRef`

The current field writes `item.id` on change, discarding the URL, which is the
sole reason five of six call sites maintain a `previewUrl` `useState` and thread
`previewUrl`/`onPreviewChange` back down. Because `mediaId()` already flattens an
object at submit and the catalog schemas already hydrate forms with complete
references (`brand.logo` is `MediaRefSchema.nullish()`), storing the reference
makes the preview derivable from `field.value` alone.

This deletes four props (`valueAs`, `previewUrl`, `onPreviewChange`,
`getPreviewUrl`) and the parallel state at every call site, with **no schema
edits**.

*Alternative rejected:* keeping `valueAs` for callers wanting a bare id. It
reintroduces the "value lost its URL" problem on remount for no benefit — no
caller needs a bare id in form state, only in the payload, which the transform
already produces.

The one shape this cannot preview is a bare numeric id hydrated with no
accompanying object. No such call site exists; the value resolver handles
`MediaRef | string | null` and treats a bare number as empty.

### `Image` absorbs `Thumbnail`, keeping its size vocabulary

`Thumbnail` is a bordered box with a placeholder empty state — which is what the
image primitive's fallback already is — plus an editor overlay that belongs to
the selection surface. Merging them removes the overlap.

Rather than expose only `width`/`height`, `Image` keeps a named size scale
matching today's `ThumbnailSize` (`xsm` 16px, `small` 32px, `md` 40px default,
`fullWidth`) and maps `type="circle"` onto `shape="circle"`. This makes the
27-site migration mechanical — import swap plus a prop rename — instead of 27
hand-picked dimensions, which is where visual regressions would come from. The
five sites using ad-hoc `style={{height:'92px'}}` move to the native
`width`/`height` attributes, which come free from `ComponentPropsWithoutRef<'img'>`.

The reference's `rounded` and `aspectRatio` variants are **not** ported: radius
follows from `size`/`shape`, and no call site needs a forced ratio. Adding them
would be speculative surface, which `CLAUDE.md` §1 explicitly warns against.

### Source accepts `MediaRef | string | null`

Twenty-plus sites write `src={x?.url}`. Accepting the reference itself removes
that noise and, more importantly, unlocks `sizes` — building a real `srcSet` of
`${url} ${width}w` candidates so a 32px avatar stops fetching a 2000px original.
It also lets `alt` default to `media.alt`. Plain strings stay supported for the
sites that only ever have a URL (`product.image`, `payment.icon`).

### `processSrc` is dropped

The reference resolves leading-slash paths against `window.growfund.assets_url`.
This project has no equivalent global, and every media URL originates from
WordPress already absolute. Adding an `assets_url` config key for a case that
does not exist would be speculative. The duplicated `getIconUrl` absolute/relative
sniff in the payment pages collapses into `Image`'s own handling of an absent or
unusable source.

### Fallback is a replaceable asset, not an icon

`ThumbnailPlaceholder` (an inline SVG in `icons.tsx` with a hardcoded `#8C8C8C`
stroke, outside the theme) is deleted. In its place `Image` takes a `fallbackSrc`
defaulting to a new `assets/placeholder.svg`. Vite resolves `.svg` imports to a
URL and `vite/client` already declares the module, so no build change is needed.

**The committed `placeholder.svg` is a mock**; the real artwork will be dropped in
over it, which is why the fallback is an asset rather than a component.

### `useMediaLibrary()` replaces `MediaSelector`

`MediaSelector`'s real problem is that it is a component where a hook belongs: it
renders a `<Field>` and a `role="button"` wrapper div that the new dropzone would
fight for click and keyboard handling, and it constructs a frame per instance at
mount. A hook that builds the frame lazily inside `open()` binds current handlers,
which removes the `onSelectToggler` indirection and both `exhaustive-deps`
suppressions, and means a form with three media fields creates zero frames until
someone clicks.

It keeps calling `openWpMediaFrame`/`closeWpMediaFrame` from
`hooks/use-wordpress-media.ts` — that module's body-level capture guard is what
stops React Aria dialogs from stealing focus from the WordPress modal, and it is
unaffected by this change.

`global.d.ts`'s `WpMediaFrame` gains `off` and an optional `modal?: { el? }`.
Both are used today, typed only in a local shadow type inside `media-selector.tsx`.

### `MediaPicker` gets an `onRequestOpen` escape hatch

`variant-thumbnail-selector.tsx` does **not** open a normal single-select frame.
It opens `frame: 'post', state: 'gallery-edit'` with `multiple: true`, resets the
library from `galleryIds`, overrides the toolbar's insert button, and returns both
the selected item and the whole gallery. That logic is specific to the variants
matrix and is not being redesigned here.

`MediaPicker` therefore accepts an optional `onRequestOpen` that replaces the
default `useMediaLibrary().open()`. The variants selector supplies its existing
`openGalleryFrame` and reuses the picker's presentation and drop behaviour. This
is what makes deleting `ui/placeholder.tsx` — whose last consumer that selector
is — possible without touching the variants data flow.

This is a real escape hatch with a named consumer, not the "rendering escape
hatch" that `form-field-binding` forbids: it substitutes *how the library opens*,
not what the surface renders.

### Validation is client-side and reported inline

MIME is checked before any request, and a multi-file drop onto a single-item
surface takes the first rather than failing. Byte size is **not** checked
client-side: the real limit lives in `php.ini`/`upload_max_filesize` and hardcoding
a mirror of it would drift. The server stays the authority and its rejection is
rendered the same way.

Failures render through `FieldError` inside the field envelope rather than a
`sonner` toast, so a rejected drop reads like every other validation message and
stays attached to the control that caused it.

### Upload feedback is indeterminate

A `Spinner` over the dropzone with drops and clicks blocked, not a progress bar.
`ui/progressbar.tsx`'s current API is built for an interactive slider, not a
readout, and a determinate bar for a single image is over-engineering for the
sizes involved. Blocking interaction while in flight also prevents a second
upload racing the first into a single-item slot.

*Rejected:* an optimistic `URL.createObjectURL` preview. It feels faster but
requires blob lifecycle cleanup and a rollback path on failure, for a perceived
gain measured in the length of one image upload.

### Video is previewed by its poster

`MediaRef` carries `poster`, `mediaId()` already emits `{ id, poster }` for video,
and `utils/media.ts` already exports `isVideoObject`. Rendering `poster.url` when
the held value is a video costs one branch in the preview path and reuses
machinery that exists, rather than rendering a video file into an `<img>`.

## Risks / Trade-offs

- **Large unguarded migration surface: 27 `Thumbnail` sites with no test coverage.**
  → Keeping the size/shape vocabulary makes each edit mechanical rather than a
  judgement call. `npm run typecheck` catches every prop rename because the props
  are a closed union. Residual risk is purely visual, and the user confirms the
  result — per `CLAUDE.md` §0 there is no browser verification in this project.
- **`wp/v2/media` and `wp.media` return different shapes.** → One normalizer in
  `services/media.ts`, covered by a test, is the only place that knows. Everything
  downstream sees `MediaRef`.
- **Upload depends on a nonce that expires** (12–24h). A stale admin tab gets a
  403 on upload. → Surfaced as a normal upload error in the field. Not worth a
  refresh mechanism; browsing the library, the primary path, is unaffected.
- **Rebuilding the `wp.media` frame lifecycle touches fragile, untyped territory.**
  → The lazy hook is strictly simpler than what it replaces (no cross-effect
  toggler), and the focus-guard module it depends on is untouched. `media-gallery`
  and the variants selector migrate onto it in the same change, so all three
  consumers are exercised together.
- **Deleting five components at once could orphan an export.** → `knip` is already
  configured at `resources/app/knip.json`; running it after the deletion group
  catches stragglers that `tsc` would not.
- **`srcSet` picks a smaller variant than a caller expects** if the rendered box
  is sized by CSS the browser cannot see at parse time. → Named sizes emit an
  explicit `sizes` hint; `fullWidth` falls back to the original.

## Migration Plan

Sequenced so nothing is deleted before its replacement exists and every call site
has moved:

1. `assets/placeholder.svg` + `ui/image.tsx` + test. Nothing consumes it yet.
2. `hooks/use-media-library.ts` + `services/media.ts` + `global.d.ts` types.
   `MediaSelector` still exists and still works.
3. `components/media-picker.tsx` + `components/form/media-field.tsx` + tests.
4. Migrate the 6 `ThumbnailField` call sites, unwinding preview state.
5. Migrate the 27 `Thumbnail` and 6 `<img>` sites; move `media-gallery.tsx` and
   `variant-thumbnail-selector.tsx` off `MediaSelector` and `Placeholder`.
6. Delete `thumbnail-field.tsx`, `thumbnail-selector.tsx`, `ui/thumbnail.tsx`,
   `ui/placeholder.tsx`, `media-selector.tsx`, the `ThumbnailPlaceholder` export
   and the `ThumbnailSize`/`ThumbnailType` types. Run `knip`.

Each group ends with `npm run typecheck && npm test` from `resources/app/`.

Rollback is a revert: no data migration, no schema change, no persisted format
change. What is stored in the database is identical before and after — only what
transits react-hook-form's in-memory state differs.
