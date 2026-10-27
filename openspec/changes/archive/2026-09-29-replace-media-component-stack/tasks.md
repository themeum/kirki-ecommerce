> All paths are relative to `resources/app/`. No form schema changes are part of
> this change — `mediaId()` and the offline-payment / email-template transforms
> already accept a complete media reference, so no payload tests need updating.
> Every group ends with `cd resources/app && npm run typecheck && npm test`.

## 1. Image primitive

- [x] 1.1 Add `assets/placeholder.svg` — a mock neutral image-placeholder glyph, sized to scale into any box. Record in the file's comment that it is a placeholder awaiting the real artwork.
- [x] 1.2 Create `components/ui/image.tsx` following the `components/ui/badge.tsx` idiom: `forwardRef`, props destructured in the body, `data-slot="image"`, `displayName`, default export, `const styles = defineStyles({...})` at the bottom, theme tokens only. Props: `src?: MediaRef | string | null`, `size?: 'xsm' | 'small' | 'md' | 'fullWidth'`, `shape?: 'square' | 'circle'`, `fit?`, `fallbackSrc?`, `showSkeleton?`, `cssOverride?`, plus `Omit<ComponentPropsWithoutRef<'img'>, 'className' | 'css' | 'src'>`.
- [x] 1.3 Implement source resolution: accept a `MediaRef` or a plain URL, treat null/empty/bare-number as empty, and default `alt` to `media.alt` when the caller gives none.
- [x] 1.4 Implement responsive candidates — build `srcSet` from `MediaRef.sizes` as `${url} ${width}w` with a `sizes` hint derived from the named size; fall back to the single `url` when there are no generated sizes or the source is a string.
- [x] 1.5 Implement loading and failure states: `Skeleton` overlay while in flight (suppressible via `showSkeleton`), opacity fade on load, `fallbackSrc` on error or empty, and reset the error state when `src` changes.
- [x] 1.6 Default to `loading="lazy"` and `decoding="async"`, both overridable by the caller.
- [x] 1.7 Compose styles as `scopedMerge(styles.base, styles.sizes[size], styles.shapes[shape], cssOverride)` with sizes 16 / 32 / 40 / 100% matching today's `ThumbnailSize`, and make the circular shape apply to the fallback and skeleton as well as the image.
- [x] 1.8 Write `components/ui/image.test.tsx`: renders a string source; renders `fallbackSrc` after an `error` event; derives `srcSet` from a `MediaRef.sizes` map; takes `alt` from `media.alt`; applies `size` and `shape`; retries after `src` changes post-failure.
- [x] 1.9 Run `cd resources/app && npm run typecheck && npm test`.

## 2. Media library access and upload

- [x] 2.1 Extend `global.d.ts`'s `WpMediaFrame` with `off(event)` and optional `modal?: { el?: HTMLElement }`, and move `AcceptedMediaTypes` there so it is genuinely in scope for `WpMediaFactory` (today it is declared locally in `media-selector.tsx`).
- [x] 2.2 Create `hooks/use-media-library.ts` exporting `useMediaLibrary({ title?, buttonText?, multiple?, types?, onSelect }) => { open }`. Build the frame lazily inside `open()` with current handlers and tear it down after, so no frame exists until someone asks. Keep calling `openWpMediaFrame` / `closeWpMediaFrame` from `hooks/use-wordpress-media.ts`.
- [x] 2.3 Export the hook from `hooks/index.ts` alongside the existing entries.
- [x] 2.4 Create `services/media.ts` with `uploadMedia(file: File): Promise<MediaRef>` — an absolute-URL axios `POST` of `FormData` to `${window.kirki_ecommerce.site_url}/wp-json/wp/v2/media` carrying `X-WP-Nonce` and `Content-Disposition`. It must bypass `apiClient` and must not use `parseData`/`parseResponse`, which assume the plugin's `{ data }` envelope.
- [x] 2.5 In the same file, normalize the core REST response onto `MediaRef`: `source_url` → `url`, `media_details.sizes` → `sizes`, `alt_text` → `alt`, `mime_type` → `mime`, and carry `id`, `title`, `filesize`, `width`, `height` across.
- [x] 2.6 Write `services/media.test.ts` covering the normalizer for a representative core response, including one with no generated sizes.
- [x] 2.7 Add an MSW handler for `wp/v2/media` under `tests/msw/handlers` so component tests can exercise the upload path.
- [x] 2.8 Run `cd resources/app && npm run typecheck && npm test`.

## 3. Media picker and bound field

