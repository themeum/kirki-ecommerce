## Context

See proposal.md for the motivation and specs/ for the required behavior. The
current state that shapes the approach:

- `StoreSetupService::setup()` runs `seed_baseline()` → general and tax settings
  → `ensure_base(currency)` → `Utils::generate_site_pages()` →
  `apply_presets($industry, $country)` (empty) →
  `SetupChecklistService::record_preconfigured()` → the store-created hook.
  Every step is safe to run again. A step that throws fails the request, and
  the merchant retries.
- The runtime setup classes live in `app/Setup/` after the uncommitted change
  `move-runtime-setup-out-of-seeders`. `OnBoardingSeeder` queues
  `SettingsSeeder`, `CategorySeeder`, `AttributeSeeder` (Color + Material from
  `OnBoardingCatalog`) and `ProductSchemaSeeder` (four profiles).
- Shipping zones (`shipping.shipping_zones`), tax regions (`tax.tax_regions`)
  and consents (`legal.consents`) are arrays inside JSON options. Zones,
  methods and consents use UUID string ids (the admin uses `uuid()`).
  `AppSettings::set()` merges top-level keys and replaces each key it is given.
- Shipping and tax profiles are rows (`name`, `is_default`). Variants reference
  them by `shipping_profile_id` / `tax_profile_id`. `ShippingService` uses the
  `is_default` shipping profile for items that have no profile.
- Rule shape (shipping and tax): `{relation, conditions: [{type, operator,
  value}], action: {type, value}}`. Condition types: `shipping_profile`,
  `tax_profile`, `destination_region`, `cart_weight`, `cart_subtotal`,
  `product_categories`. Actions: `multiply_shipping_cost`,
  `disable_shipping_method`, `set_product_tax_rate`, `set_shipping_tax_rate`,
  `set_product_tax_exempt`, and others.
- Shipping method `base_amount` is an integer in minor units of the base
  currency. Method types: `flat_rate`, `local_pickup`, `weight`.
- States in `resources/data/states.php` are identified by a numeric `id` (for
  example Texas = 1407), not by an ISO code. A per-state tax region stores that
  id. The onboarding address sends `state` as a string.
- `EUTaxStrategy::get_rate()` always uses the destination member rate. A TODO
  says that `micro_business` must use the home-country rate.
- `SetupChecklistService::has_product_tax_rate()` already handles the EU region
  (`countries[].rate`) and the general region. So the preset data marks the
  Home tax and shipping steps as preconfigured without changes to the checklist.

## Goals / Non-Goals

**Goals:**

- One data file is the only source of preset content. To add a country or an
  industry, you edit the data, not the PHP.
- Each preset kind can be tested alone and checks its own target, so the
  "safe to retry" rule of store setup stays true.
- The plugin builds the presets from the bundled data file and makes no
  external request (Decision 18).

**Non-Goals:**

- Translating preset text. The file is English.
- A preset server, a JSON schema validator, or an admin UI to re-apply presets
  after onboarding.
- Local (city or county) US sales tax, and nexus detection.
- Order and invoice number formats (see the Decision on numbering).
- Extending the schema picker with fields that depend on the industry.

## Decisions

### 1. One file, one loader, plain appliers

> Revised by Decisions 10–12: the loader and the build logic now form the
> local preset source, and the appliers become inserters that take the
> resolved response. The order and guards in the table still hold, with
> `CategoryPresets` added first and `CouponPresets` removed (Decision 17).

`app/Setup/Presets/PresetRepository` reads `resources/data/preconfigured-data.json` once
with `json_decoded_data(resource_path(...))`. It has three methods:
`get_common()`, `get_industry($slug)` and `get_country($code)`, plus
`get_bloc($code)`. A missing or invalid file gives empty arrays and a log entry.
This is the only class that knows where the data comes from. A remote source
later replaces its body.

A `PresetContext` DTO holds `industry`, `country`, `state`, `currency` and
`is_tax_collected`, built from `StoreSetupDTO`. `apply_presets()` changes its
signature to take the DTO. It is public, but has no callers outside
`setup()`, and the docs list it as an extension point. The docs get an update.

The appliers are plain classes in `app/Setup/Presets/`, one for each kind, each
with `apply(PresetContext $context)`. They get the repository by constructor
injection:

