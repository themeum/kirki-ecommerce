## 1. Source data restructure

- [x] 1.1 `git mv resources/data/preconfigured-data.json resources/data/preconfigured-data/presets.json`; set `version` to `2`
- [x] 1.2 Add an explicit, unique `slug` to every category node of every industry (for example `women-outerwear`, `men-outerwear`)
- [x] 1.3 Add a `tags` list (`{name, slug}`, about 6–10 tags) to each of the 15 industries
- [x] 1.4 Add the common or industry attribute values that the sample products will use and that are not in the presets yet (only where the products need them) (no additions needed: the products use only values that are already in the presets)
- [x] 1.5 Write `fashion-and-apparel/products.json` (version 1, design §4 shape) with 5 products that follow the CSV structure (a simple product, one with variants, one on sale, one with an order limit, one with stock levels), using the existing Fashion tree slugs, the Fashion tags and the placeholder images from `assets/images/products`
- [x] 1.6 Write `products.json` with 5 products for each of the other 14 industries, with the same five patterns, the industry's slugs, tags and attributes, and unique SKUs (`SMP-<IND>-...`)
- [x] 1.7 Write `general/products.json` with 5 products: no categories, no tags, only common attributes (Color)
- [x] 1.8 Verify: run `npm run typecheck && npm test` in `resources/app/`

## 2. Check and publish tooling

- [x] 2.1 Add `bin/lib/preset-data.js` with the checks from the `preset-data-publishing` spec (unique category and tag slugs per industry, product links resolve, attribute options resolve, general rules, at least 5 products, one default variant, unique SKUs across files, each image resolves to the product folder or `assets/images/products`); return a list of errors that name the file, the product and the value
- [x] 2.2 Add `bin/check-presets.js` and the root script `check:presets`; make it exit non-zero on any error; run it against the data from group 1 and fix the data until it passes
- [x] 2.3 Add `bin/publish-presets.js` and the root script `publish:presets`: run the checks, stage the upload tree with the image fallback, upload images, then `*/products.json`, then `presets.json` (JSON with `Content-Type: application/json` and a short `Cache-Control`); env `S3_ENDPOINT` (default local), `S3_BUCKET` (default `kirki-ecommerce`), `S3_PREFIX` (default `preconfigured-data`); reuse `bin/lib/load-env`
- [x] 2.4 Extend `s3-setup` in `docker-compose.payments.yml` to create the `kirki-ecommerce` bucket with an anonymous-read policy (reverted later: the product owner dropped the local preset bucket, see design §1)
- [x] 2.5 Verify: `npm run s3:up`, `npm run publish:presets`, then `curl` `presets.json`, one `products.json` and one image from `http://localhost:9000/kirki-ecommerce/preconfigured-data/...`; break one slug and confirm that the publish uploads nothing; run `npm run typecheck && npm test` in `resources/app/` (the AWS CLI is not installed on this machine; verified through a temporary Docker shim for `aws`. Node tests for the checks are in `bin/test/preset-data.test.js`)

## 3. Remote reading

- [x] 3.1 Define `KIRKI_ECOMMERCE_PRESETS_URL` in `kirki-ecommerce.php` (`defined() || define()`, default `http://host.docker.internal:9000/kirki-ecommerce/preconfigured-data`, `@todo` for the real URL)
- [x] 3.2 Move the trusted-URL rule to a shared support class; make `PaymentGatewayCatalog::is_trusted_url()` delegate to it; keep the payment tests green
- [x] 3.3 Rewrite `PresetRepository` to read `{base}/presets.json` through `Http` (trusted URL, 10 s timeout, success status, valid JSON, supported `version`), with the same getters and memoization; any failure logs a warning and yields no data
- [x] 3.4 Add `PresetRepository::get_products(string $industry)` with the `general` fallback for `other`, empty and 404, and no fallback for other failures (403 also counts as "missing": S3 answers 403 for a missing key when the bucket allows only reads)
- [x] 3.5 Add a test helper that serves `{base}/…` from `resources/data/preconfigured-data/` through `pre_http_request` (404 for missing files); move `PresetRepositoryTest`, `LocalPresetSourceTest` and `StorePresetsTest` to it (the unit `PresetRepositoryTest` reads the source folder through a test subclass, because the unit suite has no WordPress HTTP API; `OnboardingApiTest` also uses the stub)
- [x] 3.6 Add tests: request error → no presets and the applied flag is set; untrusted base URL → no request; unsupported version → no presets; `get_products()` for an industry, for `other`, and for a 404
- [x] 3.7 Verify: `bash kirki-ecommerce-test unit` and `bash kirki-ecommerce-test integration`; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 4. Onboarding presets: slugs, tags, WooCommerce precedence

