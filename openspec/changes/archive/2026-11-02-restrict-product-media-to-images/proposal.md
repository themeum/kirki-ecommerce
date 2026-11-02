# Proposal

## Why

Product media (gallery, variant image, `og_image`) is meant to hold images only.
Today nothing enforces this. The API accepts any WordPress attachment ID for
`media.*`, `variants.*.media` and `og_image`, so audio, video or documents can be
saved on a product. The admin gallery only filters the media library view; the
WordPress upload tab still lets a person upload other file types.

We want images only for now, and we want to allow other types (video first) later
by changing one list, not by rewriting validation.

## What Changes

- Add a server-side validation rule that checks the MIME type of an attachment ID.
  It takes a list of accepted types. A bare type such as `image` matches `image/*`;
  a full MIME type such as `application/pdf` matches exactly.
- Apply the rule to `media.*`, `variants.*.media` and `og_image` in the product
  create and update requests, with the accepted list set to images only.
- Keep the accepted list for product media in one place, so a later change to
  allow `video` is a one-line edit.
- Create and update validate the same way. A request that carries a non-image
  attachment ID is rejected with a validation error and nothing is saved.
- Data already stored is not migrated or cleaned.
- Make the gallery media surface take an explicit `accept` prop (default
  `['image']`) and pass it to the media library.
- The WordPress modal upload tab is not blocked. The server rule is the guard.

**BREAKING** for API clients and for old products: a request that sends a
non-image attachment ID now gets a 422. A product that already holds a video or
audio item cannot be saved until that item is removed from the request.

## Capabilities

### New Capabilities

- `product-media-types`: which attachment types a product's media fields accept,
  and how the server checks them on create and update.

### Modified Capabilities

- `product-form`: the "Media gallery in form state" requirement now states that
  the gallery accepts image types only, with the accepted types configurable by
  the surface.

## Impact

- Backend: new `app/Rules/AttachmentRule.php` (extends the framework
  `ValidationRule`); `ProductCreateRequest`, `ProductUpdateRequest`; one constant
  for accepted product media types. No framework (`vendor/libraries/framework`)
  edits.
- Frontend: `resources/app/components/media-gallery.tsx`,
  `resources/app/components/form/media-gallery-field.tsx`.
- Tests: PHP tests for the rule and both requests; Vitest for the gallery prop.
- Docs: a short section in the product docs, including how this differs from the
  `AcceptedMediaTypes` handling in `MediaPicker`.