| Order | Applier | Writes | Guard (skip when…) |
|---|---|---|---|
| 1 | `AttributePresets` | attributes + values | per slug exists |
| 2 | `SchemaProfilePresets` | product_schemas | any row exists |
| 3 | `CouponPresets` | coupons | code exists |
| 4 | `ShippingProfilePresets` | shipping_profiles | per name exists (reuse its id) |
| 5 | `TaxProfilePresets` | tax_profiles | per name exists (reuse its id) |
| 6 | `LegalPresets` | pages + `legal.consents` | page: slug exists; consents: any exists |
| 7 | `ShippingZonePresets` | `shipping.shipping_zones` | any zone exists |
| 8 | `TaxRegionPresets` | `tax.tax_regions` | tax off, or any region exists |

Profiles come before zones and regions, because rules need their ids. Steps 4
and 5 return a map from profile `key` to id. Each lookup is by name, so a retry
resolves the same ids. The steps from 7 to 8 resolve keys through the same
lookup, not through state stored in memory.

*Alternative considered:* reuse the framework `Seeder` queue. Rejected: seeders
take no arguments, but every applier needs the context.

*Alternative considered:* one big `StorePresetService`. Rejected: eight kinds
with different guards make one large class that is hard to test.

Errors: an applier that throws fails setup, the same as the other setup steps.
The merchant retries, and the guards skip the work that is done. The only case
that fails silently is a data file that cannot be read (spec: setup must not
fail because of preset data).

### 2. Data file shape

> Revised by Decision 17: `common.coupons` is removed.

```jsonc
{
  "version": 1,
  "blocs": { "EU": ["AT", "BE", "…27"], "GCC": ["AE", "BH", "KW", "OM", "QA", "SA"] },
  "common": {
    "attributes": [{ "name": "Color", "slug": "color", "type": "color",
                     "values": [{ "value": "White", "color": "#FFFFFF" }] }],
    "schema_profiles": [{ "name": "Default Product Schema", "is_default": true,
                          "schema": { "Product": ["name", "description", "image"], "…": [] } }],
    "coupons": [{ "code": "WELCOME50", "title": "Welcome 50% off", "discount_amount_percentage": 50, "…": "…" }],
    "shipping_profiles": [{ "key": "general", "name": "General", "is_default": true }],
    "tax_profiles": [{ "key": "standard", "name": "Standard", "is_default": true }],
    "shipping_methods": {            // the generic set, used when a country has no "shipping"
      "domestic":      [{ "key": "standard", "type": "flat_rate", "name": "Standard Shipping" },
                        { "key": "express",  "type": "flat_rate", "name": "Express Shipping" },
                        { "key": "pickup",   "type": "local_pickup", "name": "Local Pickup" }],
      "regional":      [{ "key": "standard", "type": "flat_rate", "name": "Regional Shipping" }],
      "rest_of_world": [{ "key": "standard", "type": "flat_rate", "name": "International Shipping" }]
    },
    "legal": {
      "pages": [{ "key": "terms", "slug": "terms-and-conditions", "title": "Terms & Conditions", "content": "…placeholder…" },
                { "key": "privacy", "slug": "privacy-policy", "…": "…" },
                { "key": "returns", "slug": "refund-and-returns-policy", "…": "…" }],
      "consents": [{ "key": "terms", "title": "Terms & Conditions", "locations": ["checkout"],
                     "method": "mandatory_checkbox", "message": "I agree to the {page:terms}." },
                   { "key": "privacy", "locations": ["signup", "checkout"],
                     "method": "display_text_only", "gdpr_method": "mandatory_checkbox", "…": "…" },
                   { "key": "marketing", "method": "optional_checkbox", "…": "…" }]
    }
  },
  "industries": {
    "fashion-and-apparel": {
      "attributes": [{ "name": "Size", "slug": "size", "type": "list", "values": [{ "value": "XS" }] }],
      "shipping_profiles": [{ "key": "oversized", "name": "Oversized" }],
      "shipping_rules": [{ "profile": "oversized", "zones": ["*"], "methods": ["*"],
                           "action": { "type": "multiply_shipping_cost", "value": 1.5 } }],
      "tax_profiles": [{ "key": "childrens_clothing", "name": "Children's Clothing" }]
    }
  },
  "countries": {
    "GB": {
      "currency": "GBP", "bloc": null, "gdpr": true,
      "source": "https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services",
      "verified_at": "2026-10-05",
      "shipping": { "domestic": [{ "key": "standard", "type": "flat_rate", "name": "Royal Mail 2nd Class",
                                   "base_amount": 399, "free_over": 5000 }], "…": [] },
      "tax": { "mode": "country", "rate": 20, "shipping_rate": 20,
               "profile_rates": { "food": 0, "books": 0, "childrens_clothing": 0, "medical": { "exempt": true } } }
    },
    "US": { "tax": { "mode": "states", "scope": "home",
                     "states": { "1407": { "name": "Texas", "rate": 6.25 } } } },
    "CA": { "tax": { "mode": "states", "scope": "all",
                     "states": { "<id>": { "name": "Ontario", "rate": 13 },
                                 "<id>": { "name": "British Columbia", "rate": 5, "home_extra": 7 } } } },
    "DE": { "bloc": "EU", "tax": { "mode": "eu", "rate": 19, "profile_rates": { "food": 7, "books": 7 } } }
  }
}
```

