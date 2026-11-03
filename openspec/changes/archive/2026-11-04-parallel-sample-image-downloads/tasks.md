## 1. Framework dependency

- [x] 1.1 Confirm that `composer.lock` has `themeum/framework` 3.3.0, and that `vendor/libraries/framework/src/Http/Client/Pool.php` exists and is scoped (`Kirki\Ecommerce\Framework\Http\Client`), with `\WpOrg\Requests\*` and `\WP_Http` left global
- [x] 1.2 Verify: `bash kirki-ecommerce-test integration` passes with no code change (single requests behave as before); run `npm run typecheck && npm test` in `resources/app/`

## 2. MediaImporter: download many images in one pool

- [x] 2.1 Move the store steps of `import_url()` (`wp_upload_bits` → `create_attachment` → `generate_metadata` → source meta) into a protected `store(string $url, string $contents)` that returns `int|null`
- [x] 2.2 Add `const CONCURRENCY = 25` and `import_urls(array $urls, string $base_url): array` (design §1): remove duplicate URLs, reuse `find_existing()` hits with no request, give `null` to untrusted URLs with no request, send the others in one `Http::pool()` (`$pool->as($url)->timeout(15)->get($url)`, `['concurrency' => static::CONCURRENCY]`), then `store()` each successful non-empty body in URL order; a failed or empty response gives `null`
- [x] 2.3 Make `import_url()` call `import_urls([$url], $base_url)[$url]`; update the docblocks (`@since 1.0.0`, as in the rest of the file)
- [x] 2.4 Add `tests/Integration/MediaImporterTest.php` (stub with `pre_http_request`): several URLs give one attachment each, with the source meta; a URL listed two times is requested one time; an earlier imported URL is not requested and gives the existing id; an untrusted URL is not requested and gives `null`; a `WP_Error` and a 404 give `null` and do not change the other results; an empty list gives `[]` with no request
- [x] 2.5 Verify: `bash kirki-ecommerce-test integration --filter=MediaImporterTest`; phpcs on `app/Setup/MediaImporter.php` and the new test (`phpcs-wporg.xml.dist` with the docblock sniff); run `npm run typecheck && npm test` in `resources/app/`

## 3. ProductSeeder: prefetch the images before the product loop

- [x] 3.1 In `ProductSeeder::run()`, after the categories and tags, collect the image filenames of each product that `exists()` does not skip (`images` and every non-null `variants[].image`), build the URLs with `PresetRepository::get_image_url()`, and fill `$this->attachments` from one `import_urls()` call (design §2)
- [x] 3.2 Keep `import($filename)` reading `$this->attachments`, with its current `import_url()` fallback for a URL that is not in the cache
- [x] 3.3 Add tests to `StorePresetsTest`: every image request of a load happens before the first product is created (check `Product::query()->count() === 0` inside a `pre_http_request` filter for `/images/` URLs); each image URL is requested one time; a second load requests no image; a product that the store already has (by SKU) gets no image request; the existing tests (`test_sample_data_loads_the_industry_products_linked_by_slug` with 4 images for the tote, `test_failed_images_still_create_the_products`) still pass
- [x] 3.4 Verify: `bash kirki-ecommerce-test integration`; phpcs on `app/Setup/ProductSeeder.php` and `tests/Integration/StorePresetsTest.php`; run `npm run typecheck && npm test` in `resources/app/`

## 4. Docs and timing

- [x] 4.1 Update `docs/onboarding.md` §5: step 4 becomes a step before the product loop ("downloads the images of all the products to create, up to 25 at the same time"); keep the reuse and failure rules; change the "PHP time limit on slow image downloads" note to match
- [x] 4.2 Record the measured time of `POST /onboarding/sample-data` before and after in design.md (clear the earlier sample attachments first, so the images are downloaded); if the result differs from the design, add a "Correction during implementation" note
- [x] 4.3 Verify: `openspec validate parallel-sample-image-downloads --strict`; run `npm run typecheck && npm test` in `resources/app/`
