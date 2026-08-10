## Why

A fresh install of the plugin is not functional. Activation runs migrations and sets up the
scheduler, and nothing else — the `currencies`, `product_schema`, `shipping_profiles`,
`tax_profiles`, and `shipping_boxes` tables are all left empty, and no storefront pages are
created. The only path that populates them today is `wp kirki db:seed`, a developer command
that also inserts demo products, customers, carts, orders, and refunds.

The concrete breakage: with an empty `currencies` table, `CurrencyRepository::find_base()`
returns `null`, so the `base_currency()` helper returns `null` and `Site\CheckoutController`
fatals on `base_currency()->code`. Onboarding cannot repair this either — it calls
`CurrencyService::set_base()`, which throws `NotFoundException` for every currency code
because there are no rows to match against.

Onboarding is intended to be optional. It should let a merchant customize an already-working
store, not be the thing that makes the store work.

## What Changes

- **New installer** that runs on plugin activation after migrations, is idempotent, and seeds
  only the data other code holds references to:
  - `currencies` — a set of common currencies with USD as `is_base`
  - `product_schema` — the default JSON-LD schema template (`is_default = true`)
  - `shipping_profiles`, `tax_profiles`, `shipping_boxes` — the curated defaults currently
    living in the demo seeders
- **Storefront pages** — the installer creates Shop, Cart, Checkout, and My Account WP pages
  and records their IDs in a `pages` map under **advance** settings, so the site renderer can
  resolve a page ID to a view when it lands. Advance settings is the single home for page
  selection; no other settings section holds a page reference.
- **BREAKING:** `shop_page` is removed from the product settings — from the shipped
  `product.json` defaults and from `SettingsUpdateRequest`'s product rules and filters. It is
  the one page reference living outside advance settings, and keeping it would mean two places
  claiming to say which page is the shop.
- **Settings defaults become production-neutral** — `resources/data/settings/*.json` currently
  ships `store_email: "info@kirki.com"` and enabled EU/BD tax regions with real rates to every
  install. Tax collection defaults to off; the placeholder store email is removed.
  `shipping.json`'s `shipping_zones` is deliberately left untouched so shipping remains
  testable.
- **BREAKING (dev workflow only):** `SettingsSeeder` is removed. It is a second, divergent
  source of truth for settings defaults — it disagrees with the `resources/data/settings/*.json`
  files that `AppSettings::refresh()` actually merges at read time (`store_logo: 7` vs `null`,
  `offline_payments[]` vs `payment_gateways[]`, missing `industry`). Settings defaults stay
  read-time and file-based; nothing writes them to `wp_options` at install.
- The five structural seeders move behind the installer. `DatabaseSeeder` keeps calling them so
  `wp kirki db:seed` still works for developers, but they become insert-if-absent rather than
  blind `insert()`.

Explicitly out of scope:

- **Custom roles/capabilities.** Every admin menu uses `manage_options` and nothing in the
  codebase reads a custom capability, so registering one would be dead code.
- **Sample/demo data import.** The `should_import_samples` `@todo` in `OnboardingController`
  stays a `@todo`.
- **A storefront renderer.** This change creates the pages and records their IDs; it does not
  render anything on them.
- **The merchant-facing page selection UI.** `/settings/advanced` is still a placeholder screen
  with no form, no zod schema, and `@todo` rules on the backend. Building the four page selects
  there — and removing the now-inert `shop_page` field from the Products settings form — is a
  deliberate follow-up. Until it lands, that field renders but no longer persists (see Impact).

## Capabilities

### New Capabilities

- `plugin-installation`: What a fresh install must provision before the plugin is usable —
  the default rows, the storefront pages and their settings mapping, idempotency across
  repeated activations, and the guarantee that a merchant who never opens onboarding still
  has a working store.

### Modified Capabilities

None. No existing spec in `openspec/specs/` describes install-time behavior or the content of
the shipped settings defaults. `shipping-settings` covers the merchant-facing zone/method forms,
whose requirements are unchanged — and `shipping.json`'s zones are being left as-is regardless.

## Impact

**Code**

- `app/KirkiEcommerce.php` — `handle_activation()` gains an installer call
- `app/` — new installer component (namespace/shape decided in design.md)
- `app/Constants/OptionKeys.php` — install-version marker constant
- `app/Http/Requests/Settings/SettingsUpdateRequest.php` — `shop_page` removed from the product
  rules and filters
- `database/seeders/` — `SettingsSeeder` deleted; `CurrencySeeder`, `ProductSchemaSeeder`,
  `ShippingProfilesSeeder`, `TaxProfilesSeeder`, `ShippingBoxesSeeder` become idempotent;
  `DatabaseSeeder` list updated
- `resources/data/settings/general.json`, `tax.json` — neutralized defaults
- `resources/data/settings/product.json` — `shop_page` removed
- `resources/data/settings/advance.json` — gains the `pages` map shape

**Data / runtime**

- New WP pages on activation (Shop, Cart, Checkout, My Account)
- New rows in five plugin tables on activation
- A new `wp_options` entry tracking the completed install version

**React admin SPA — no files changed, one behavior change**

No frontend files are edited in this change. But dropping `shop_page` from the product filters
does change what the Products settings screen does: `Sanitizer` only emits keys that appear in
`filters()`, so a submitted `shop_page` is discarded. The field will visibly clear after save
rather than error — `schemas/catalog/settings.ts` types it `.nullish()`, so the response still
validates, and the form resets from that response. The follow-up change removes the field and
adds the four page selects to `/settings/advanced`.

**Not affected**

- The REST API surface. No new or changed endpoints.