Notes on the shape:

- **Keys, not ids.** Profiles have a `key`. Rules and `profile_rates` refer to
  that key. Consent messages use `{page:<key>}`. The applier replaces it with
  the real `{<slug>}` token. This lets the privacy consent point to an existing
  WordPress privacy page whose slug is different.
- **Rule templates** pick their methods by zone kind (`domestic`, `regional`,
  `rest_of_world`, or `*`) and method `key` (or `*`). The applier adds each
  matching template to the method's `shipping_rules` as
  `{relation: "and", conditions: [{type: "shipping_profile", operator: "in",
  value: [<id>]}], action}`. The exact operator and value format must match
  the format that the admin rule form saves (task 4.1 checks this against
  `shipping-rule-form.ts`).
- **Tax modes.** `country`: a general region in country-wide mode
  (`is_central_tax_enabled`, `central_product_tax`, `central_shipping_tax`).
  `states`: a general region in per-state mode. `scope: home` keeps only the
  address state. `scope: all` keeps every listed state, and adds `home_extra`
  to the home state's rate (PST/QST on top of GST). `eu`: the country is an EU
  member. The EU region is built from the `rate` of every member in
  `blocs.EU`. A state's shipping rate is the same as its product rate unless
  the entry has `shipping_rate`.
- **State matching.** Keys are `states.php` ids. The address `state` must be
  equal to an id in the list, or no per-state region is made (spec: a US store
  with no state gets no region). An address state that is free text, not an
  id, gets the same result.
- **Amounts** are integers in minor units of `countries.<cc>.currency`.
  `free_over` maps to `is_free_shipping_enabled` +
  `base_free_shipping_min_amount`. When `context.currency !== currency`, the
  applier sets `is_enabled: false`, `base_amount: 0`, and drops `free_over`.
- **Fallback country** (no entry): the generic method set, disabled, zero rate.
  Zones are Domestic + Rest of World. No tax region. `gdpr: false`.

### 3. Rest of World is an explicit list

> Superseded by Decision 13: no Rest of World zone is created.

The zone form needs at least one destination, and a zone with no regions
matches every address. So Rest of World lists every code in `countries.php`
minus the Domestic and Regional codes, each as `{country, states: []}`. Zones
are stored in order Domestic → Regional → Rest of World, because
`ShippingService` uses the first enabled zone that matches.

### 4. EU micro-business fix in the strategy

> Revised by Decision 19: the rate comes from the region's one country, not
> from the store address.

`EUTaxStrategy::get_rate()` takes the country to look up from the store address
country (`Settings::get('general.store_address.country')`) when
`settings.type === 'micro_business'`, and from the shopper's address otherwise.
If that country has no rate in `countries`, the result is 0. The rules still
apply after the rate is found. The existing `EUTaxStrategyTest` gets
micro-business cases. This is a behavior change for any existing EU region of
type micro-business. Such a region now charges the home rate, which is what its
type means.

### 5. Tax profile rules apply to the home country only

> Extended by Decision 15: rates above the standard rate are allowed, and a
> per-state region places country-wide rules on every listed state.

