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
| **Click here to load sample data!** (link below the card) | Adds demo products and a starter coupon, then opens the products list (`/products`). |

All three are disabled until every summary row shows as complete. Each one replaces
the wizard in the browser history, so Back does not return to it.

## 2. The steps

| Step | Fields | Required |
|---|---|---|
| **1. Store Basics** | Store name, industry (searchable) | Store name. Industry defaults to *Other*. |
| **2. Business Info** | Country, plus an optional address (line 1, line 2, city, postcode, state) | Country. Every address field is optional. |
| **3. Essentials** | Currency (searchable, with flags); "Collect sales tax?" | Currency. |
| **4. Store Tax** (only when tax is *Yes*) | "Prices on your products" (*Including tax* / *Excluding Tax*, default *Excluding Tax*); Tax ID | Nothing. |

- **Header.** The header shows "Step N" and the step name, with no total. The
  progress bar counts the steps already done, against 4 steps when tax is *Yes* and
  3 when it is *No, not yet*. It is empty on step 1 and full only on the final
  screen, after **Create Store**. The final screen shows "Setup Complete" with no step number.
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
   rate 1).
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

The presets come from one file bundled with the plugin,
`resources/data/preconfigured-data.json`. No external request is made.
`LocalPresetSource` reads the file through `PresetRepository` and builds the
records of one store from the saved store settings: the industry, the store
address country and state, the base currency and the tax switch.

**Failures are silent.** When the file is missing or cannot be decoded, nothing
is written and the failure is logged. Store setup still succeeds, and the
*Configurations* row still completes.

**Once per store.** When the presets end, with data or without, store setup
records `kirki_ecommerce_presets_applied_at`. A setup that runs again does not
apply them again.

### 4.2 The built records

`LocalPresetSource` makes every choice that depends on the store (destinations,
amounts, GDPR wording, tax mode, home state). It gives one key for each preset
kind, and each kind's inserter reads only its key:

| Key | Holds |
|---|---|
| `categories` | The industry's category tree, two levels (`name`, `description`, `children`) |
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

### 4.3 The bundled data file

| Section | Holds | Applies to |
|---|---|---|
| `common` | Color attribute, default schema profile, *General* shipping profile, *Standard* tax profile, generic shipping methods, zone titles, legal pages and consents | Every store |
| `industries.<slug>` | Categories, attributes, shipping profiles and their rule templates, tax profiles | The chosen industry. *Other*, or an industry with no entry, gets nothing from this section. |
| `countries.<ISO2>` | `bloc`, `gdpr`, shipping methods with local-currency amounts, `tax` (mode, rates, rates per tax profile, `source` or `sources`, `verified_at`) | The chosen country |
| `blocs.<code>` | Member country codes of a trade bloc (`EU`, `GCC`) | Countries whose entry names the bloc |

A country's currency and its EU membership come from the bundled country
dataset. A unit test fails if `blocs.EU` does not match that dataset.

### 4.4 What is written

| Preset | What the store gets | Skipped when |
|---|---|---|
| Categories | The industry's category tree, two levels (for example *Women › Dresses* for Fashion & Apparel). *Other* gets none. | Any category exists |
| Attributes | *Color* (30 named colours with hex codes) plus the industry's attributes (for example *Size* and *Material* for Fashion & Apparel) | An attribute with the same slug exists (checked per attribute) |
| Schema profile | One default profile with every field the schema picker supports | Any schema profile exists |
| Shipping profiles | *General* (default) plus the industry's profiles, such as *Fragile* or *Perishable* | A profile with the same name exists. *General* is the default only when no default exists. |
| Tax profiles | *Standard* (default) plus the industry's profiles, such as *Food*. Created even when the merchant does not collect tax. | A profile with the same name exists |
| Legal pages | Published *Terms & Conditions*, *Privacy Policy* and *Refund & Returns Policy* pages with placeholder text | A page with the slug exists. A **published** WordPress privacy page (Settings → Privacy) is used in place of a new privacy page. |
| Consents | Terms (checkout, mandatory), Privacy (signup and checkout), Marketing emails (signup and checkout, optional). Privacy is a mandatory checkbox where the country has a GDPR-style law, and display text elsewhere. | Any consent exists |
| Shipping zones | *Domestic* (the store country), then *Regional* (the other members of the country's bloc, if it has one). There is no zone for the rest of the world. | Any zone exists |
| Tax region | One enabled region for the store country (see 4.6) | The merchant does not collect tax, no region applies, or any region exists |

Each kind checks its own target. A kind that fails is logged, and the other
kinds are still written. Profiles are written before zones and the tax region,
whose rules need their ids.

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

A `states` country whose store address has no known state gets no region. The
address state is matched by its id in the bundled state dataset.

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
which is only available after onboarding. It currently adds the demo products
bundled with the plugin, with their images imported into the media library. It
first creates any category, attribute or value the demo products need that the
store does not have (for example *Home & Living › Home Décor › Vases*, or
*Material*, which only some industries get), and reuses the ones that exist.

With the demo products, the import creates the starter coupon `WELCOME50`: 50%
off the order, all products, every customer, no end date, **inactive**. The
merchant turns it on in Coupons. When a coupon with that code already exists,
it is left unchanged. The store presets do not create a coupon.

The import does nothing if the store already has products: no demo products and
no coupon.

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
| `SampleDataImporter::import()` | Placeholder for the remote sample data import. It currently loads the bundled demo products and the starter coupon. |

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

- **Demo prices are not converted.** The bundled demo products carry fixed price
  figures written for US dollars. In a store with another base currency the same
  figures are shown in that currency (for example ৳25 for a hoodie).
- **The Tax ID is not printed on invoices yet.** It is stored and editable, but no
  invoice template reads it.
- **Preset rates are a starting point, not tax advice.** Rates change. Each
  country's `tax` entry records its `source` and the date it was `verified_at`,
  so out-of-date data can be found. The Home checklist marks preset tax and
  shipping as *preconfigured* until the merchant confirms them.
- **Not every VAT country has a tax preset.** 97 countries have one. Countries
  whose 2026 rate could not be confirmed from a source (for example Ghana, Iran,
  Malaysia, Brazil, Russia and Vietnam) get no tax region until a sourced rate is
  added to `resources/data/preconfigured-data.json`.
- **Most countries have no tax profile rules.** About 60 taxed countries get
  only the standard rate, because no source gave their rates by category. A
  category with more than one rate in a country (for example food in Spain or
  Italy) gets no rule. Per-litre excise duties, such as most alcohol duties,
  cannot be set as a rate and are not included.
- **No shipping outside the preset zones.** There is no Rest of World zone. A
  shopper outside the Domestic and Regional zones sees no shipping method until
  the merchant adds a zone.
- **A data file that cannot be read is not reported.** The merchant sees the
  *Configurations* row complete. The Home checklist still shows shipping and
  tax as steps to do.
- **New data needs a plugin release.** Rates and industry data ship in the
  plugin, so a corrected rate reaches stores only with an update, and only
  stores set up after it.
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
  bundled file, not from a live tax service, and only countries with
  a national VAT or GST have a tax preset.
- **No remote calls.** Country detection is local, and the presets and sample
  data come from the plugin itself. Nothing is sent off the site.
- **Shorter.** Three steps (four when collecting tax), with only store name, country
  and currency required.
