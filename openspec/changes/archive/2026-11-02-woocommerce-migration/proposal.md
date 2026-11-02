## Why

Merchants who install Kirki eCommerce on a site that already runs WooCommerce
must today re-enter their catalog, customers, coupons and order history by
hand. This blocks adoption. A guided migration lets them move over without
data loss and without touching their WooCommerce data.

## What Changes

- Add a source-agnostic migration module at `app/Migration/`. It has a
  Strategy interface for each source plugin and a Template-Method base class
  for each data group. WooCommerce is the first source. Other plugins (for
  example FluentCart) can be added later as new folders under `Sources/`.
- Add detection and scan. The system detects WooCommerce and its version,
  detects known extension plugins, and counts each data group. Only groups
  that map to Kirki DTOs are offered.
- Add chunked migration. The browser sends one HTTP request for each chunk
  (30-50 items) of one group. The server saves a cursor after each chunk, so a
  failed run can resume.
- Add an id-map table. It records the Kirki id of each migrated source row, so
  later groups (for example orders) link to the correct products, variants,
  customers and coupons. It also makes the run safe to repeat.
- Add WooCommerce readers and mappers for: catalog (categories, tags, brands,
  attributes, products with variations), customers with addresses, coupons,
  orders (items, notes, refunds) and settings (currency, store address, tax
  rates, shipping zones). Order readers exist for both legacy post storage and
  HPOS. Capability probes choose the reader. A minimum WooCommerce version is
  enforced.
- Add a migration mode that suppresses emails, stock changes, coupon usage
  counting and events during import, and keeps original dates and numbers.
- Add data safety rules: add-only, no change to existing Kirki rows, no
  deletion or write in WooCommerce data, no copy of payment credentials or
  passwords.
- Update the onboarding flow: the last screen shows "Migrate from WooCommerce"
  when WooCommerce is detected. A new screen shows a skeleton loader during
  the scan, then a checkbox list of groups with counts, with "Skip" and
  "Migrate" buttons. During migration the progress bar and a status message
  show the current action. At the end a "Go to dashboard" button is shown.
- Add `docs/migration.md`, with a "Where this differs from WooCommerce" section.

## Capabilities

### New Capabilities

- `migration-core`: Source Strategy contract, group Template-Method contract,
  runner, chunk size, REST endpoints, error and skipped-item reporting.
- `migration-state-and-resume`: Persistent run state, per-group cursor and
  counts, id-map, idempotent re-run, resume after error.
- `migration-data-safety`: Add-only rule, duplicate and clash handling, migration
  mode (side-effect suppression), no write to the source, no secrets copied.
- `woocommerce-source`: WooCommerce detection, version and storage-layout
  probes, extension detection, scan, data groups, and field mapping to Kirki
  DTOs.
- `migration-onboarding-flow`: The onboarding button, scan screen, group
  selection, progress screen and completion screen.

### Modified Capabilities

- `store-onboarding-wizard`: The last screen shows the migration entry point
  when a source plugin is detected. The progress bar can switch to migration
  steps.

## Impact

- **PHP:** new `app/Migration/**`, `MigrationController`, routes, new
  create-tables entries for the state and id-map tables, a migration-mode
  check in the mail, inventory, coupon-usage and event paths.
- **Admin app:** new `resources/app/features/migration/**` and changes in the
  onboarding feature.
- **Database:** two new tables (`kirki_ecommerce_migration_runs` and
  `kirki_ecommerce_migration_id_map`; final names set in design).
  The change follows the existing `schema-upgrade-migrations` rules.
- **Docs:** `docs/migration.md`.
- **Risk:** the WooCommerce reads use raw SQL on core tables. The schema is
  taken from published WooCommerce documentation and source, not from the
  installed copy. Some meta keys are inferred and must be confirmed in design
  with test fixtures.