For each created tax profile with an entry in the home country's
`profile_rates`, the region gets a rule `{relation: "and", conditions:
[{type: "tax_profile", operator: "in", value: [<id>]}], action}`. The action is
`set_product_tax_rate` with the rate, or `set_product_tax_exempt` when the entry
is `{exempt: true}`. A rate of `0` uses `set_product_tax_rate` with value 0,
because zero-rated and exempt are different in law. The place where the rule
goes depends on the mode: the region `rules` (country mode and EU), or the home
state's `rules` (states mode). On an EU region the rule applies to every member
destination. This is correct for micro-business, which uses the home rate. If
the merchant changes to OSS, the merchant must check those rules. The docs say
this.

### 6. Attributes and schema move out of the baseline

`OnBoardingSeeder` stops queuing `AttributeSeeder` and `ProductSchemaSeeder`.
Both classes and `OnBoardingCatalog::get_attributes()`,
`get_colors()` and `get_schema_profiles()` are deleted. Their data moves to
`common` in the JSON. The default schema profile is the old "Complete Product
Schema" (all four groups, every field) renamed "Default Product Schema" and
marked default.

`ProductSeeder` (sample data) gets a demo attribute catalog (Color: Red, Green,
Blue, Orange; Material: Ceramic, Glass), and before it builds products, it
finds or creates each attribute by slug and each value by label. Color values
it creates have the hex code from its own catalog.

### 7. Legal pages

`LegalPresets` uses `get_page_by_path($slug, OBJECT, 'page')`. If the page is
missing, it calls `wp_insert_post` (published, placeholder content). For the
privacy key, if `get_option('wp_page_for_privacy_policy')` points to a
published page, it uses that page's slug and creates nothing. A WordPress
privacy page that is a draft is not published, because its content is the
WordPress guide text, not a policy. Our placeholder page is created instead.
Consents get `id = wp_generate_uuid4()` and `is_enabled = true`. Privacy uses
`gdpr_method` when `countries.<cc>.gdpr` is true.

### 8. Coupon

> Revised by Decision 17: sample data loading creates this coupon, not the
> presets. The fields below still apply.

Created through the `Coupon` model with: `method=code`, `discount_type=amount-off`,
`discount_target=order`, `discount_value_type=percentage`,
`discount_amount_percentage=50`, `eligible_item_type=all-products`,
`target_country_type=all-countries`, `customer_include_eligibility=everyone`,
`customer_exclude_eligibility=none`, `has_end_datetime=false`,
`start_datetime=now`, `is_active=false`, `created_by=get_current_user_id()`.
Any field that the coupon create request requires but that is not in this list
is copied from what `CouponService` writes for a minimal coupon (checked in a
task).

### 9. Order and invoice numbering: no preset

Research result: EU VAT Directive 2006/112/EC Art. 226(2) requires "a
sequential number, based on one or more series, which uniquely identifies the
invoice". It does not set a format. Countries that go further (Portugal ATCUD
and certified software, Italian and Spanish yearly series practice, India GST
16-character limit) need features we do not have, or are only common practice.
None of them is a deterministic format that we can set. The JSON has no key for
this. A key can be added when a deterministic rule is found.

### 10. Preset source: remote when configured, local otherwise

> Superseded by Decision 18: there is no remote source. `LocalPresetSource`
> is the only source, and the interface, URL constant and filter are removed.

`PresetSource` is an interface with one method, `fetch(PresetContext $context)`,
which returns the resolved response array, or null when the presets must be
skipped. Two implementations:

- `RemotePresetSource`: `wp_safe_remote_get($url, ['timeout' => 10])` with the
  query `industry`, `country`, `state`, `currency`, `tax` (`1`/`0`) and
  `version` (the response format version the plugin reads, `1`). A non-2xx
  status, a transport error, a body that is not JSON, or a `version` the
  plugin does not know gives null and one `Log::warning`.
- `LocalPresetSource`: reads `resources/data/preconfigured-data.json` through
  `PresetRepository` and builds the same response with the local builders
  (Decision 11). It makes no external request.

The URL comes from the constant `KIRKI_ECOMMERCE_PRESETS_URL` (so a developer
can set it in `wp-config.php`), passed through the filter
`kirki_ecommerce_presets_url`. An empty URL selects the local source. The
container binds `PresetSource` to the right class, so tests can bind a fake.
The plugin ships with no URL, so nothing is sent to a server until the
maintainer sets one.

