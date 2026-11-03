## Context

See `proposal.md` (Why) and the specs for the required behavior. The current state
that shapes the approach:

- `PresetRepository` (a container singleton) decodes
  `resources/data/preconfigured-data.json` once per request. Only the onboarding path
  uses it: `LocalPresetSource`, `ShippingZoneBuilder` and `TaxRegionBuilder`.
- `StorePresetService::apply()` runs the inserters in a fixed order, catches each
  inserter's errors, and sets `PRESETS_APPLIED_AT` also when the data cannot be read.
  This "skip silently" behavior stays (a decision from the explore session).
- `CategoryPresets` generates slugs from names (`Category::generate_unique_slug`) and
  skips when any Kirki category exists. There is no tag inserter.
- `AttributePresets` creates each preset attribute whose slug does not exist yet, with
  its values. `LocalPresetSource` passes the common attributes first, then the
  industry's, so an industry entry with a common slug is skipped at onboarding.
- `ProductSeeder` reads `OnBoardingCatalog::get_products()`, creates the demo
  attributes, imports images from `assets/images/products` through `MediaImporter`
  (dedup by a filename meta key), and stops when any product exists.
- The WooCommerce migration runs **after** store setup, on the completion screen.
- `PaymentGatewayCatalog` already reads a static S3 object: a base-URL constant in
  `kirki-ecommerce.php` that `wp-config.php` can override, `Http::timeout(10)->get()`,
  and a static `is_trusted_url()` host lock. Local S3 is RustFS from
  `docker-compose.payments.yml`, and `bin/publish-payment-gateways.js` uploads with
  the AWS CLI.
- The framework `Http` client is built on `wp_remote_request`, so tests can serve
  fixtures through the `pre_http_request` filter.
- A variant stores money in minor units of the base currency, its own `weight_unit`
  (`g`, `kg`, `lb`, `oz`), and unit pricing (`base_unit_amount`, `base_unit`,
  `total_unit_amount`, `total_unit`).
- The product owner supplied the sample catalog as one file,
  `sample-products.json` (schema 1.0: USD cents, grams, 16 industries, 80 products,
  226 variants), and 352 real JPEG images grouped by industry in
  `resources/data/preconfigured-data/product-images/`.

## Goals / Non-Goals

**Goals:**
- One base URL constant, with the real bucket as its default.
- The data structure guarantees that every product link resolves on any store:
  everything a product links to is either in its own products file or in the
  presets.
- A sample data load that was cut off can be run again safely.
- The current preset tests keep working, and they read the source data from the repo
  through an HTTP fixture.

**Non-Goals:**
- Caching the presets between requests. Onboarding runs once, and a cache only adds
  stale-data cases.
- Retrying a failed presets read after onboarding (the decision is "skip silently").
- Exchange-rate conversion of sample prices.
- A UI change. The sample data endpoint keeps its route and response shape.
- Signing or checksumming the data files.
- A tool that converts future catalog files. The conversion in §12 is a one-off.

## Decisions

### 1. Base URL constant, real bucket by default

`kirki-ecommerce.php` defines `KIRKI_ECOMMERCE_PRESETS_URL` with the same
`defined() || define()` pattern as `KIRKI_ECOMMERCE_PAYMENT_CATALOG_URL`. The default
is `https://kirki-ecommerce.s3.us-east-1.amazonaws.com/preconfigured-data`. A site
can point to another location in `wp-config.php`.

> **Correction during implementation:** the first version defaulted to a local
> RustFS bucket (`http://host.docker.internal:9000/...`) until the real bucket had
> the data. The product owner uploaded the data and asked to drop the local
> bucket, so the default is now the real URL, and `docker-compose.payments.yml` no
> longer creates a `kirki-ecommerce` bucket.

### 2. One trusted-URL rule for both remote readers

The host lock moves from `PaymentGatewayCatalog::is_trusted_url()` into a small shared
support class (`App\Supports\RemoteUrl::is_trusted()`).
`PaymentGatewayCatalog::is_trusted_url()` delegates to it, so its callers and tests do
not change. *Alternative:* copy the regex into the presets reader. Rejected: two
copies of a security rule drift.

