# Design

## Context

See proposal.md for motivation. Current state:

- `media.*`, `variants.*.media` and `og_image` are validated as `integer` only
  (`ProductCreateRequest`, `ProductUpdateRequest`). `ProductService` syncs the IDs
  without looking at the attachment.
- `MediaGallery` calls `useMediaLibrary({ multiple: true })`, which defaults to
  `types: ['image']`. WordPress applies `library.type` as a view filter only, so
  the modal upload tab can still upload other types; they just cannot be selected.
  The server is therefore the only real guard.
- The framework (`vendor/libraries/framework`) resolves string rules through
  `method_exists(Rule::class, ...)` and has no extend/alias hook. We must not edit
  it. It does accept `ValidationRule` instances and closures inside a rule array
  (`OrderPartialRequest` already mixes a `Rule::` object with strings).
- No custom `ValidationRule` exists in `app/` yet.

## Goals / Non-Goals

**Goals:**

- Reject non-image attachment IDs on all three product media fields.
- Make allowing another type a one-line change.

**Non-Goals:**

- Cleaning or migrating existing data. Old products that hold a video must have it removed before they can be saved.
- Blocking uploads inside the WordPress modal.
- Rendering videos or audio in the gallery.
- Adding a `Rule::attachment()` string rule upstream in `themeum/framework`.
  Possible later; the rule class below keeps the same arguments so the switch is small.

## Decisions

### D1. A custom `ValidationRule` in `app/Rules/`, not a string rule

`app/Rules/AttachmentRule.php` extends the framework `ValidationRule`. It is used as
an object in the rule array, with a static factory so call sites read close to the
string form:

```php
'media.*' => ['integer', AttachmentRule::of(ProductMediaTypes::ALLOWED)],
```

`validate()` reads the ID from `$this->value`, loads its MIME type with
`get_post_mime_type()` and checks it against the list. It also fails when the ID
is not an attachment (`get_post_type() !== 'attachment'`).

Alternatives:
- *String rule `attachment:image`* – needs a new `Rule::attachment()` in the framework
  package; a vendor edit is lost on `composer scope`. Rejected for now.
- *Closure rule* – works, but would be repeated in two requests and three fields,
  and is harder to unit test. Rejected.
- *`Rule::image()` / `Rule::file()`* – these validate uploaded files, not attachment
  IDs. Not applicable.

### D2. Matching: bare type = prefix, full MIME = exact

A type without `/` (for example `image`) matches `image/*`. A type with `/`
(for example `application/pdf`) matches exactly. This mirrors `MIME_MATCHERS` in
`media-picker.tsx`, so the front and back ends read the same list.

### D3. One allowed list

A constant (`app/Constants/Product/ProductMediaTypes.php`, `ALLOWED = ['image']`) is
the only place that names the accepted types. Both requests read it. Allowing video
later is `['image', 'video']`.

### D4. Create and update use the same rule

Both requests add the same `AttachmentRule::of(ProductMediaTypes::ALLOWED)` to the
same three fields. There is no exemption for attachments a product already holds:
validation is simple, the error names the field, and nothing is saved on failure.

Alternative: skip IDs the product already holds, so old products stay editable.
Rejected by the product owner; a product holding a video must have it removed to
be saved.

### D5. Frontend: explicit `accept` prop, no new filtering

`MediaGallery` and `MediaGalleryField` get `accept?: AcceptedMediaTypes[]`
(default `['image']`), forwarded to `useMediaLibrary({ types: accept })`. This changes
no behavior today; it makes the intent visible and matches `MediaPicker`.

## Risks / Trade-offs

- [An old product that holds a video cannot be saved until the video is removed] → Intended. The error names the field. The frontend gallery can still show and remove the item.
- [An API client posting a video now gets 422] → Intended; documented in the product docs.
- [Extra queries: one `get_post_mime_type` per ID] → WordPress caches post objects; a gallery has few items. If it shows in profiling, prime the cache with one `_prime_post_caches()` call in the rule.
- [Upload tab still uploads non-images to the media library] → Accepted; they cannot be attached to a product.

## Migration Plan

No data migration. Deploy backend and frontend together; either side alone is safe
(the frontend prop defaults to current behavior; the backend rule only adds rejection).
Rollback is a revert.
