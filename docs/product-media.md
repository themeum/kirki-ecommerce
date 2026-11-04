# Product Media Types

Which files a product's media fields accept. A product's gallery, each
variant's image and the product's social-share image (`og_image`) take
**images only**. Anything else (video, audio, documents) is rejected when the
product is saved.

The check runs on the server, so it holds for the admin app and for any API
client. Section 5 explains the one thing it does not stop.

- [1. Quick start](#1-quick-start)
- [2. What is checked](#2-what-is-checked)
- [3. How a type is matched](#3-how-a-type-is-matched)
- [4. Old products that already hold a video](#4-old-products-that-already-hold-a-video)
- [5. What this does not block](#5-what-this-does-not-block)
- [6. Allowing another type](#6-allowing-another-type)
- [7. Where this differs from WooCommerce](#7-where-this-differs-from-woocommerce)

---

## 1. Quick start

Nothing to configure. In the product form, the gallery's **Add images** button
opens the WordPress media library showing images only. If a request sends the
ID of a video, the product is not saved and the API answers **422**:

```json
{
  "message": "Validation failed!",
  "errors": { "media.0": ["The selected file must be of type: image."] },
  "success": false
}
```

The key names the field: `media.0` is the first gallery item, `og_image` is the
social-share image, and `variants.0.media` is the first variant's image.

---

## 2. What is checked

| Field | Sent as | Checked |
|---|---|---|
| `media.*` | Attachment IDs, in display order | Each ID |
| `variants.*.media` | One attachment ID, or `null` | When not `null` |
| `og_image` | One attachment ID, or `null` | When not `null` |

Create and update run the same check. A request with one bad ID is rejected as
a whole and nothing is saved. An ID that is not an attachment at all (a post, a
deleted file, `0`) fails with "The selected file does not exist."

---

## 3. How a type is matched

The accepted list holds **types**. A type is one of:

- A bare type such as `image`. It matches every subtype: `image/jpeg`,
  `image/png`, `image/webp` and so on.
- A full MIME type such as `application/pdf`. It matches that type exactly.

`image` does not match `imagery/x`: a bare type matches only up to the `/`.

---

## 4. Old products that already hold a video

Stored data is not changed. A product saved before this check may still hold a
video or audio file.

Such a product **cannot be saved** while the request still lists that file. The
update is rejected with the same 422, naming the field, until the file is
removed from the payload. In the admin app the gallery still lists the item, so
the merchant removes it and saves. The item may not preview correctly: the
gallery draws every item as an image.

---

## 5. What this does not block

The check applies when a product is saved. It does not stop a file from being
**uploaded** to the WordPress media library. The **Upload files** tab of the
media modal still accepts any file type WordPress allows. A non-image can be
uploaded there, but it cannot be attached to a product.

---

## 6. Allowing another type

The accepted list is one constant, `ProductMediaTypes::ALLOWED` in
`app/Constants/Product/ProductMediaTypes.php`:

```php
const ALLOWED = ['image'];
```

To allow video as well, change it to `['image', 'video']`. Every product media
field follows. The admin gallery takes the list as the `accept` prop of
`MediaGallery` (default `['image']`), so the front end needs the same change
at its call site.

The rule itself is `App\Rules\AttachmentRule`. Use it on any other field that
holds an attachment ID:

```php
'cover' => ['integer', 'nullable', AttachmentRule::of(['image'])],
```

---

## 7. Where this differs from WooCommerce

- **Same intent.** WooCommerce's product gallery is also images only, and its
  REST API refuses an ID that is not an image. We do the same on every media
  field, not only the gallery.
- **Status code.** WooCommerce answers **400** with an "invalid image ID"
  error. A rejected ID here answers **422** with errors keyed by field
  (`media.0`), the way every other validation failure here does.
- **Not configurable in the UI.** The accepted list is a code constant. There
  is no setting and no filter hook yet.
- **No exception for stored data.** A product that already holds a video must
  drop it before it can be saved. Nothing grandfathers existing items.
- **Uploads are not restricted.** The media modal's upload tab still takes any
  allowed file type. Only attaching to a product is checked.