### 3. `PresetRepository` reads remote files

`PresetRepository` keeps its public getters and its once-per-request memoization. Its
constructor takes the base URL (default: the constant) instead of a file path, and it
gets `get_products(string $industry)` and `get_image_url(string $set, string $filename)`.
`load()` and `get_products()` share one fetch: trusted-URL check →
`Http::timeout(10)->get()` → success status → `json_decode` → supported `version`
check. Any failure logs a warning and returns "no data". Thus
`LocalPresetSource::fetch()` returns `null` as it does for an unreadable file today,
and `StorePresetService` behavior stays the same.

`get_products()` reads `{base}/{industry}/products.json`. For `other`, an empty
industry, or a 404, it reads `{base}/other/products.json`. A network error or any
other failure is not a reason to fall back. It returns "no data", and the import
reports an error. The result carries the set that was read (`'set'`), because the
image URLs and the attribute definitions depend on it (§7).

The fallback set is named `other`, the same as the industry value in the onboarding
wizard (`features/onboarding/lib/steps.ts`), so a folder name always equals an
industry value.

> **Correction during implementation:** a 403 also counts as "no products
> file". When a bucket policy allows only `s3:GetObject`, S3 answers 403
> (not 404) for a key that does not exist. RustFS answers 404, so a local
> check alone does not show this.

*Alternative:* a separate `SampleCatalogRepository`. Rejected: same base URL, same
fetch rules, same version rule. One class has one place for them.

