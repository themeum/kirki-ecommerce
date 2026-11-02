## Why

A merchant who moves from WooCommerce enters the same store facts twice: once in the
onboarding wizard and once in the migration. The migration is also hidden behind an
optional button after setup. The wizard should read the WooCommerce store, prefill the
answers, and run the migration as its last step.

## What Changes

- When WooCommerce is installed and its version is supported, the wizard prefills:
  store name (WordPress site title), industry (WooCommerce onboarding profile, mapped to
  the Kirki list), country, store address, base currency, "Collect sales tax", and
  "Including/Excluding tax". A missing value uses today's behavior (for example the
  browser country). A saved session draft wins over a prefill.
- New endpoint that returns these defaults to the wizard.
- New last row on the completion screen: "Migrate from WooCommerce · <description>".
  It runs all groups with no choice screen. It runs only when WooCommerce is present.
- While migration runs, the top bar left text reads "Migrating · <current message>".
  The right label stays "Setup Complete".
- Each row shows a circular progress ring instead of a spinner. The Migrate row ring
  shows the real migration percent.
- No buttons show while setup or migration runs.
  - No WooCommerce / no migration: keep "Add your first product", "Go to Dashboard" and
    the sample data link.
  - WooCommerce present and migration done: only "Go to Dashboard".
  - Migration failed: error, "Retry" and "Go to Dashboard".
- **BREAKING (dev data only)**: the WooCommerce Settings group no longer copies currency,
  store address or tax switches (onboarding owns them). It keeps tax rates and shipping
  zones, and adds units, checkout/account options and inventory options where Kirki has a
  matching setting.
- Remove the optional scan step and the "Skip" path from the onboarding use of
  `MigrationFlow`. The standalone migration page keeps scan, summary and Revert.

## Capabilities

### New Capabilities

- `onboarding-woocommerce-prefill`: read WooCommerce store facts and prefill the wizard.
- `onboarding-migration-step`: automatic migration row, its progress text, rings and button rules.
- `woocommerce-settings-migration`: which WooCommerce settings the Settings group migrates.

### Modified Capabilities

- `store-onboarding-wizard`: completion screen rows, progress rings and button rules change.

## Impact

- PHP: new onboarding defaults endpoint and reader (reuses `VersionProbe`,
  `SettingsReader`); `app/Migration/Sources/WooCommerce/Groups/SettingsGroup.php`,
  `Readers/SettingsReader.php`; `routes`.
- React: `resources/app/features/onboarding` (wizard, `setup-complete-step`,
  `onboarding-shell`, `use-staggered-rows`, services, draft merge), a ring component,
  `features/migration` (auto-run mode of `MigrationFlow`/runner).
- Docs: `docs/onboarding.md`, `docs/migration.md` (with "Where this differs from WooCommerce").
- Tests: wizard, step, hook, schema payload tests; PHP integration tests for the endpoint
  and the Settings group.