- [x] 4.1 `CategoryPresets`: insert the preset `slug` (sanitized), skip a node without a slug with a warning
- [x] 4.2 `LocalPresetSource::fetch()`: pass the industry `tags`
- [x] 4.3 Add `TagPresets` (skip when any Kirki tag exists; create `{name, slug}`) and run it in `StorePresetService` after `CategoryPresets`
- [x] 4.4 Add the WooCommerce taxonomy reader (`has_categories()` ignores `default_product_cat`; `has_tags()`), gated by `VersionProbe` installed and supported, reading through `WooCommerceDatabase`
- [x] 4.5 Make `CategoryPresets` and `TagPresets` return early when the reader reports WooCommerce categories or tags
- [x] 4.6 Tests: categories stored with preset slugs (including the two "Outerwear" entries); tags seeded; tags skipped when a tag exists; `other` gets no tags; the four WooCommerce scenarios of the spec
- [x] 4.7 Verify: PHP unit and integration suites through the docker runner; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 5. Sample data import from S3

- [x] 5.1 `MediaImporter`: replace the local-path import with `import_url()` (trusted URL, `Http` download, `wp_upload_bits`, attachment, metadata) and dedup by the new source-URL meta key; remove the code that this makes unused
- [x] 5.2 Rewrite `ProductSeeder` to take the products and the attribute definitions: per product SKU skip, slug → id for categories and tags (drop the missing ones), ensure attributes and values from the preset definitions, image import with a URL → id map, decimal price → minor units of the base currency, `weight_unit = g`, ribbon, sale price, cost, stock, low-stock threshold, backorder, order limit; a `\Throwable` for each product is logged and the next product continues
- [x] 5.3 `SampleDataImporter::import()`: read the products and the presets; fail with a user-facing error when either is missing; run `ProductSeeder`, then `CouponSeeder`; remove the "store has products" guard
- [x] 5.4 Make `OnboardingController::import_sample_data()` return the error response for a failed read (the route and the success response stay the same) (no code change needed: the importer throws with a 503 status and the framework turns it into the error response, as for the payment install route; only the docblock changed)
- [x] 5.5 Remove `OnBoardingCatalog::get_products()` and `get_demo_attributes()`; keep `get_coupons()`
- [x] 5.6 Rewrite the `test_sample_data_*` tests: products link by slug; a missing slug creates no category or tag; a missing attribute value is created with its hex; the second run skips existing SKUs; the merchant's own products do not block the load; `other` loads the general set; a failed products read creates nothing; failed image requests still create the products; a JPY store stores 38.00 as 38; the coupon is created once (`OnboardingApiTest::test_sample_data_creates_no_coupon_when_products_exist` was removed: it tested the old "store has products" guard)
- [x] 5.7 Verify: PHP unit and integration suites through the docker runner; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 6. Packaging

- [x] 6.1 `bin/make-package.sh`: remove `resources/data/preconfigured-data` and `assets/images/products` from the stage
- [x] 6.2 Verify: `npm run make:package`, list the zip, and confirm that both paths are absent and that `resources/data/countries.php` and `currencies.json` are present; run `npm run typecheck && npm test` in `resources/app/`

## 7. Documentation

- [x] 7.1 `docs/onboarding.md`: update §4 (data source, S3 layout, base-URL constant, tags, explicit slugs, WooCommerce precedence, failure behavior), §5 (per-industry products, linking, SKU-based re-run, error cases), §7 (extension points), §9 (limitations: no retry after a failed read, local default URL) and §10 (remote calls are now made) (also added §4.8 for the WooCommerce rule, and updated `docs/home.md` §6 and its limitations)
- [x] 7.2 Add a "Preset data" section (or `docs/preset-data.md`) for developers: source folder, data shapes, checks, `check:presets`, `publish:presets`, env values, image fallback (new `docs/preset-data.md`)
- [x] 7.3 `docs/release-package.md`: the two new exclusions
- [x] 7.4 `readme.txt`: add `== External services ==` for the presets host and the payments catalog (what is requested, when, that no site data is sent, links to the terms and privacy policy) (the section existed; added Amazon S3 with AWS terms and privacy links)
- [x] 7.5 Verify: run `npm run typecheck && npm test` in `resources/app/`

> Groups 8–12 apply the product owner's sample catalog (design §4, §5, §6, §12). They
> replace parts of groups 1, 2, 4 and 5: the onboarding category and tag steps, the
> WooCommerce check, the `general` set and the placeholder images.

## 8. Sample catalog data