*Alternative considered:* a bundled fallback when the remote fails. Rejected by
the product decision: the presets are skipped silently instead, so there is
one source of truth.

### 11. Response contract (format version 1)

> Revised by Decision 18: this is now the internal shape that
> `LocalPresetSource` builds and the inserters read. It has no `version` key.

```jsonc
{
  "version": 1,
  "categories": [{ "name": "Men", "description": "…", "children": [{ "name": "Shirts" }] }],
  "attributes": [{ "name": "Color", "slug": "color", "type": "color", "values": [{ "value": "White", "color": "#FFFFFF" }] }],
  "schema_profiles": [{ "name": "Default Product Schema", "is_default": true, "schema": { "Product": ["name"] } }],
  "shipping_profiles": [{ "key": "general", "name": "General", "is_default": true }],
  "tax_profiles": [{ "key": "standard", "name": "Standard", "is_default": true }],
  "legal": {
    "pages": [{ "key": "terms", "slug": "terms-and-conditions", "title": "…", "content": "…" }],
    "consents": [{ "title": "…", "locations": ["checkout"], "method": "mandatory_checkbox", "message": "I agree to the {page:terms}." }]
  },
  "shipping_zones": [{
    "title": "Domestic", "is_enabled": true,
    "regions": [{ "country": "DE", "states": [] }],
    "methods": [{ "type": "flat_rate", "name": "Standard Shipping", "base_amount": 495, "is_enabled": true, "is_taxable": true,
                  "rules": [{ "profile": "fragile", "action": { "type": "multiply_shipping_cost", "value": 1.25 } }] }]
  }],
  "tax_region": {
    "…": "stored region fields (code, name, flag, type, rates, countries, states)",
    "rules": [{ "profile": "food", "action": { "type": "set_product_tax_rate", "value": 7 } }],
    "states": [{ "id": "1407", "name": "Texas", "product_tax_rate": 6.25, "shipping_tax_rate": 6.25, "rules": [] }]
  }
}
```

- The server does every decision that depends on the context: which
  industry, the destinations, the currency check (amounts and `is_enabled`),
  GDPR consent wording, the tax region mode, the rate rules and the home
  state. `tax_region` is null when no region applies (tax off, no data, no
  home state).
- Rules refer to a profile by `key` (`"profile": "<key>"`). The plugin turns
  each into the stored rule format (see Corrections: `relation: "AND"`, one
  condition `{type, operator: "=", value: "<id>"}`). A rule whose key has no
  created profile is dropped.
- Legal pages keep `{page:<key>}` tokens; the plugin resolves them to the real
  slug, because only the plugin knows the WordPress privacy page.
- The plugin adds the ids it owns: UUIDs for zones, methods and consents,
  `shipping_rules` on methods, and DB ids for profiles.

### 12. Inserters validate, guard and write

> Revised by Decision 18: store setup runs the service; there is no presets
> endpoint, and the service no longer calls `record_preconfigured()`. The
> validation stays.

The appliers become inserters with `apply(array $presets, PresetContext
$context)`. Each reads only its own key of the response. The data is from our
server, but it is still external input, so each inserter checks types before it
writes: strings go through `sanitize_text_field` (page content through
`wp_kses_post`), numbers are cast, rule action types must be in an allowlist
(`multiply_shipping_cost`, `disable_shipping_method`, `set_product_tax_rate`,
`set_product_tax_exempt`), method types must be known, and a zone needs at
least one region. A record that fails a check is skipped and logged.

`StorePresetService::apply(PresetContext $context)` fetches once, then runs the
inserters in the table order (categories → attributes → schema →
shipping profiles → tax profiles → legal → zones → tax region). Each inserter
runs in its own `try`/`catch`: an exception is logged and the next inserter
runs (spec: one kind failing does not stop the others). Then it calls
`SetupChecklistService::record_preconfigured()`.

**Once per store.** The service sets the option
`kirki_ecommerce_presets_applied_at` (a timestamp) when it ends, also after a skip. The
controller action `POST /onboarding/presets` returns 409 before onboarding is
complete, and returns success with no work when the flag is set. The context
comes from saved settings (`general.industry`, `general.store_address.country`
and `.state`, the base currency, `general.is_tax_calculation_enabled`) through
`PresetContext::from_settings()`, not from the request body.

