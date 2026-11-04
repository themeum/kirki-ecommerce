## Why

**Load sample data** (`POST /onboarding/sample-data`) takes about 50–60 s. It
downloads the 22 sample images of an industry from S3 one after the other. Each
download needs a new TCP and TLS connection to `us-east-1`, and takes about 2 s
(measured from the dev container: 2.24 s for a 77 KB image). PHP and database work
is about 1–2 s of the total. `themeum/framework` 3.3.0 adds `Http::pool()`, which
sends many requests at the same time through the WordPress HTTP API. With it, the
images can download in about the time of the slowest one.

## What Changes

- Before it creates the products, the sample data import downloads, in one
  `Http::pool()` call, the images of all the products that it will create (product
  images and variant images, each URL one time).
- The pool sends up to 25 requests at the same time. Each request keeps the
  current 15 s timeout.
- Images that an earlier load already imported (matched by source URL) are reused
  and not requested. Untrusted URLs are not requested, as now.
- After the downloads, each image is written to the uploads folder and registered
  as an attachment, with its image sizes, one by one, as now.
- A failed image download gives no attachment for that image only. The product is
  still created with its other images, as now.
- The products of a SKU that the store already has are skipped as now, and their
  images are not downloaded.
- `composer.lock` requires `themeum/framework` 3.3.0 (already updated in the
  working tree).
- No change to the REST API, the response, the data files or the UI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `onboarding-seed-data`: adds a requirement that sample data loading downloads
  the images of the products it creates together, in parallel, before it creates
  the products.

## Impact

- **Code**: `app/Setup/MediaImporter.php` (a new method that imports many URLs with
  `Http::pool()`), `app/Setup/ProductSeeder.php` (it collects the image URLs of the
  products to create and imports them before the product loop).
- **Tests**: `tests/Integration/StorePresetsTest.php`, and a new test for
  `MediaImporter`. `ServesPresetData` stubs requests with `pre_http_request`, and
  the pool applies that filter, so the stubs still work.
- **Dependencies**: `themeum/framework` ^3.3.0 (`Http::pool()`).
- **Docs**: `docs/onboarding.md` §5 (the import steps and the note about slow
  downloads).
- **Network**: up to 22 connections to the preset host at the same time, during
  one request.