The name `LocalPresetSource` is now not correct ("local" meant "from the bundled
file"). It stays as it is to keep this change small. Renaming it is a follow-up.

### 4. Data shapes

`presets.json` keeps its shape and `version` `2`. Its industries hold no
`categories` and no `tags`. They hold the attributes that the sample products use,
next to the attributes that were there before:

```json
"books-stationery-and-gifts": {
  "attributes": [
    { "name": "Format", "slug": "format", "type": "list", "values": [ ... ] },
    { "name": "Nib", "slug": "nib", "type": "list",
      "values": [ { "value": "Fine" }, { "value": "Medium" } ] },
    { "name": "Color", "slug": "color", "type": "color",
      "values": [ { "value": "Cobalt", "color": "#2456C9" }, { "value": "Mint", "color": "#8FD8C0" } ] }
  ],
  "shipping_profiles": [ ... ], "shipping_rules": [ ... ], "tax_profiles": [ ... ]
}
```

A new `industries.other` entry holds only `attributes` (the "Other" products use a
`size` attribute and extra colors).

**Attribute matching is by name.** A sample attribute matches the preset attribute
whose slug is the slug of its name (`Wax color` → `wax-color`). When the industry has
no such attribute and the common attributes do not either, it is added to the
industry, with the type `color` for a swatch and `list` otherwise. A value that the
matched attribute lacks is added to it. This can give near duplicates (Jewelry gets
`size` next to `ring-size`). This is accepted: the data stays exactly the product
owner's.

**Colors.** `color` is a common attribute (30 values, created for every store at
onboarding). A sample color that the common list lacks goes into an industry-level
`color` entry with only the extra values. At onboarding the common `color` is created
first, so the industry entry is skipped: a Fashion store never sees "Racing Red".
Sample data loading merges the definitions (§7), so the extra values are created when
a product needs them. A color value with the same name as a common value
(for example Coral) is not repeated: the common value and its hex are used.

**Type conflicts and missing hex.** Beauty `shade` changes from `list` to `color`,
because the sample uses it as a swatch. Its old values get skin-tone hex codes. The
sample uses Color as a plain list for some products, with no hex. Those values get hex
codes chosen here. "Grey" maps to the common value "Gray / Grey".

| Attribute | Value | Hex |
|---|---|---|
| shade | Fair | `#F3D9C4` |
| shade | Light | `#E6BC98` |
| shade | Medium | `#C99470` |
| shade | Tan | `#A9714B` |
| shade | Deep | `#6B4430` |
| color | Sage | `#9CAF88` |
| color | Sand | `#D8C3A0` |
| color | Cream | `#F3EBD8` |
| color | Blush | `#E8B4B0` |
| color | Charcoal | `#36454F` |
| color | Terracotta | `#C8664A` |

When one color name has different hex codes in different industries (Cobalt,
Lilac, Marigold, Mint, Sunflower), each industry keeps its own. The first value that
a store creates wins, because existing values are never changed.

`{industry}/products.json`:

```json
{
  "version": 1,
  "categories": [
    { "slug": "stationery", "name": "Stationery", "parent": null },
    { "slug": "notebooks", "name": "Notebooks", "parent": "stationery" }
  ],
  "tags": [ { "slug": "gift-idea", "name": "Gift Idea" } ],
  "products": [
    {
      "slug": "kraft-gift-wrap",
      "title": "Kraft Gift Wrap · Unit pricing",
      "short_description": "...",
      "description": "...",
      "ribbon": null,
      "categories": ["gift-wrap"],
      "tags": ["gift-idea"],
      "images": ["kraft-gift-wrap-1.jpg", "kraft-gift-wrap-2.jpg"],
      "variants": [
        {
          "sku": "SMP-BSG-KW-5M",
          "options": { "length": "5 m" },
          "image": null,
          "price": "8.00",
          "sale_price": null,
          "cost": "3.00",
          "stock": 40,
          "low_stock_threshold": 5,
          "allow_back_order": false,
          "max_per_order": null,
          "weight_g": 150,
          "unit_price": { "base_amount": 1, "base_unit": "m", "total_amount": 5, "total_unit": "m" },
          "is_default": true
        }
      ]
    }
  ]
}
```

- Categories are a flat list. A parent is listed before its children, so one pass
  creates the tree.
- `options` are keyed by attribute slug. A product with one variant and
  `options: {}` is a simple product.
- The product's attribute axes are derived from the options of its variants, so the
  data cannot list an axis that no variant uses.
- Prices are decimal strings in major units, so the JSON never holds float values.
  The importer converts them to minor units **of the store's base currency** with that
  currency's decimals (38.00 → 3800 for USD, 38 for JPY). This is the "number as it
  is" rule. 38.00 means 38 of the base currency, with no exchange rate.
- `weight_g` is stored with `weight_unit = g`, so no unit conversion is necessary.
- `unit_price` is optional. It maps to the variant's four unit-pricing columns.

The `version` numbers stay `2` and `1`: no plugin has read an earlier shape from S3,
because nothing is released.

### 5. Categories and tags are created at sample load

Store setup creates no categories and no tags. `CategoryPresets` and `TagPresets` are
removed from `StorePresetService`, and both classes are deleted. `LocalPresetSource`
no longer passes `categories` or `tags`.

`ProductSeeder` creates them before the products, from the products file:

- For each category in file order: find by slug; if missing, create it with the
  slug (through `sanitize_title`), the name, the parent id (from the map of this run)
  and `level = parent level + 1` (1 for a root). An existing category is reused as it
  is, also when its parent differs.
- For each tag: find by slug; if missing, create `{name, slug}`.
- The result is a slug → id map that the products use.

*Alternative:* keep the onboarding inserters and read the products file at
onboarding. Rejected: one more download at onboarding, and categories in a store
that never loads sample data.

### 6. WooCommerce precedence check (withdrawn)

The first version of this change skipped the preset categories and tags at store
setup when WooCommerce had its own. Store setup now creates no categories or tags, so
the rule has nothing to protect. `TaxonomyPresenceReader` and
`WooCommerceDatabase::has_terms()` are deleted. A store that migrated from
WooCommerce and then loads sample data gets the sample categories next to its own
(see Risks).

### 7. Sample product import

`SampleDataImporter::import()`:

1. `$products = presets->get_products(industry)`. The attribute definitions are the
   common attributes and the attributes of the industry of the set that was read
   (`get_industry($products['set'])`), merged by slug: the first definition gives
   the name and the type, and the values of both are used. If the products or the
   common presets are empty, throw a user-facing error. The controller returns it as
   an error response, and the existing toast shows it.
2. `ProductSeeder` (rewritten) takes the products file and the attribute definitions.
   It creates the categories and tags (§5), then for each product:
   - Skip it if any of its SKUs exists as a variant SKU.
   - Ensure the attributes and values: look up the attribute by slug and the value
     by name. If missing, create it from the definition (type, hex).
   - Import the images (§8), then call `CreateProductAction::execute()` with the
     product slug from the file (made unique), the category and tag ids, and the
     variant fields including unit pricing.
   - Catch `\Throwable` for each product, log it and continue, so one bad product
     does not stop the others.
3. Run `CouponSeeder` as today. It already skips an existing code.

The guard "the store has products → return" is removed (see the spec). The SKU check
replaces it.

`OnBoardingCatalog::get_products()` and `get_demo_attributes()` are removed, and
`get_coupons()` stays.

### 8. Image import by URL

`MediaImporter::import($absolute_path)` is replaced by `import_url(string $url)`:
trusted-URL check → `Http::timeout(15)->get($url)` → `wp_upload_bits(basename, null,
body)` → attachment → metadata. The dedup meta key changes to
`_kirki_ecommerce_sample_image_url` and stores the full URL. The old filename meta
stays on existing attachments and is not read any more. Images are downloaded one at
a time. The image URL is `{base}/{set}/images/{filename}`. `ProductSeeder` keeps its
URL → id map for the duration of one request, so a product image that a variant also
uses is downloaded once.

### 9. Source folder, check script, publish script

- Source: `resources/data/preconfigured-data/` (the repo copy of the S3 layout).
  `preconfigured-data.json` moves to `presets.json` with `git mv`, so the history is
  kept. Each industry folder and `other/` hold `products.json` and `images/`.
- `bin/lib/preset-data.js` holds the checks (see the `preset-data-publishing` spec)
  and returns a list of errors. `bin/check-presets.js` runs it alone
  (`npm run check:presets`), so the checks can run in CI without S3.
- `bin/publish-presets.js` (`npm run publish:presets`): runs the checks, stages the
  upload tree in a temp folder (only the images that products name), then runs
  `aws s3 cp --recursive` in this order: images, `*/products.json`, `presets.json`.
  JSON is uploaded with `Content-Type: application/json` and a short
  `Cache-Control`. It reuses `bin/lib/load-env`. It targets real AWS S3 with the AWS
  CLI's own credentials. Its variables are `PRESETS_S3_ENDPOINT` (default empty, AWS),
  `PRESETS_S3_BUCKET` (default `kirki-ecommerce`) and `PRESETS_S3_PREFIX` (default
  `preconfigured-data`). They do not share the payments script's `S3_*` names, because
  `.env.example` sets those to the local payments bucket. There is no placeholder
  fallback.

### 10. Packaging

`bin/make-package.sh` removes `$STAGE_DIR/resources/data/preconfigured-data` after
the copy step, in the same way as the existing `rm -rf "$STAGE_DIR/resources/assets"`
line. The sample images are inside that folder. `assets/images/products/` is deleted
from the repo, so the package script no longer names it.

### 11. Tests

- `PresetRepositoryTest`, `LocalPresetSourceTest`, `StorePresetsTest` and
  `OnboardingApiTest` use a `pre_http_request` helper that maps `{base}/…` URLs to
  files in `resources/data/preconfigured-data/` (and returns a 404 for missing
  files). The tests then run against the real source data, with no network.
- Store setup: a failed read → no presets, applied flag set; an untrusted base URL →
  no request; an unsupported version → no presets; no categories and no tags are
  created.
- Sample load: categories created with slugs, parents and levels; an existing
  category or tag is reused unchanged; tags created; links by slug; an industry
  color value created with its hex; unit pricing stored; product slug from the file;
  a missing attribute created; existing SKUs skipped on a second run; the `other`
  set for `other` and on a 404; products created without images when image
  requests fail; a JPY store stores 38.00 as 38.

### 12. Converting the sample catalog

A one-off script in the scratchpad (not committed) reads `sample-products.json` and
writes the 16 products files and the `presets.json` attribute additions. The
repository files are the source of truth after that.

- **Industry values.** The source file uses its own slugs. They are first changed in
  the source file to the wizard values (a backup is kept):

  | Source | Wizard value |
  |---|---|
  | `books-stationery-gifts` | `books-stationery-and-gifts` |
  | `fashion-apparel` | `fashion-and-apparel` |
  | `home-decor-furniture` | `home-decor-and-furniture` |
  | `beauty-personal-care` | `beauty-cosmetics-and-personal-care` |
  | `food-beverage-gourmet` | `food-beverage-and-gourmet` |
  | `electronics-accessories` | `electronics-and-accessories` |
  | `sports-fitness` | `sports-and-fitness` |
  | `baby-kids` | `baby-and-kids` |
  | `jewelry-watches` | `jewelry-and-watches` |

  The other seven already match.
- **Kept as they are:** slug, title, short description, description, ribbon,
  categories, SKU, stock, low-stock threshold, backorder, order limit, weight.
- **Changed:** prices from cents to major-unit strings (2200 → `"22.00"`); image paths
  to filenames only (`books/linen-notebook-1.jpg` → `linen-notebook-1.jpg`); option
  keys from attribute names to slugs; Grey to "Gray / Grey"; the unit fields into
  `unit_price`; the first variant becomes the default.
- **Dropped:** `slot`, `status` (always published), `track_inventory`, `is_visible`,
  `is_physical_product` (always true), `weight_unit` (always g),
  `has_limit_per_order` (true exactly when `max_per_order` is set), the product
  `attributes` (the presets define them), and the `sample` tag, from the tag lists
  and from every product.
- **Tag names** come from the slugs in title case, with acronyms kept
  (`gift-idea` → "Gift Idea", `usb-c` → "USB-C").
- **Images** move from `product-images/<industry>/` to `<industry>/images/`
  (`product-images/other/` → `other/images/`), and `product-images/` is removed. The
  old `general/` folder and the placeholder products files are replaced.

## Risks / Trade-offs

- **S3 down during onboarding means a store with no presets, and no retry.** The
  store gets no legal pages, shipping zones or tax regions from presets, and the
  checklist shows those steps as not configured. → This is the user's chosen
  behavior. The warning in the log names the URL and the reason. Section 9 of
  `docs/onboarding.md` documents it.
- **Every store depends on one public bucket.** While a file is missing or not
  public, store setup applies no presets and sample data fails with 503. → The
  publish command uploads everything with the right content type; the bucket policy
  must allow anonymous `s3:GetObject` on `preconfigured-data/*`.
- **A long sample data load can time out** (about 20 image downloads with
  thumbnails). → Each product is created on its own, so a second click continues.
  The UI already shows an error toast and brings the link back on failure.
- **A store with no sample data has no categories.** Before, store setup gave every
  store a category tree. → The merchant creates categories, migrates them from
  WooCommerce, or loads sample data.
- **Sample categories next to migrated WooCommerce categories.** A store that
  migrated from WooCommerce and then loads sample data gets both. A category with the
  same slug is shared. → Sample data is loaded only on request, and the docs say so.
- **Near-duplicate attributes.** Matching by name gives, for example, `size` next to
  `ring-size` in a jewelry store, and onboarding creates the new industry attributes
  for every store of that industry. → Accepted, to keep the product owner's data as
  it is.
- **A merchant who loads sample data on a store with its own products now gets
  sample products next to them.** Before, nothing happened. → The link is on the
  completion screen and in the Home checklist only, and the spec documents it.
- **wp.org external-service disclosure.** → `readme.txt` has an
  "External services" entry that names the S3 host, what is requested (presets,
  sample products and images), when (store setup and sample data loading), and that
  no site data is sent.
- **Data drift between presets and products.** A preset edit can break a product
  option. → The publish command runs the checks first and uploads nothing on failure.
- **Old objects stay in the bucket.** The publish never deletes, so files of removed
  products stay on S3. → They are not read. Delete them with the AWS CLI or the S3
  console.

## Migration Plan

1. Publish the data to the real bucket (`npm run publish:presets`, or an upload of
   the source folder), and check that `presets.json` is public.
2. Merge. The default URL is the real bucket.
3. Existing stores are not affected: presets are applied only once, and sample data
   is loaded only on request.

Rollback: revert the change. The bundled JSON comes back from git history.

## Open Questions

None. The hex codes in §4 are a proposal that the product owner can change in
`presets.json` with no code change.
