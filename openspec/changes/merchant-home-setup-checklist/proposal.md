## Why

After onboarding, the merchant lands on `#/`, which only redirects to the products
list. The `Home` submenu is registered but hidden. Nothing tells a new merchant what
is still missing before the store can sell: products, a way to get paid, tax and
shipping. A Home page with a setup checklist turns the dashboard's front door into
that guide.

## What Changes

- **New Home page** at `#/` (replacing the redirect to `#/products`):
  - "Let's get you started" heading with a **View Live Site** link (opens the site
    URL in a new tab).
  - A **setup checklist** card.
  - A **static template gallery** (three cards plus "Explore more"). Images and
    links are placeholders for now.
- **Setup checklist**:
  - Progress header: "X out of N complete" plus a percentage bar.
  - An accordion of steps. Only one step is open at a time, and the first
    incomplete step is open on load.
  - Each step shows a number circle. The circle is tinted while the step is
    expanded and becomes a green check once the step is complete.
  - Steps are numbered by position.
  - The steps:
    1. **List your products** (3 min): complete when at least one product exists.
       CTAs "Add products" and, while the store has no products, "Load sample
       data". During the import, that button shows the two-phase progress inside
       itself ("Downloading product sample..." is faked for now, then "Creating
       products..." runs the existing sample-data import). On success, the button
       is removed, step 1 is checked, and the next incomplete step opens.
    2. **Set up payments**: complete when at least one payment method is enabled
       and has all its required settings filled.
       CTAs "Add payment" and "Cash on delivery", both opening Payment settings.
    3. **Customize your store**: always completed, with no CTAs. It is counted
       in N.
    4. **Collect sales tax**: shown only when `general.is_tax_calculation_enabled`
       is on. Completes when at least one enabled tax region has a product tax
       rate above 0. If tax data
       was preconfigured during onboarding, the CTA reads "Update tax rate" and
       the step completes when it is clicked.
    5. **Add shipping method**: same pattern as tax. The rule needs an enabled
       shipping zone with at least one enabled shipping method, and the CTA is
       "Add shipping" / "Update shipping rate".
  - Completion is **sticky**: once a step is completed, it is recorded in
    `wp_options` and never reverts.
- **Preconfigured snapshot**: at the end of store setup, the steps that already
  have qualifying data are recorded. Those steps need an explicit "Update …" click
  instead of auto-completing.
- **New REST endpoints**:
  - `GET /setup-checklist`: evaluates the steps, persists newly met steps and
    returns their state.
  - `POST /setup-checklist/{step}/complete`: the "Update …" click.
- **Onboarding payment seed changes**: the seed adds **Cash on Delivery** and
  **Direct bank transfer**, each with instructions, and both **disabled**.
  Previously COD was seeded enabled. **BREAKING (pre-release only)**: a fresh
  store has no enabled payment method until the merchant enables one.
- **Home submenu** now points at `kirki-ecommerce#/`, and the inline style that
  hid it is removed.

## Capabilities

### New Capabilities
- `merchant-home-page`: the Home route and page shell. Covers the heading, View
  Live Site, where the checklist is placed, the static template gallery and the
  Home admin submenu.
- `store-setup-checklist`: the checklist steps. Covers which steps are visible,
  their content and CTAs, completion rules, sticky persistence in options, the
  preconfigured snapshot, click-to-complete, progress counting, numbering and
  accordion behaviour.

### Modified Capabilities
- `onboarding-seed-data`: the "Store settings have onboarding defaults"
  requirement changes. Payment defaults become two disabled offline methods
  (Cash on Delivery and Direct bank transfer) instead of one enabled COD.

## Impact

- **PHP**
  - New `SetupChecklistService` and `SetupChecklistController`.
  - New option keys in `app/Constants/OptionKeys.php`.
  - `StoreSetupService::setup()` records the preconfigured snapshot.
  - `database/seeders/OnBoarding/SettingsSeeder.php` seeds both offline methods
    disabled.
  - `app/Menu/Home.php` gets the new slug and no longer hides the submenu.
  - New routes in `routes/api.php`.
- **React**
  - New `resources/app/features/home/` with routes, page, checklist components,
    service, step definitions and a static template list.
  - `resources/app/routes.tsx` drops the `/` → `/products` redirect.
  - The Home "Load sample data" button reuses the existing
    `POST /onboarding/sample-data` endpoint. No PHP change is needed for it.
- **REST API**: new `GET /kirki/ecommerce/v1/setup-checklist` and
  `POST /kirki/ecommerce/v1/setup-checklist/{step}/complete`.
- **Docs**: new `docs/home.md`.
- **No new dependencies.** The page reuses the existing `Accordion`, `Card`,
  `Button` and `Image` UI primitives.
