## Why

A freshly activated store today is configured silently: the `1.0.0-alpha.1`
version-update callback forces USD as the base currency and imports demo
products, without asking the merchant anything. Merchants land on a store priced in the
wrong currency, with no name or address, and full of products they didn't ask for.
A short guided setup on first activation collects the few facts the store can't
guess: name, industry, country, currency and tax stance. Sample data becomes opt-in.
The partly built backend for this (`OnboardingController`, `OnboardingRequest`)
exists but nothing calls it.

## What Changes

- **New onboarding wizard** at `#/onboarding` in the admin SPA. It is rendered
  full-screen with the Kirki eCommerce logo, a three-step progress bar and a card:
  - Store basics: store name (required) and industry (searchable; defaults to "Other").
  - Business info: country (required, guessed from the browser's timezone/locale),
    plus an optional "Add address" panel.
  - Essentials: currency (required, searchable, with flags, preselected from the
    country), "Collect sales tax?" (default No). If Yes, it asks whether prices are
    tax-inclusive and for an optional Tax ID.
  - Setup complete: a summary of Location, Currency, Store pages and, when enabled,
    Tax, with "Go to dashboard" and "Load sample data" actions.
- **Onboarding gate.** Activation redirects once to the wizard. Until onboarding is
  completed, every plugin admin route redirects to it. After completion, the wizard
  redirects to `/`. A completion record is stored in `wp_options`. Other wp-admin
  pages are never redirected.
- **Store setup on "Create Store"** through one `POST /onboarding` request. It:
  - saves store name, industry, country, address and Tax ID to general settings;
  - creates the chosen currency and makes it the base currency;
  - sets tax calculation on/off and tax-inclusive pricing;
  - creates the Shop/Cart/Checkout/Account pages;
  - runs the structural onboarding seeds (categories, attributes, schema profiles,
    settings defaults);
  - calls an empty industry/location presets placeholder, then fires
    `kirki_ecommerce_store_created`.
- **Load sample data** through `POST /onboarding/sample-data`. It calls a
  `SampleDataImporter` that runs the bundled demo product seeder for now; its body is
  meant to become the remote import later.
- **BREAKING (pre-release only):** the onboarding seed no longer runs on install, and
  USD is no longer forced as the base currency. `config/version-updates.php` collapses
  to the migrator plus a single `1.0.0-beta.1` entry. Alpha installs get no
  compatibility path: beta is treated as the first version.
- **General settings** gain a `store_tax_id` field, editable on the General settings
  page.
- **`OnboardingRequest`** is reworked: address fields are all optional, the address
  carries no country (country is a top-level field), and the tax fields are added.

## Capabilities

### New Capabilities
- `store-onboarding-gate`: when the wizard is shown. Covers the activation redirect,
  the completion record, gating plugin routes until completion, and redirecting away
  from the wizard afterwards.
- `store-onboarding-wizard`: the wizard screens. Covers fields, defaults, required
  rules, country and currency detection, step navigation, draft persistence and the
  completion summary.
- `store-setup`: what "Create Store" and "Load sample data" do on the server. Covers
  settings writes, base currency, tax switches, page creation, structural seeds, the
  presets seam, re-run safety and the Tax ID setting.

### Modified Capabilities
- `onboarding-seed-data`: seeding moves from the `1.0.0-alpha.1` version update to
  store setup. The base currency becomes the merchant's choice instead of USD. Demo
  products, with their image import and bundled-image cleanup, run only when the
  merchant loads sample data.

## Impact

- **PHP**
  - Rework `app/Http/Controllers/Api/OnboardingController.php` and
    `app/Http/Requests/Settings/OnboardingRequest.php`.
  - New `StoreSetupService` and `SampleDataImporter` under `app/Services/`.
  - New option key(s) in `app/Constants/OptionKeys.php`.
  - Activation redirect in `app/KirkiEcommerce.php` plus an `admin_init` hook.
  - Completion flag added to the boot config in
    `app/Supports/Assets.php::get_kirki_ecommerce_configs()`.
  - Changes to `config/version-updates.php` and the `database/seeders/OnBoarding/*`
    entry points.
  - New route in `routes/api.php`.
- **React**
  - New `resources/app/features/onboarding/`: routes, pages, form schema and payload
    test, service, timezone→country table.
  - Route gate in `resources/app/routes.tsx`.
  - Tax ID field added to the General settings page and its form schema.
- **REST API**
  - `POST /kirki/ecommerce/v1/onboarding`: payload shape changes.
  - New `POST /kirki/ecommerce/v1/onboarding/sample-data`.
- **Docs**: new `docs/onboarding.md`.
- **No new dependencies.** Country detection uses a bundled table and makes no
  network or geolocation call.