`StoreSetupService::setup()` no longer calls the presets, and
`apply_presets()` is removed from it. It still calls `record_preconfigured()`,
so the checklist is right if the presets request never runs. The store-created
hook keeps its place at the end of `setup()`.

*Trade-off:* if the merchant closes the page between the two requests, the
presets are never applied. The docs say this. A later admin action to apply
presets is a non-goal.

### 13. No Rest of World zone

Zones are Domestic and, for EU and GCC members, Regional. A shopper outside
those zones gets no shipping method until the merchant adds a zone. Rule
templates that targeted `rest_of_world` are removed; templates that only
targeted it disappear (Bulky, Lithium Batteries, Batteries). The profiles
stay. `common.shipping_methods.rest_of_world`, `zone_titles.rest_of_world` and
every country's `shipping.rest_of_world` are removed from the data.

### 14. Industry categories replace the baseline tree

`CategorySeeder` and `OnBoardingCatalog::get_categories()` are deleted, and the
baseline seeds settings defaults only. Each industry entry gets `categories`, a
tree of at most two levels. `CategoryPresets` inserts it when the store has no
category, parents before children, and makes each slug unique with
`Category::generate_unique_slug()` (a repeated name gets a numbered slug).
`other` gets no categories.

`ProductSeeder` (sample data) does not create or assign categories. The demo
products have no category.

### 15. Tax rules wherever a profile's rate differs

For every country with tax data, each tax profile in the industry data is
checked against a source. When the country charges that profile at another
rate than the standard rate (reduced, zero, exempt, or higher), the country's
`profile_rates` gets the rate, and the source is recorded in `tax.source`
(more than one source is allowed: `sources: [...]`). No source → no rule. A new
tax profile is added to an industry only when a real rate difference in
several countries needs it.

Per-state data: `tax.profile_rates` (country-wide) is placed on every listed
state; `tax.states.<id>.profile_rates` is placed on that state and replaces
the country-wide rate for the same profile. This lets Canada zero-rate
groceries in every province, and a US state set its own grocery or higher
alcohol rate. Per-litre excise duties cannot be expressed as a rate and are
not modelled.

### 16. Configurations row in the wizard

> Revised by Decision 18: there is no presets request. The row completes with
> the other rows.

After `createStore` succeeds, the wizard sends `POST /onboarding/presets` once
(`useApplyPresetsMutation`). The summary gets a last row, "Configurations",
with the value "Essentials, Shipping, Tax, Legal pages" ("Tax" only when the
merchant collects tax). The staggered rows hook treats this row as in progress
until the presets request settles; any result (success, 409, network error)
marks it completed. `isSetupReady` therefore waits for the presets request.
The retry button resubmits only the store setup; the presets request is sent
after a successful retry.

### 17. The starter coupon moves to sample data

The presets no longer create a coupon. `common.coupons` is removed from
`preconfigured-data.json`, `coupons` is removed from the response contract, and
`CouponPresets` is deleted. A server that still sends `coupons` is ignored,
because no inserter reads that key.

Sample data loading creates `WELCOME50` with the fields of Decision 8,
inactive. The coupon is demo data, so it follows the sample data rules:
`SampleDataImporter::import()` creates it only when it creates the demo
products (a store that already has products gets neither), and only when no
coupon has the code `WELCOME50`. The definition lives in
`OnBoardingCatalog::get_coupons()`, next to the demo products, and a
`CouponSeeder` in `app/Setup/` inserts it after `ProductSeeder`.

*Alternative considered:* create the coupon on every sample data request when
the code is free. Rejected by the product decision: sample data stays
all-or-nothing.

*Alternative considered:* create it active, so the merchant can try it on the
demo products. Rejected: a store that goes live with sample data would give
50% off every order.

### 18. No preset server; store setup applies the presets

Product decision: the preset data stays in the plugin. No remote server is
used.

- The data file is renamed `resources/data/preconfigured-data.json`.
  `PresetRepository` reads it.
- `RemotePresetSource`, the `PresetSource` interface, the constant
  `KIRKI_ECOMMERCE_PRESETS_URL`, the filter `kirki_ecommerce_presets_url`
  (`DevHookNames::PRESETS_URL`), the container binding and
  `AppServiceProvider::make_preset_source()` are deleted. The built records no
  longer carry `version`; the data file keeps its own `version`.