- [x] 8.1 Copy `/Users/ahamed/Downloads/sample-products.json` to the scratchpad as a backup, then change its `industry` values to the wizard values in `resources/app/features/onboarding/lib/steps.ts` (design §12 table)
- [x] 8.2 Write the one-off conversion script in the scratchpad and generate `<industry>/products.json` for the 15 industries and `other` in the design §4 shape: categories (flat, parent before child), tags without `sample` and with names from slugs, products with the fields of design §12, prices in major units, option keys as slugs, Grey → "Gray / Grey", `unit_price`, first variant default
- [x] 8.3 Move the images from `product-images/<industry>/` to `<industry>/images/` (`other` included), remove `product-images/`, and replace `general/` with `other/`
- [x] 8.4 `presets.json`: remove `categories` and `tags` from every industry; add the missing sample attributes and values by name to the industry attributes; add the industry `color` entries with only the non-common colors; change `shade` to the color type with the hex codes of design §4; give the plain-list colors the hex codes of design §4; add `industries.other` with `attributes` only
- [x] 8.5 Delete `assets/images/products/`
- [x] 8.6 Verify: run `npm run typecheck && npm test` in `resources/app/`

## 9. Check and publish tooling for the catalog

- [x] 9.1 `bin/lib/preset-data.js`: read categories and tags from each products file (explicit unique slugs and names, parent listed before child); resolve product categories and tags within the same file; resolve options against the common and industry attributes merged by slug (`other` uses `industries.other`); unique product slugs per file; `unit_price` rules; images must be in `<industry>/images/`; every industry and `other` has a products file; remove the `general` rules, the `folder` field and the placeholder fallback
- [x] 9.2 `bin/publish-presets.js`: stage `<set>/images/<file>` for the images that products name, with no fallback
- [x] 9.3 Update `bin/test/preset-data.test.js` for the new rules
- [x] 9.4 Verify: `npm run check:presets` passes; `npm run s3:up`, `npm run publish:presets`, then `curl` `presets.json`, one `products.json` and one image under `{prefix}/<industry>/images/`; run `npm run typecheck && npm test` in `resources/app/`

## 10. Store setup without categories and tags

- [x] 10.1 Remove `CategoryPresets` and `TagPresets` from `StorePresetService` and delete both classes; `LocalPresetSource` stops passing `categories` and `tags`
- [x] 10.2 Delete `TaxonomyPresenceReader` and `WooCommerceDatabase::has_terms()` when nothing else uses them
- [x] 10.3 Tests: remove the category, tag and WooCommerce precedence tests from `StorePresetsTest`; add "store setup creates no categories and no tags"; keep `LocalPresetSourceTest` green
- [x] 10.4 Verify: PHP unit and integration suites through the docker runner; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 11. Sample data import from the catalog

- [x] 11.1 `PresetRepository`: the fallback set becomes `other`; `get_image_url($set, $filename)` returns `{base}/{set}/images/{filename}`
- [x] 11.2 `SampleDataImporter`: build the attribute definitions from the common attributes and `get_industry($products['set'])`, merged by slug (first name and type win, values are joined)
- [x] 11.3 `ProductSeeder`: create the categories (find by slug or create with parent and level) and the tags (find by slug or create) from the products file before the products; link products through the resulting slug → id maps; use the product `slug` from the file (made unique); store `unit_price` in the four unit-pricing columns
- [x] 11.4 `tests/Support/ServesPresetData.php`: remove the placeholder image fallback
- [x] 11.5 Tests: categories created with slugs, parents and levels; existing category and tag reused unchanged; tags created with names; an industry color value created with its hex; unit pricing stored; product slug from the file; the `other` set for `other` and on a 404; update the existing sample-data tests to the new catalog (SKUs, slugs, prices)
- [x] 11.6 Verify: PHP unit and integration suites through the docker runner; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 12. Documentation and packaging for the catalog

- [x] 12.1 `docs/preset-data.md`: layout (`other/`, `images/`), the presets attributes and the color merge rule, the products file shape with categories, tags and `unit_price`, the checks, no placeholder fallback; keep the "Where this differs" section true
- [x] 12.2 `docs/onboarding.md`: §4 store setup creates no categories or tags, remove §4.8 (WooCommerce precedence); §5 categories and tags are created at sample load; update §9 and the TOC; `docs/home.md` §6 if it names categories at setup
- [x] 12.3 `bin/make-package.sh` and `docs/release-package.md`: drop `assets/images/products` (the folder no longer exists)
- [x] 12.4 Verify: `npm run make:package` and list the zip (no `resources/data/preconfigured-data/`); run `composer install` to restore the dev tools; run `npm run typecheck && npm test` in `resources/app/`

## 13. Before release (do not tick until the real bucket has the data)

- [x] 13.1 Publish to the real bucket and change the `KIRKI_ECOMMERCE_PRESETS_URL` default to `https://kirki-ecommerce.s3.us-east-1.amazonaws.com/preconfigured-data` (the product owner uploaded the data; `publish:presets` now targets the real bucket by default with its own `PRESETS_S3_*` variables)
- [x] 13.2 Verify: run `npm run typecheck && npm test` in `resources/app/`
