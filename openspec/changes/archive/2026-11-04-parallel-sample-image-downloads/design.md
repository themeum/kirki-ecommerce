## Context

See proposal.md (Why) for the timing. Current flow, per product, in
`ProductSeeder::run()`:

```
exists? -> ensure_attribute_values -> make_product_data
                                         +-> import(file) -> MediaImporter::import_url()
                                               find_existing -> is_trusted -> Http::get (15 s)
                                               -> wp_upload_bits -> wp_insert_attachment
                                               -> wp_generate_attachment_metadata -> source meta
           -> make_variant_data -> import(variant image)
           -> CreateProductAction::execute (transaction)
```

`ProductSeeder::$attachments` caches `url => id|null` for one request, so each
URL is imported one time. `MediaImporter::import_url()` returns `null` on every
failure and never throws.

`themeum/framework` 3.3.0 adds `Http::pool(callable, ['concurrency' => n])`. Each
pooled request is a normal `Request` (with `timeout()` and so on). The pool sends
them with `WpOrg\Requests\Requests::request_multiple()` and applies what
`WP_Http::request()` applies (including `pre_http_request`, `http_request_args`,
URL checks and `http_response`). It returns `Response` objects keyed like the
requests. A failed request is a `Response` around a `WP_Error`.

## Goals / Non-Goals

**Goals:**

- Download the images of one load in parallel, in one pool call.
- Keep every current rule: reuse by source URL, the trusted-URL check, the 15 s
  timeout, failure gives `null`, products are created without failed images.

**Non-Goals:**

- Parallel image-size generation, or fewer image sizes.
- Moving the import to a queued job, a CDN, smaller images, or caching
  `presets.json` (the other options from the analysis).
- Any change to the REST response or the UI.

## Decisions

### 1. Split `MediaImporter` into "download many" and "store one"

Add `MediaImporter::import_urls(array $urls, string $base_url): array`, which
returns `array<string, int|null>` keyed by URL:

1. For each unique URL, `find_existing()`. A hit gives its id. It is not requested.
2. An untrusted URL (`RemoteUrl::is_trusted()`) gives `null`. It is not requested.
3. The other URLs go into one `Http::pool()`. Each one is
   `$pool->as($url)->timeout(15)->get($url)`, with
   `['concurrency' => static::CONCURRENCY]` (`25`).
4. For each response in URL order: if `successful()` and the body is not empty,
   use the current store steps (`wp_upload_bits` → `create_attachment` →
   `generate_metadata` → source meta), moved into a protected
   `store(string $url, string $contents)`. Otherwise `null`.

`import_url()` stays, and calls `import_urls([$url], $base_url)[$url]`. This keeps
one code path, and the method stays usable for one image.

*Alternative:* pool inside `ProductSeeder` and pass bodies to `MediaImporter`.
Rejected: the HTTP and reuse rules belong in `MediaImporter`, and the seeder should
not know about responses.

### 2. Prefetch in `ProductSeeder::run()` before the product loop

After the categories and tags, `run()` collects the image filenames of each
product that `exists()` does not skip: `images` plus every non-null
`variants[].image`. It builds the URLs with `PresetRepository::get_image_url()`,
removes duplicates, and calls `import_urls()` one time. The result fills
`$this->attachments`. `import($filename)` then reads the cache. Its current
fallback to `import_url()` stays for a URL that is not in the cache.

`exists()` then runs two times for each product (in the prefetch and in the loop).
It is one indexed `where_in` on SKU for each product, 5 queries in total.

*Alternative:* one pool for each product (4–5 images). Rejected: 5 sequential
batches of about 2 s each, about 10 s, against about 2–3 s for one batch.

### 3. Concurrency 25

The user chose 25. Every industry names 22 images, so a load is one batch. The
response bodies stay in memory until stored: at most about 3.6 MB for an industry.
`CONCURRENCY` is a class constant, not a setting.

### 4. Attachments before products

Images are now stored before the products are created. If a product then fails,
or the request ends early, its attachments stay in the media library with the
source meta. The next load reuses them through `find_existing()`. No cleanup is
added. The current flow can leave attachments in the same way when
`CreateProductAction` fails after `make_product_data()`.

## Risks / Trade-offs

- [A host limits outgoing connections, or has no cURL] → `request_multiple()` then
  sends the requests one after the other, with the same results. That is the speed
  of today, not worse.
- [22 connections at the same time to the preset host] → S3 handles this easily.
  A self-hosted `KIRKI_ECOMMERCE_PRESETS_URL` gets the same 22 requests in a
  shorter time.
- [The whole pool waits for the slowest image, up to the 15 s timeout] → Same
  limit as one request today. In the worst case the total time is about 15 s, not
  22 × 15 s.
- [Tests stub HTTP with `pre_http_request`] → The pool applies that filter for
  each request, so `ServesPresetData` and the failed-image test work as now. The
  task list runs them to confirm this.

## Migration Plan

No data migration. Deploy with `themeum/framework` 3.3.0 in `composer.lock`. To
roll back, revert the change. The 3.3.0 framework does not need to be reverted.

## Measured result

Measured on 2026-11-04 from the dev `php` container to the real bucket
(`us-east-1`), with the 22 Fashion images (`Http::timeout(15)`, Xdebug off):

| Download | Images OK | Time |
|---|---|---|
| One after the other (before this change) | 22/22 | 48.89 s |
| `Http::pool()`, concurrency 25 (this change) | 22/22 | 2.01 s |

Only the downloads were measured, with a script that stores nothing, so that the
merchant data of the dev site did not change. Storing the files and making the
image sizes adds about 1–2 s (measured earlier: about 0.06 s of GD resize for
each image). A full load is then about 4–5 s, as the design expected. No
correction is needed.