- `LocalPresetSource` and its builders stay, and so do the inserters and their
  validation (Decision 12). The checks cost little and keep the store safe from
  a hand-edited file.
- `StorePresetService::apply()` gets `LocalPresetSource` from the container
  when it runs, so tests can replace it with `app()->instance()`. It no longer
  calls `record_preconfigured()`.
- `StoreSetupService::setup()` calls `StorePresetService::apply(PresetContext::from_settings())`
  when `is_applied()` is false. The call comes after the storefront pages and
  before `record_preconfigured()` and the store-created hook, so the checklist
  sees the preset zone and region. The `presets_applied_at` flag stays, so a
  setup that runs again does not apply the presets again.
- `POST /onboarding/presets`, `OnboardingController::apply_presets()`, the
  `ONBOARDING_PRESETS` endpoint, `applyPresets` / `useApplyPresetsMutation` and
  the wizard's wait for the presets are removed. The Configurations row stays
  and completes with the other rows.

*Alternative considered:* fold the builders into the inserters, as in
Decision 1. Rejected: a large rewrite of tested code for no change in behavior.

*Trade-off:* the setup request takes longer, because it now also decodes the
data file and writes the presets. The completion screen already shows progress
for at least 5 seconds.

### 19. A micro-business region holds one country

The admin form allows one country for a micro-business region: the "Add VAT"
button is disabled after one entry, and switching to micro-business keeps only
the first entry (`resolveVatProcessChange()`). The preset broke this rule: it
wrote all 27 member rates, so the admin showed 27 rows it would never create,
and a switch to OSS and back kept Austria, not the home country.

- `TaxRegionBuilder::make_eu_region()` writes one country, the store's country,
  with its standard rate. The region rules (profile rates) do not change.
- `EUTaxStrategy::get_rate()` for `micro_business` uses the rate of the
  region's one country (the first entry of `countries`), whatever the store
  address or the shopper's member country. With no country, the rate is 0.
  This removes the strategy's dependency on the store address, so a merchant
  who registers VAT in another member country gets the rate they chose.

*Alternative considered:* keep the store address lookup and fix only the
preset. Rejected: a country picked in the admin that is not the store country
would give 0% tax.

## Risks / Trade-offs

- [Tax rates go out of date, and a wrong rate gives a wrong charge] → Each
  country entry has `source` and `verified_at`. A unit test fails when an entry
  with `tax` has no `source` or `verified_at`. The region is "preconfigured"
  on Home, so the merchant must confirm it. The docs say clearly that the
  rates are a starting point.
- [US shipping taxability is different in each state; we use the product rate
  for shipping] → Per-state `shipping_rate` override in data. The docs list it.
