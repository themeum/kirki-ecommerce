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
- New last row on the completion screen: "WooCommerce Migration · <description>" (the
  source name, then "Migration").
  It runs all groups with no choice screen. It runs only when WooCommerce is present.
- The top bar keeps a last part (one equal part after the input steps) for the completion
  screen and fills it without a reset. With WooCommerce the setup rows fill the first 10%
  of it and the migration the other 90%; without WooCommerce the setup rows fill all of it.
  The left text reads "Setting up · <row>" during setup and "Migrating · <current message>"
  during migration. The right label stays "Setup Complete".
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
- Onboarding is the only place that runs a migration. Remove the standalone migration:
  the `/migration/woo-commerce` route and page, the dashboard "Migrate from WooCommerce"
  button, the scan, summary and revert screens, and `MigrationFlow`.
- **BREAKING (dev data only)**: remove Revert completely. This removes the revert REST
  routes, `MigrationReverter`, `revert_record()` in every group and the settings snapshots.
  A merchant can no longer undo a migration. The database columns stay unused.
- After a successful run, delete the record ledger rows of the source. They only served
  Revert and resume, so a finished run no longer needs them.

## Capabilities

### New Capabilities

- `onboarding-woocommerce-prefill`: read WooCommerce store facts and prefill the wizard.
- `onboarding-migration-step`: automatic migration row, its progress text, rings and button rules.
- `woocommerce-settings-migration`: which WooCommerce settings the Settings group migrates.

### Modified Capabilities

- `store-onboarding-wizard`: completion screen rows, progress rings and button rules change.
- `migration-run-recovery`: the "completed state is saved" requirement is removed.

### Removed Capabilities

- `migration-revert`: Revert is removed completely.
- `migration-group-descriptions`: the scan step that showed the descriptions is removed.

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