- [x] 3.1 Create `components/media-picker.tsx` with props `value?: MediaRef | string | null`, `onChange: (media: MediaRef | null) => void`, `onRequestOpen?`, `accept?`, `placeholder?`, `btnText?`, `size?: 'small' | 'fullWidth'`, `disabled?`, `error?`, `onError?: (message: string) => void`.
- [x] 3.2 Build the empty state to match the screenshot: dashed `theme.colors.border.gallery` box on `placeholderSurface`, a ghost `Upload image` button carrying the existing `CloudUpload` icon, and `Drag and drop, or upload image` subtext in secondary text.
- [x] 3.3 Build the filled state: the item previewed through `Image` in the padded box, with a hover overlay carrying ghost Replace and Remove buttons — the behaviour `Thumbnail size="fullWidth"` has today. Preview `poster.url` when `isVideoObject(value)` (`utils/media.ts`).
- [x] 3.4 Implement the dropzone with native `onDragEnter` / `onDragOver` / `onDragLeave` / `onDrop`, using a depth counter so nested children do not flicker the active state, `preventDefault` on dragover, and an active-state border. Read files from `dataTransfer.files`.
- [x] 3.5 Implement pre-upload checks: reject a file whose MIME is outside `accept` before any request and report via `onError`; take the first file when several are dropped. Do not check byte size client-side — the server is the authority.
- [x] 3.6 Implement the upload flow: `Spinner` over the zone while in flight, drops and open-requests ignored until it settles, `onChange` with the normalized `MediaRef` on success, `onError` with the server's message on failure and the previous value left intact.
- [x] 3.7 Wire browsing through `useMediaLibrary`, and let `onRequestOpen` replace it when supplied.
- [x] 3.8 Create `components/form/media-field.tsx` per `openspec/specs/form-field-binding/spec.md` and `components/form/text-field.tsx`: two generics, `useFormContext<TFieldValues>()`, `const fieldId = String(name)`, `Controller`, and the `Field` → `FieldLabel` → control → `FieldDescription` → `FieldError` envelope with `data-invalid={fieldState.invalid || undefined}`. Props: `name`, `label?`, `description?`, `infoText?`, `placeholder?`, `btnText?`, `size?`, `accept?`, `disabled?`, `cssOverride?`.
- [x] 3.9 Have the field write the complete `MediaRef` via `field.onChange`, and merge picker errors from `onError` into the rendered `FieldError` alongside `fieldState.error`.
- [x] 3.10 Write `components/media-picker.test.tsx`: a non-image drop is rejected with no request made; a valid drop uploads and emits a `MediaRef`; Remove emits `null`; a multi-file drop takes the first; interactions during an upload are ignored. **Course correction:** the MSW handler no longer calls `request.formData()` — doing so crashes (`webidl.is.File` assertion in undici's multipart parser) when the request originates from axios's XHR adapter under jsdom (picked because jsdom provides `window`/`XMLHttpRequest`), as opposed to `services/media.test.ts`'s plain `.test.ts` file which runs in the node project and uses axios's node adapter, where undici's own FormData serialization round-trips cleanly. The "first file wins" assertion was changed from inspecting the uploaded filename to asserting exactly one upload occurs, since the response can no longer echo the request body.
- [x] 3.11 Write `components/form/media-field.test.tsx` using `tests/form-field-harness.tsx`: writes the full `MediaRef` into form state, previews from a hydrated object, previews from a bare URL string, and surfaces an injected error.
- [x] 3.12 Run `cd resources/app && npm run typecheck && npm test`.

## 4. Migrate the bound thumbnail fields

Each of these swaps `ThumbnailField` for `MediaField` and deletes the local preview `useState`, its initial-URL helper, and the `valueAs` / `previewUrl` / `onPreviewChange` / `getPreviewUrl` props. Form schemas are untouched.

- [x] 4.1 `features/brands/components/brand-add-edit-dialog.tsx` — also delete `getInitialLogoUrl`.
- [x] 4.2 `features/categories/components/category-add-edit-dialog.tsx`.
- [x] 4.3 `features/collections/pages/collection-details.tsx` — also unwind the preview hydration effect.
- [x] 4.4 `features/settings/general/pages/store-contact-details.tsx`, and remove the `storeLogoUrl` / `onStoreLogoPreviewChange` prop pair it receives from `features/settings/general/pages/general-settings.tsx`.
- [x] 4.5 `features/settings/payment/pages/offline-payment-dialog.tsx` — the schema's union already unwraps `.url`, so the string-passthrough `getPreviewUrl` is no longer needed.
- [x] 4.6 `features/settings/email/pages/edit-template.tsx` — drop the local duplicate of `resolveLogoUrl` at the top of `features/settings/email/schemas/forms/email-template-form.ts` only if it becomes unreferenced; leave the exported one in `features/settings/email/lib/template.ts`, which is under test.
- [x] 4.7 Confirm each migrated form still submits the same payload by exercising its existing schema test; add none, since no schema changed.
- [x] 4.8 Run `cd resources/app && npm run typecheck && npm test`.

## 5. Migrate display call sites to the image primitive

- [x] 5.1 Migrate the five table column files — `features/{brands,categories,collections,customers,products}/components/*-table/columns.tsx` and `features/inventory/components/inventory-table/columns.tsx` — mapping `size` across unchanged, `type="circle"` → `shape="circle"`, `style={{height,width}}` → `width`/`height`, and `src={x?.url}` → `src={x}` where a `MediaRef` is in hand.
- [x] 5.2 Migrate `components/media-stack.tsx` (4 render sites).
- [x] 5.3 Migrate the customer surfaces: `features/customers/components/customer-profile-card.tsx`, `features/customers/components/fields/customer-selection-field.tsx`, `features/orders/pages/order-create/components/customer/customer-summary.tsx`.
- [x] 5.4 Migrate the order and product-selection surfaces: `features/orders/pages/order-details/items-table.tsx`, `features/orders/pages/order-create/components/order-item/order-item-row.tsx`, `features/products/components/shared/select-products-dialog/product-picker-row.tsx`, `features/coupons/components/fields/product-selection-field.tsx`.
- [x] 5.5 Migrate the product form surfaces: `features/products/components/product-form/sections/right-panel/brand.tsx`, `.../seo-settings/schema-preview.tsx`, `.../seo-settings/search-engine-preview.tsx`, and `features/collections/pages/collection-details.tsx`'s SEO preview.
- [x] 5.6 Migrate `.../seo-settings/social-share-preview.tsx` from its hand-rolled `<img>` + placeholder branch to `Image`, matching how its sibling previews now render.
- [x] 5.7 Migrate the payment icon sites — `features/settings/payment/pages/{online-payment-list,online-payment-dialog,offline-payment}.tsx` — and delete the duplicated `getIconUrl` helpers now that `Image` handles an absent or unusable source. Keep `offline-payment.tsx`'s `BankIconLarge` as an explicit fallback branch if it must stay a component rather than a `fallbackSrc`.
- [x] 5.8 Migrate `components/media-gallery.tsx`'s two `<img>` tiles to `Image`, and move its add-tile from `MediaSelector` to `useMediaLibrary`. Do not add drop-upload to the gallery.
- [x] 5.9 Migrate `features/products/components/product-form/sections/variants/variants-table/variant-thumbnail-selector.tsx` onto `MediaPicker`, passing its existing `openGalleryFrame` as `onRequestOpen` so the `frame: 'post'` / `state: 'gallery-edit'` session and the gallery return value are unchanged. This removes its last use of `Placeholder` and `Thumbnail`.
- [x] 5.10 Migrate `features/bulk-edit/pages/bulk-edit-table/single-row.tsx` from `ThumbnailSelector` to `MediaPicker` with `size="small"`.
- [x] 5.11 Leave `features/settings/essentials/pages/barcode-generation.tsx` alone and note in the change that its hardcoded `kirki-ecommerce.test` URL is a separate pre-existing bug. **Confirmed left untouched** — flagged as a pre-existing bug, out of scope for this change.
- [x] 5.12 Run `cd resources/app && npm run typecheck && npm test`.

## 6. Delete the replaced stack

- [x] 6.1 Delete `components/form/thumbnail-field.tsx`, `components/thumbnail-selector.tsx`, `components/ui/thumbnail.tsx`, `components/ui/placeholder.tsx` and `components/media-selector.tsx`.
- [x] 6.2 Delete the `ThumbnailPlaceholder` export from `icons.tsx`.
- [x] 6.3 Delete `ThumbnailSize` and `ThumbnailType` from `types/components/common.ts` and their entries in the trailing `export type` block.
- [x] 6.4 Remove the now-unused `MediaItem = Omit<MediaRef, 'id'> & { id?: string | number }` re-declarations that the deleted files carried, and confirm the survivors in `media-gallery.tsx` still typecheck. **Note:** the deleted files' own declarations went with them; the two remaining declarations (`media-gallery.tsx`, `hooks/use-media-library.ts`) are still actively used and are not orphans — left as-is.
- [x] 6.5 Run `npx knip` from `resources/app/` and clear anything it reports as newly unreferenced.
- [x] 6.6 Run `cd resources/app && npm run typecheck && npm test`.