- [Shipping amounts that look real but are wrong for the merchant's carrier] →
  Amounts apply only in the local currency, and the Home shipping step asks the
  merchant to confirm.
- [No Rest of World zone: shoppers abroad see no shipping method] → The
  merchant adds a zone if they ship abroad. The docs say this.
- [A data file that cannot be read gives a store with no presets, and the
  merchant is not told] → A product decision. The Home checklist still shows shipping and tax
  as steps to do, so the merchant is not misled into thinking they are set up.
- [Hand-edited data is written into options and tables] → Inserters validate types,
  sanitize text and allow only known rule actions and method types
  (Decision 12).
- [The file grows large (all VAT countries plus all industries)] → It is read
  once during setup, not on storefront requests. The loader decodes it once per
  request.
- [Stores that use micro-business today change their tax result] → The type
  describes this behavior already. The changelog and docs say it.
- [Remove the four starter schema profiles and Material for new stores] → The
  change affects only new setups. Existing stores keep their rows. Sample data
  creates Material when it needs it.
- [English-only preset text on stores in other languages] → Accepted.

## Migration Plan

No data migration. Presets run only in a new store setup. Existing stores are
not touched, except by the EU micro-business strategy fix. Rollback: revert the
change. Data that presets already wrote stays as normal merchant data.

## Open Questions

- ~~WordPress.org guidelines 6 and 7 for the remote source.~~ Resolved by
  Decision 18: the presets make no external request, so no disclosure or
  consent is needed.

- ~~Which trade blocs, apart from the EU and GCC, get a Regional zone?~~
  Resolved in phase 3: only the **EU** and the **GCC**, the two customs unions
  whose members share one external border. US↔CA (USMCA) and AU↔NZ are trade
  agreements, not single markets. A Regional zone there would only add a zone
  with the same rates as Rest of World.
- ~~The exact per-country method names and amounts.~~ Resolved in phase 3:
  generic names ("Standard Shipping", "Express Shipping"). Typical local amounts
  are set for GB, US, CA, BD, DE, FR, ES, IT, NL, CH, AU, NZ, IN, JP, SG and AE.
  Every other country gets the generic methods, disabled at zero.

## Corrections during implementation

- **Country currency and EU membership come from the country dataset.**
  `resources/data/countries.php` already holds each country's `currency` and
  `group: "eu"`. Country entries do not repeat `currency`. `blocs.EU` stays in
  the JSON, so the file is complete for a remote source, and a unit test fails
  if it does not match the dataset's `eu` group.
- **No `free_over` threshold.** `is_free_shipping_enabled` /
  `base_free_shipping_min_amount` are stored, but no server code reads them,
  and the admin shows them on weight-based methods only. Preset methods carry
  no free-shipping threshold.
- **Method entries use the stored field names.** A method in the JSON has the
  same fields as a stored method (`type`, `name`, `description`,
  `base_amount`, `is_taxable`, `has_fee`, …) plus `key`. A flat-rate method
  must have `is_taxable` and a non-null `base_amount`, or the settings API
  rejects the zone when the merchant saves it.
- **`source` and `verified_at` live inside `tax`.** They describe the tax
  data, which is the data that goes out of date.
- **GDPR override is an object.** A consent has `gdpr: {method, message}`, not
  `gdpr_method`. A mandatory checkbox needs "I agree" wording, and display
  text does not.
- **Consent tokens use underscores.** `LegalConsentService::TOKEN_PATTERN` is
  `[a-z0-9_]+` and changes `_` to `-` to find the slug. `{page:<key>}` becomes
  `{terms_and_conditions}`, not `{terms-and-conditions}`.
- **Phase 3 coverage is the rates that a 2026 source confirms, not "every VAT
  country".** 97 countries have a `tax` entry: the EU-27 (EC TEDB, cross-checked
  against a June 2026 table), the US states (Tax Foundation, July 2026), Canada
  (CRA), Bangladesh (NBR), GB (HMRC), and about 60 more from one global table
  (vatupdate, July 2026). Rows that the source did not state clearly (Ghana,
  Iran, Gibraltar, Malaysia's SST, Liberia, Brazil's transition), or that
  conflict with changes we know of (Russia 22% from 2026, Vietnam's temporary
  8%), were left out and not guessed. A store in one of those countries gets
  the fallback: no tax region. The rest can be added one at a time, with a
  primary source each.
- **Reduced rates (`profile_rates`) are set only where they are clear.** GB, DE,
  FR, CH, NO, IS, JP, AU and MX. Canada has none: a zero-rated grocery rule
  would apply to the home province only, while every province zero-rates
  groceries.
- **Saved rule format** (from `shipping-rule-form.ts` / `tax-rules-form.ts`):
  `{relation: "AND", conditions: [{type, operator: "=", value: "<id>"}],
  action: {type, value}}`. The profile id is a string. Conditions compare with
  `==`.
- **Revision 2: the router does not use container bindings.** The router builds
  controllers, and their constructor dependencies, by reflection, without the
  container's bindings. `StorePresetService` therefore takes only
  `SetupChecklistService` in its constructor and gets `PresetSource` with
  `app()->make()` in `apply()`. `PresetRepository` is a container singleton, so
  the local source and its builders decode the data file once.
- **Revision 2: the response uses `methods` and `rules`.** A zone in the
  response lists `methods`, and a method lists `rules`; the inserter writes them
  as the stored `shipping_methods` and `shipping_rules`. Inserted methods keep
  only the fields of the flat-rate and local-pickup types.
- **Revision 2: tax rule coverage.** 37 countries have profile rules (see the
  annotation on task 12.2). The EU per-category rates come from one secondary
  table (hellotax, 30 June 2026); a row is used only when it gives one rate for
  the category and does not conflict with a 2026 change we know of.
