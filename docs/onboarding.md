# Store Onboarding

A short setup wizard that a merchant goes through once, right after activating the
plugin. It has three steps, or four when the merchant collects sales tax. It asks for the few things the store can't guess (name,
industry, country, currency and tax stance) and then configures the store from
those answers. Sample data is opt-in and loaded from the final screen.

Until the wizard is finished, the plugin's own admin pages lead back to it. Other
WordPress admin pages are never redirected.

- [1. Quick start](#1-quick-start)
- [2. The steps](#2-the-steps)
- [3. What "Create Store" does](#3-what-create-store-does)
- [4. Industry and location presets](#4-industry-and-location-presets)
- [5. Loading sample data](#5-loading-sample-data)
- [6. When the wizard is shown](#6-when-the-wizard-is-shown)
- [7. Extension points](#7-extension-points)
- [8. Resetting onboarding in development](#8-resetting-onboarding-in-development)
- [9. Requirements and limitations](#9-requirements-and-limitations)
- [10. Where this differs from WooCommerce's setup wizard](#10-where-this-differs-from-woocommerces-setup-wizard)

---

## 1. Quick start

Activate the plugin from **Plugins**. The next admin page load opens the wizard at
`admin.php?page=kirki-ecommerce#/onboarding`. Fill in the steps and press
**Create Store**. The final screen shows what was set up and offers three ways out:

| Action | What it does |
|---|---|
| **Add your first product** | Opens the create-product page (`/products/create`). |
| **Go to Dashboard** | Opens the plugin's home route (`/`). |
| **Click here to load sample data!** (link below the card) | Adds the sample products of the store's industry and a starter coupon, then opens the products list (`/products`). |

No action shows while setup or a migration runs. Each action replaces the wizard in
the browser history, so Back does not return to it. When WooCommerce is found and
migrated, only **Go to Dashboard** shows (section 2.2).

## 2. The steps

| Step | Fields | Required |
|---|---|---|
| **1. Store Basics** | Store name, industry (searchable) | Store name. Industry defaults to *Other*. |
| **2. Business Info** | Country, plus an optional address (line 1, line 2, city, postcode, state) | Country. Every address field is optional. |
| **3. Essentials** | Currency (searchable, with flags); "Collect sales tax?" | Currency. |
| **4. Store Tax** (only when tax is *Yes*) | "Prices on your products" (*Including tax* / *Excluding Tax*, default *Excluding Tax*); Tax ID | Nothing. |

- **Header.** The header shows "Step N" and the step name, with no total. The
  progress bar counts the steps already done. The final screen is one more equal part,
  so the bar has 5 parts when tax is *Yes* and 4 when it is *No, not yet*. It is empty
  on step 1 and never full on an input step. The final screen, after **Create Store**,
  fills the last part (see 2.2) and shows "Setup Complete" with no step number.
- **Primary action.** Essentials shows **Continue** when tax is *Yes* and
  **Create Store** when it is *No, not yet*. The note "Shop, Cart, Checkout and
  Account pages will be created" shows only above **Create Store**.

- **Country detection.** The country is preselected from the browser's time zone,
  falling back to the region of its preferred language. No location permission is
  requested and nothing is sent off the site. When neither identifies a known
  country, the field is left empty.
- **Currency preselection.** On entering step 3 with no currency chosen, the
  selected country's currency is preselected if it is in the currency list.
  Changing the country afterwards never overwrites a currency already chosen.
- **Draft.** Entered values and the current step survive a refresh within the same
  browser tab (`sessionStorage` key `kirki-ecommerce:onboarding-draft`). The draft
  is cleared when the store is created. A draft saved on Store Tax whose tax answer
  is no longer *Yes* reopens on Essentials.

### 2.1 Prefill from WooCommerce

When WooCommerce is installed and its version is supported (7.0 or higher), the
wizard reads the store facts from `GET /onboarding/defaults` and uses them as the
first answers. Every field stays editable.

| Field | Read from | When missing |
|---|---|---|
| Store name | WordPress site title (`blogname`) | Empty |
| Industry | First entry of `woocommerce_onboarding_profile['industry']`, mapped to the Kirki list (see below) | Empty |
| Country | `woocommerce_default_country` (the state part is dropped) | Browser detection |
| Address lines, city, postcode | `woocommerce_store_address`, `_2`, `_city`, `_postcode`, only with a country | Empty |
| Currency | `woocommerce_currency` | Country currency |
| Collect sales tax? | `woocommerce_calc_taxes` | *No, not yet* |
| Prices on your products | `woocommerce_prices_include_tax`, when tax is collected | *Excluding Tax* |

The industry map (WooCommerce key → Kirki industry): `clothing_and_accessories` → Fashion &
Apparel; `health_and_beauty` → Beauty, Cosmetics & Personal Care;
`electronics_and_computers` → Electronics & Accessories; `food_and_drink` → Food, Beverage
& Gourmet; `home_furniture_and_garden` → Home Decor & Furniture; `arts_and_crafts` → Arts &
Crafts Supplies; `sports_and_recreation` → Sports & Fitness; `other` → Other. Only the
first entry counts. Any other WooCommerce industry has no Kirki match, so the field stays
empty and the merchant picks one. A dash form of a key (`health-and-beauty`) is read the
same way.

A country or currency that Kirki does not know is ignored. A saved draft (see
below) wins over the prefill. The wizard waits for this read before it shows step 1.

### 2.2 The final screen with WooCommerce

When WooCommerce is found, the final screen adds a last row, **WooCommerce
Migration**, after Configurations. Once the setup rows are done it migrates every
group with no choice screen (see [migration.md](migration.md)).

- Each row shows a ring that fills, then a check. The Migrate row ring shows the real
  migration percent.
- The top bar fills the last part without a reset. With WooCommerce, the setup rows
  fill the first 10% of that part and the migration fills the other 90%. Without
  WooCommerce, the setup rows fill all of it. If setup or the migration fails, the bar
  stops where it is.
- The left text reads "Setting up · <row>" while a setup row runs and
  "Migrating · <current step>" while the migration runs. The right label stays
  "Setup Complete".
- When it ends, only **Go to Dashboard** shows, and the sample data link is hidden.
- When it fails, the screen shows the error with **Retry** and **Go to Dashboard**.
- There is no **Revert**, and no other place to start a migration.

## 3. What "Create Store" does

One request, `POST /wp-json/kirki/ecommerce/v1/onboarding`, runs these steps in
order:

1. **Baseline seed.** Default settings. Each group is skipped when it already
   holds data. The default payment settings add two offline payment
   methods, *Cash on Delivery* and *Direct bank transfer*. Both are **disabled**:
   the merchant enables one from the Home page's setup checklist (see
   [`docs/home.md`](home.md)).
2. **General settings.** Store name, industry and Tax ID. The store address gets
   the selected country plus any address fields entered. Tax calculation is turned
   on for *Yes* and off for *No, not yet*.
3. **Tax settings.** Prices are tax-inclusive only for *Including tax*.
4. **Base currency.** The selected currency is created from the bundled currency
   list if it isn't stored yet, then made the only base currency (active, exchange
   rate 1). If it was already stored, the other currencies' rates are recalculated
   against it; if it was just created, they are left unchanged (see
   [`docs/currencies.md`](currencies.md#3-changing-the-base-currency)).
5. **Storefront pages.** Shop, Cart, Checkout and Account are created and published,
   or reused if already assigned in **Settings → Advanced**.
6. **Presets.** The industry and location presets are applied (see
   [section 4](#4-industry-and-location-presets)).
7. **Checklist and hook.** The Home checklist records which of its tax and
   shipping steps already have data (see
   [`docs/home.md`](home.md#5-preconfigured-steps)), and
   `kirki_ecommerce_store_created` fires.

The completion screen is titled "Your store is almost ready". The rows complete one at a time,
about 400 ms apart, in the order Location, Currency, Store pages, Tax, Configurations.
*Configurations* reads "Essentials, Shipping, Tax, Legal pages" ("Tax" only when the
merchant collects tax). It completes with the other rows, also when the presets
were skipped. A setup failure is shown as soon as it happens: rows not yet complete
stop, and **Try again** replaces the two buttons. A retry starts the rows again from
the first.

The completion record (`kirki_ecommerce_onboarding_completed_at`, a Unix timestamp)
is written only after every step succeeds. Every step is safe to repeat, so a
failed setup can be retried from the completion screen. Once onboarding is
complete, further setup requests are rejected with `409`.

The Tax ID can be changed later under **Settings → General → Store Contact
Details**.

## 4. Industry and location presets

Store setup gives the store a starting configuration from the chosen industry
and country, so the merchant reviews data instead of creating it from nothing.
The text in the presets is English.

### 4.1 Where the data comes from

The presets come from a static file on S3, `presets.json`, below the base URL in
the `KIRKI_ECOMMERCE_PRESETS_URL` constant. The plugin file defines it, and a
definition in `wp-config.php` wins:

```php
define('KIRKI_ECOMMERCE_PRESETS_URL', 'https://kirki-ecommerce.s3.us-east-1.amazonaws.com/preconfigured-data');
```

The plugin does not ship the file. `LocalPresetSource` reads it through
`PresetRepository` (one request, 10-second timeout) and builds the records of one
store from the saved store settings: the industry, the store address country and
state, the base currency and the tax switch. The editable source, the S3 layout
and the publish command are described in [`docs/preset-data.md`](preset-data.md).

The plugin requests only an `https://` URL, or an `http://` URL on `localhost`,
`127.0.0.1`, `host.docker.internal` or a `.test` host. The file must carry a
`version` that the plugin supports (currently `2`).

**Failures are silent.** When the request fails, the URL is not trusted, the
status is not 2xx, the body is not JSON, or the version is not supported, nothing
is written and the failure is logged with the URL and the status. Store setup
still succeeds, and the *Configurations* row still completes.

**Once per store.** When the presets end, with data or without, store setup
records `kirki_ecommerce_presets_applied_at`. A setup that runs again does not
apply them again.

### 4.2 The built records

`LocalPresetSource` makes every choice that depends on the store (destinations,
amounts, GDPR wording, tax mode, home state). It gives one key for each preset
kind, and each kind's inserter reads only its key:

| Key | Holds |
|---|---|
| `attributes` | `name`, `slug`, `type` (`color` or `list`), `values` (`value`, optional hex `color`) |
| `schema_profiles` | Stored fields of each record |
| `shipping_profiles`, `tax_profiles` | `key`, `name`, `is_default` |
| `legal` | `pages` (`key`, `slug`, `title`, `content`) and `consents` (`title`, `locations`, `method`, `message` with `{page:<key>}` tokens) |
| `shipping_zones` | `title`, `is_enabled`, `regions`, `methods` (stored method fields plus `rules`) |
| `tax_region` | The stored region, or `null` when no region applies. `rules`, and each state's `rules`, use `{profile, action}`. |

A rule refers to a profile by its `key`: `{"profile": "fragile", "action":
{"type": "multiply_shipping_cost", "value": 1.25}}`. The plugin turns the key
into the profile id. The plugin also adds the ids it owns (UUIDs of zones,
methods and consents) and turns `{page:<key>}` into the real page token.

The inserters check each record, so a hand-edited data file cannot write bad
data. They sanitize text, cast numbers, and skip a record they cannot use, and
log it: an attribute of an unknown type, a zone with no known country, a method
type other than flat rate or local pickup, a rule action that is not allowed for
its profile kind, or a rule for a profile that was not created. The rest is
still written.

### 4.3 The preset data file

| Section | Holds | Applies to |
|---|---|---|
| `common` | Color attribute, default schema profile, *General* shipping profile, *Standard* tax profile, generic shipping methods, zone titles, legal pages and consents | Every store |
| `industries.<slug>` | Attributes, shipping profiles and their rule templates, tax profiles. No categories and no tags: they are in the industry's products file (section 5). | The chosen industry. *Other* has an entry with attributes only. An industry with no entry gets nothing from this section. |
| `countries.<ISO2>` | `bloc`, `gdpr`, shipping methods with local-currency amounts, `tax` (mode, rates, rates per tax profile, `source` or `sources`, `verified_at`) | The chosen country |
| `blocs.<code>` | Member country codes of a trade bloc (`EU`, `GCC`) | Countries whose entry names the bloc |

A country's currency and its EU membership come from the bundled country
dataset. A unit test fails if `blocs.EU` does not match that dataset.

### 4.4 What is written

| Preset | What the store gets | Skipped when |
|---|---|---|
| Attributes | *Color* (30 named colours with hex codes) plus the industry's attributes (for example *Size* and *Material* for Fashion & Apparel). The industry's extra colours, such as *Marigold*, are not added here: the sample data adds them when a product needs them. | An attribute with the same slug exists (checked per attribute) |
| Schema profile | One default profile with every field the schema picker supports | Any schema profile exists |
| Shipping profiles | *General* (default) plus the industry's profiles, such as *Fragile* or *Perishable* | A profile with the same name exists. *General* is the default only when no default exists. |
| Tax profiles | *Standard* (default) plus the industry's profiles, such as *Food*. Created even when the merchant does not collect tax. | A profile with the same name exists |
| Legal pages | Published *Terms & Conditions*, *Privacy Policy* and *Refund & Returns Policy* pages with placeholder text | A page with the slug exists. A **published** WordPress privacy page (Settings → Privacy) is used in place of a new privacy page. |
| Consents | Terms (checkout, mandatory), Privacy (signup and checkout), Marketing emails (signup and checkout, optional). Privacy is a mandatory checkbox where the country has a GDPR-style law, and display text elsewhere. | Any consent exists |
| Shipping zones | *Domestic* (the store country), then *Regional* (the other members of the country's bloc, if it has one). There is no zone for the rest of the world. A region with a country and no state is saved with every state of that country selected. | Any zone exists |
| Tax region | One enabled region for the store country (see 4.6) | The merchant does not collect tax, no region applies, or any region exists |

Each kind checks its own target. A kind that fails is logged, and the other
kinds are still written. Profiles are written before zones and the tax region,
whose rules need their ids.

Store setup creates **no categories and no tags**. They come with the sample data
(section 5), or from the merchant, or from the WooCommerce migration.

### 4.5 Shipping amounts follow the currency

Shipping method amounts in a country entry are in that country's currency.
They are used, and the methods enabled, only when the store's base currency is
that currency. With any other base currency, and for countries with no method
data, the same methods are created **disabled with a rate of 0**, so no wrong
amount is ever charged. The Home shipping step then asks the merchant to set them.

Industry rules on the preset methods only multiply the cost or disable the
method. They never add a fixed amount, because an amount would have the same
currency problem. For example, Food, Beverage & Gourmet disables Regional
methods for *Perishable* items and multiplies every method by 1.25 for
*Fragile* items.

### 4.6 Tax regions and rules

| `tax.mode` | Region | Example |
|---|---|---|
| `country` | A general region with one country-wide product and shipping rate | Bangladesh 15%, United Kingdom 20% |
| `eu` | One *European Union* region of type **micro business** that holds one country, the store's country, with its standard rate. A micro-business region holds exactly one country, the same as the admin form allows. | Any EU member |
| `states` | A general per-state region. `scope: home` lists only the store address state. `scope: all` lists every state, and the home state also gets its `home_extra` rate. | US (home state only), Canada (GST/HST everywhere, plus PST/QST in the home province) |

The address state is matched by its id in the bundled state dataset. The address
is optional in the wizard, so a `states` country still gets a region when the
store address has no state, or a state with no preset:

- With `scope: home` (US), the region has no states. The merchant adds their
  state in *Settings > Tax*. A state with no preset is a state with no sales
  tax (for example Oregon), so an empty region is correct for it.
- With `scope: all` (Canada), the region lists every state, because the
  federal tax applies everywhere. Only the home state's `home_extra` rate is
  left out.

Where the home country charges one of the created tax profiles at another rate
than the standard rate (`profile_rates`), the region gets a rule "tax profile is
*X* → set product tax rate". The rate can be lower or higher than the standard
rate. An `{"exempt": true}` entry becomes "set product tax exempt". A rate of
`0` stays a 0% rate, because zero-rated and exempt are different in law.

A per-state region has no region-level rules. Country-wide `profile_rates` go on
every listed state, and a state's own `profile_rates` replace them for that
state. For example, Canada zero-rates basic groceries in every province, and
Ontario's books are charged GST only.

Rules exist for 37 countries: investment gold is exempt in all EU members,
22 EU members have rates for one or more of food, books, children's clothing,
car seats, sanitary products and other profiles, and there are rules for GB,
CH, NO, IS, JP, AU, MX, ZA, Canada (groceries and the provincial book and children's goods
rebates) and 38 US states (groceries, and alcohol in Minnesota). A rule is added
only when a source gives one rate for the category.

### 4.7 Order and invoice numbers

The presets do not change order or invoice number settings. No country found
sets a specific number *format*. The EU VAT Directive (2006/112/EC, Art. 226)
requires only a unique sequential number in one or more series. Rules that go
further (Portugal's ATCUD, which needs certified software, or yearly series that
are common practice but not required) are not deterministic formats the plugin
can set.

## 5. Loading sample data

The link **Click here to load sample data!** sits below the completion card. It runs
the same import as the Home checklist (see [`docs/home.md`](home.md)), but shows a
spinner and text instead of a progress bar: first "Downloading product sample...",
then "Creating products..." while the request runs. When the import succeeds, the
products list opens. When it fails, an error toast shows and the link comes back.
**Add your first product** and **Go to Dashboard** stay usable during the import.

The import calls `POST /wp-json/kirki/ecommerce/v1/onboarding/sample-data`,
which is only available after onboarding. It reads two files from the preset
location (section 4.1): `<industry>/products.json` and `presets.json`. A store
whose industry is *Other*, or whose industry has no products file (S3 answers 404
or 403), gets the `other` set, `other/products.json`. A products file holds the
industry's categories, tags and products. Every industry has five sample products:
a simple product, a product with variants, a product on sale, a product with an
order limit or unit pricing, and a product with mixed stock levels. Their titles
say which one they are.

First, the import **finds or creates the categories and tags** of the file, by
slug. A new category is created under its parent, with its level. A category or
tag that the store already has with the same slug (made by the merchant, or
brought in by the WooCommerce migration) is reused and never changed.

Then, for each product, the import:

1. **Skips it** when the store has a variant with one of its SKUs.
2. **Links its categories and tags by slug.**
3. **Creates missing attribute values from the presets.** The definitions are the
   common attributes and the industry's attributes, merged by slug. When a variant
   uses *Color: Marigold* and the store's *Color* attribute has no *Marigold*, the
   value is created with the hex code of the industry's `color` entry. A missing
   attribute is created the same way. Existing attributes and values are reused
   and never changed.
4. **Downloads the images** from `<industry>/images/` into the media library. An
   image that an earlier load already downloaded (matched by its full URL) is
   reused. An image that fails to download is left out, and the product is still
   created.
5. **Creates the product**, published, with the slug of the file, its ribbon,
   descriptions and variants. Each variant gets its SKU, price, sale price, cost,
   stock, low-stock threshold, backorder setting, order limit, weight in grams and
   unit price (for example *per 100 g*).

Prices in the data are numbers such as `"38.00"`. They are used in the store's
base currency, with no exchange rate: 38.00 is 38.00 EUR in a euro store and
¥38 in a yen store.

Each product is created on its own, so a load that was cut off (for example by a
PHP time limit on slow image downloads) can run again and creates only the
products that are missing. A product that fails is logged, and the next one still
runs. When the products file or `presets.json` cannot be read, the request fails
with `503` and creates nothing, not even a category.

With the sample products, the import creates the starter coupon `WELCOME50`: 50%
off the order, all products, every customer, no end date, **inactive**. The
merchant turns it on in Coupons. When a coupon with that code already exists,
it is left unchanged. The store presets do not create a coupon.

## 6. When the wizard is shown

- **After activation.** A single, interactive activation from wp-admin redirects to
  the wizard once. Bulk activation, network-wide activation and WP-CLI activation
  don't redirect. Neither does re-activating a store that is already onboarded.
- **Before completion.** Every route of the plugin's admin app redirects to the
  wizard. There is no skip.
- **After completion.** Every wizard URL redirects to the home route. Refreshing
  the completion screen counts too, so loading sample data is a one-time choice
  made on that screen.

The gate lives in the admin app, using the `is_onboarded` flag in
`window.kirki_ecommerce`. It is a navigation guarantee, not a security boundary:
the REST API stays protected by its own capability checks.

## 7. Extension points

| Hook / class | Use it to |
|---|---|
| `kirki_ecommerce_store_created` (action) | React to a new store. Receives the submitted setup values: store name, industry, country, address, currency, tax answers and Tax ID. |
| `StorePresetService::apply(PresetContext $context)` | Apply the presets. `PresetContext::from_settings()` builds the context from the saved settings. |
| `SampleDataImporter::import()` | Load the sample products of the saved industry and the starter coupon. Throws with a `503` status when the data cannot be read. |
| `PresetRepository::get_products(string $industry)` | Read the products file of an industry (categories, tags, products and the `set` it came from), with the `other` fallback. Returns `null` when it cannot be read. |
| `KIRKI_ECOMMERCE_PRESETS_URL` (constant) | Point the plugin at another preset location, for example a test bucket. |

## 8. Resetting onboarding in development

Delete the completion record to see the wizard again, and the presets record to
let the presets run again:

```bash
wp option delete kirki_ecommerce_onboarding_completed_at
wp option delete kirki_ecommerce_presets_applied_at
```

Then clear the browser tab's `sessionStorage` draft, or open a new tab, to start
from step one.

## 9. Requirements and limitations

- **Sample prices are not converted.** The sample products carry fixed price
  figures written for US dollars. In a store with another base currency the same
  figures are shown in that currency (for example ৳38 for a tote bag).
- **A store without sample data has no categories.** Store setup creates none.
  The merchant creates them, migrates them from WooCommerce, or loads sample data.
- **Sample categories can sit next to migrated ones.** Sample data loaded after a
  WooCommerce migration adds its categories and tags next to the merchant's own.
  Only a category or tag with the same slug is shared.
- **Every store depends on one public bucket.** The presets and the sample data
  come from `kirki-ecommerce.s3.us-east-1.amazonaws.com`. While a file there is
  missing or not public, store setup applies no presets and sample data fails
  with `503`.
- **The Tax ID is not printed on invoices yet.** It is stored and editable, but no
  invoice template reads it.
- **Preset rates are a starting point, not tax advice.** Rates change. Each
  country's `tax` entry records its `source` and the date it was `verified_at`,
  so out-of-date data can be found. The Home checklist marks preset tax and
  shipping as *preconfigured* until the merchant confirms them.
- **Not every VAT country has a tax preset.** 97 countries have one. Countries
  whose 2026 rate could not be confirmed from a source (for example Ghana, Iran,
  Malaysia, Brazil, Russia and Vietnam) get no tax region until a sourced rate is
  added to the preset data and published (see [`docs/preset-data.md`](preset-data.md)).
- **Most countries have no tax profile rules.** About 60 taxed countries get
  only the standard rate, because no source gave their rates by category. A
  category with more than one rate in a country (for example food in Spain or
  Italy) gets no rule. Per-litre excise duties, such as most alcohol duties,
  cannot be set as a rate and are not included.
- **No shipping outside the preset zones.** There is no Rest of World zone. A
  shopper outside the Domestic and Regional zones sees no shipping method until
  the merchant adds a zone.
- **Presets that cannot be read are not reported, and are not tried again.** When
  S3 cannot be reached during store setup, the merchant sees the *Configurations*
  row complete, and the store has no preset attributes, profiles, zones, tax
  region or legal pages. The presets count as applied, so a
  later setup does not request them again. The Home checklist still shows
  shipping and tax as steps to do.
- **New data reaches only new stores.** A corrected rate or a new sample product is
  live as soon as it is published to S3, with no plugin release. Presets are
  applied once, so stores that were set up before it do not get the change.
- **US local sales tax is not included.** Only the state base rate of the home
  state is set. City and county rates are not.
- **Shipping tax uses the product rate.** A state or country without its own
  `shipping_rate` taxes shipping at its product rate. Some US states do not tax
  shipping.
- **Preset text is English.** Profile names, method names and consent messages
  are written as they are in the data file.
- **EU tax rules apply to every member country.** A profile rule on the EU region
  (for example *Food* at 7% for a German store) is right for a micro business,
  which charges its home rate. If the merchant changes the region to OSS, they
  must add the rates of the other member countries and check those rules.
- **Micro business now charges the rate of its one country.** An EU region of
  type micro business charges the rate of the one country it holds to every EU
  shopper, whatever the store address. Before this change, it charged the
  shopper's country rate, the same as OSS.
- **Admin chrome is hidden while the wizard is open.** The wizard covers the screen
  and hides the admin bar and menu. Admin notices from other plugins reappear on
  the next page.
- **Pre-beta (alpha) installs are not migrated.** Version `1.0.0-beta.1` is treated
  as the first version.

## 10. Where this differs from WooCommerce's setup wizard

- **No skip.** WooCommerce lets you skip its setup; here the plugin's pages stay
  behind the wizard until it is finished. The rest of wp-admin is unaffected.
- **No payment, shipping or extension steps.** Those are configured in Settings
  afterwards. Shipping zones, a tax region, profiles and legal consents
  are preset from the industry and country instead of asked for, and the setup
  checklist on the Home page leads the merchant to review them.
- **Presets cover fewer countries than a tax service.** Rates come from a
  static file, not from a live tax service, and only countries with
  a national VAT or GST have a tax preset.
- **Presets and sample data are downloaded.** Country detection is local. Store
  setup downloads `presets.json`, and loading sample data downloads the products
  file and the images, from the preset location. These are plain GET requests,
  and no site data is sent. WooCommerce's sample products come in a CSV file in
  the plugin instead.
- **Sample products follow the industry.** WooCommerce imports one sample catalog
  for every store. Here each industry has its own products, categories and tags,
  and store setup creates no categories or tags of its own.
- **Shorter.** Three steps (four when collecting tax), with only store name, country
  and currency required.
- **Prefill from WooCommerce.** WooCommerce's wizard does not read another plugin's
  store. This one reads WooCommerce only. It has no import from other plugins
  and no industry guess from product categories.
- **Industry is a best effort.** WooCommerce keeps its industry in a private profile
  option. Only six of its industries map to a Kirki industry; the others leave the
  field empty.
- **The state of the address is not prefilled.** Kirki names states by its own ids.
- **The migration is all or nothing.** There is no choice of groups, and no revert.

