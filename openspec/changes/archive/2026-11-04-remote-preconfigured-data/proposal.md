## Why

The industry and location presets live in `resources/data/preconfigured-data.json`,
which ships inside the plugin zip. To change a legal text, an attribute list or the
sample products, we must release a new plugin version. The sample data is also too
small to be useful: three hard-coded products (`OnBoardingCatalog`) with no categories
and no tags, the same for every industry. Moving the data to S3 lets us update presets
and sample products without a release. Each industry then gets a real starter
catalog: categories, tags and five products with real images, from the product
owner's sample catalog (`sample-products.json`).

## What Changes

- The preset data moves from the plugin to S3 under
  `https://kirki-ecommerce.s3.us-east-1.amazonaws.com/preconfigured-data`, which is
  the default base URL. A `wp-config.php` constant overrides it. There is no local
  S3 bucket for the presets.
- S3 layout: `presets.json` (common, blocs, countries, industries), then one folder
  for each industry with `products.json` and an `images/` folder. The `other/` folder
  holds the products for the "Other" industry, and for an industry that has no
  products file.
- Onboarding fetches `presets.json`. If the fetch fails, onboarding logs a warning,
  marks the presets as applied and continues (the same as an unreadable file today).
- **BREAKING (behavior):** store setup no longer creates categories. Categories and
  tags are not in `presets.json` any more. Each `products.json` holds the categories
  and tags of its industry, and "Load sample data" creates them.
- "Load sample data" fetches `<industry>/products.json` (or `other/products.json`).
  It finds each category and tag of the file by slug, or creates it, and then creates
  each product with links to them. Variant attribute values come from the preset: the
  common and industry definitions, merged by slug. A missing attribute or value is
  created from that definition.
- The sample attributes are matched by name. Each attribute or value that the
  products use and the presets lack is added to the industry's attributes in
  `presets.json`. Colors that are not common colors go into an industry-level `color`
  entry, so onboarding still creates only the common colors. Beauty `shade` becomes a
  color type.
- Images are downloaded from S3 into the media library. An image that was already
  imported is reused, matched by its source URL.
- **BREAKING (behavior):** the import no longer stops when the store has any product.
  It skips each sample product whose SKU exists, so a run that was cut off can be
  run again.
- Sample prices are numbers in the store's base currency, with no conversion. The
  source file holds them in cents, and `products.json` holds them in major units.
  Weights are written in grams. Unit pricing (for example "per 100 g") is imported.
- Five sample products for each of the 15 industries and for "Other", 80 in total,
  converted from `sample-products.json`. Titles and descriptions are copied as they
  are. The `sample` tag of the source file is dropped. The 352 real images move into
  the industry folders. The placeholder images in `assets/images/products/` are
  deleted.
- The editable source moves to `resources/data/preconfigured-data/` in the repo. A
  new `npm run check:presets` validates the data, and `npm run publish:presets`
  validates and uploads it to the real bucket. Its `PRESETS_S3_*` variables are
  separate from the payments script's `S3_*` variables.
- `npm run make:package` leaves out `resources/data/preconfigured-data/`.
- **Removed:** `OnBoardingCatalog` products and demo attributes, and the bundled
  `preconfigured-data.json`. The starter coupon stays in code.
- `readme.txt` gets an "External services" entry for the S3 requests.

## Capabilities

### New Capabilities

- `remote-preset-source`: where the plugin reads preset and sample product data
  (base URL, S3 layout, trusted hosts, data version, behavior when the fetch fails).
- `preset-data-publishing`: the source data in the repo, its validation rules, and
  the script that uploads it to local or real S3.

### Modified Capabilities

- `onboarding-seed-data`: store setup seeds no categories or tags; the category tree
  and the tags come from the industry's products file when sample data is loaded,
  found or created by slug; demo products come from S3 for each industry, create
  missing attribute values from the merged preset definitions, carry unit pricing,
  and are idempotent for each SKU; the "bundled product images stay in the plugin"
  requirement is removed.
- `plugin-packaging`: the package leaves out the preset source data and its images.

## Impact

- **PHP:** `app/Setup/Presets/PresetRepository.php` (remote read, `other` set),
  `LocalPresetSource` (no categories), `StorePresetService` and `CategoryPresets`
  (category step removed), `app/Setup/ProductSeeder.php` (categories, tags, unit
  pricing, product slug) and `MediaImporter.php` (remote images),
  `SampleDataImporter` (merged attribute definitions), `OnBoardingCatalog` (products
  and attributes removed), `kirki-ecommerce.php` (new base-URL constant), a shared
  trusted-URL support class used by `PaymentGatewayCatalog`.
- **Data:** `resources/data/preconfigured-data.json` moves to
  `resources/data/preconfigured-data/presets.json`. Its industries lose `categories`
  and gain the sample attributes and values. New `<industry>/products.json` and
  `<industry>/images/` for 16 sets. `assets/images/products/` is deleted.
- **Tooling:** `package.json`
  (`check:presets`, `publish:presets`), new `bin/check-presets.js`,
  `bin/publish-presets.js` and `bin/lib/preset-data.js`, `bin/make-package.sh`.
- **API:** `POST /onboarding/sample-data` keeps its route and response. Only its
  behavior changes.
- **Docs:** `docs/onboarding.md`, new `docs/preset-data.md`, `docs/home.md`,
  `docs/release-package.md`, `readme.txt`.
- **External dependency:** onboarding and sample data now need outbound HTTPS to S3.
