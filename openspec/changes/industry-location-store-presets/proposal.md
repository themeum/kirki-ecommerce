## Why

A new store finishes onboarding with no shipping zones, no tax region, no
shipping or tax profiles, no categories and no legal consents, even
though the wizard already asks for the industry and the country. The merchant
must build all of that by hand before the first order. `StoreSetupService::apply_presets()`
was left as an empty seam for this work; this change fills it.

The preset data ships with the plugin in one data file. No external server
is used.

## What Changes

- **Bundled data file.** The presets come from
  `resources/data/preconfigured-data.json` (sections `common`,
  `industries.<slug>`, `countries.<ISO2>`, `blocs`). A local builder turns the
  industry, country, state, base currency and tax answer into ready records
  for each preset kind (categories, attributes, zones with their destinations
  and methods, the tax region, and so on). Rules refer to profiles by key; the
  inserters resolve the keys to ids. When the file cannot be read, the presets
  are skipped silently and setup still succeeds.
- **Applied during store setup.** `POST /onboarding` applies the presets once,
  after the other setup parts. The completion screen gets a new row,
  "Configurations · Essentials, Shipping, Tax, Legal pages" (Tax only when the
  merchant collects tax), which shows progress and completes with the other
  rows.
- What the presets write:
  - **Categories** (new): the industry's category tree, two levels. The
    `other` industry gets no categories.
  - **Shipping zones**: Domestic, plus a Regional zone where the country
    belongs to a trade bloc (EU, GCC). **No Rest of World zone.**
  - **Shipping methods** per zone, with amounts in the country's local
    currency. The amounts apply only when the store's base currency is that
    currency. In all other cases the methods are created disabled with a rate of 0.
  - **Shipping profiles**: a default "General" profile plus the industry
    profiles. Rules on the preset methods use only currency-neutral actions
    (multiply the cost, disable the method).
  - **Tax region** (only when the merchant collects tax): the national
    standard VAT/GST rate. EU stores get one EU region of type
    `micro_business` that holds only the home country and its rate, because a
    micro-business region holds exactly one country. US and Canadian stores get
    per-state rates for the home state or province only (Canada: GST/HST for
    every province).
  - **Tax profiles**: a default "Standard" profile plus the industry profiles.
    Where a taxed country charges a profile at a rate other than the standard
    rate (reduced, zero, exempt or higher), the region gets a rule for it.
    Every country with tax data is checked against a source.
  - **Attributes**: Color for every store, plus the industry attributes.
  - **Product schema**: one default profile that has every field the schema
    picker supports.
  - **Legal**: published Terms & Conditions, Privacy Policy and Refund &
    Returns pages with placeholder text, plus Terms, Privacy and Marketing
    consents. The Privacy consent is mandatory in countries with GDPR-style
    law. In other countries, it is display text only.
- **Starter coupon in sample data.** The presets create no coupon. Loading
  sample data creates `WELCOME50` (50% off the order, inactive) together with
  the demo products. A store that already has products gets neither.
- When the industry is `other`, the industry data is skipped. Common and
  country presets still apply.
- **BREAKING (setup data)**: baseline seeding no longer creates the category
  tree, the Color and Material attributes or the four starter schema profiles.
  The baseline is the settings defaults only. The sample data importer creates
  the categories, attributes and values its demo products need.
- The EU tax strategy charges the rate of the region's one country for an EU
  region of type `micro_business`, as the existing TODO in
  `EUTaxStrategy::get_rate()` describes. Today, `micro_business` behaves like
  `oss`.
- Order and invoice numbering: no presets. No country requires a specific
  number format (EU VAT Directive Art. 226 requires only a unique sequential
  number). The docs record this finding.

## Capabilities

### New Capabilities

- `store-presets`: the bundled data file, the silent skip when it cannot be
  read, and what each preset kind
  writes (categories, zones, methods, shipping and tax profiles and rules, tax
  region, attributes, schema profile, legal pages and consents). Also
  covers the conditions on currency and tax collection, the `other` industry,
  and retry safety.

### Modified Capabilities

- `store-setup`: the "Industry and location presets hook" requirement changes
  from "makes no changes" to "store setup applies the presets". "Sample data can be loaded after onboarding" also creates the
  inactive `WELCOME50` coupon with the demo products.
- `onboarding-seed-data`: the baseline no longer seeds the category tree, the
  Color and Material attributes or the starter schema profiles. Demo products
  ensure their own categories and attributes.
- `store-onboarding-wizard`: the completion screen gets the Configurations row.
- `tax-region-rate-model`: an EU region of type `micro_business` holds one
  country and applies its rate to every EU destination.

## Impact

- **New code**: `app/Setup/Presets/` (the local builders and one inserter for
  each preset kind), `app/Services/StorePresetService.php`,
  `resources/data/preconfigured-data.json`.
- **Changed code**: `app/Services/StoreSetupService.php`,
  `app/Setup/OnBoardingSeeder.php`, `app/Setup/OnBoardingCatalog.php`,
  `app/Setup/ProductSeeder.php`, `app/Services/SampleDataImporter.php`,
  `app/Tax/Strategies/EUTaxStrategy.php`; new `app/Setup/CouponSeeder.php`;
  removed `CategorySeeder`, `AttributeSeeder`, `ProductSchemaSeeder`. Frontend:
  `resources/app/features/onboarding/` (wizard, completion step).
- **Data written**: options `shipping`, `tax`, `legal`; tables `categories`,
  `shipping_profiles`, `tax_profiles`, `attributes`, `attribute_values`,
  `product_schemas`; WordPress pages. Sample data also writes `coupons`.
- **External service**: none. The presets make no external request.
- **Depends on**: the uncommitted change `move-runtime-setup-out-of-seeders`
  (setup classes in `app/Setup/`). That change must land first.
- **Docs**: `docs/onboarding.md` gets a presets section and an honest
  "where this differs" section about data accuracy, the silent skip, and
  order/invoice numbering.
- **Maintenance**: the tax rates are legal data that change over time. Each
  country's tax data records `source` and `verified_at`.
