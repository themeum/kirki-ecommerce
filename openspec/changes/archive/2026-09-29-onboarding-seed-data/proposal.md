## Why

A merchant who activates the plugin today lands on a completely empty store — no
currency, no categories, no attributes, no schema profiles, no products, and no
payment method — so there is nothing to click, configure, or preview. The 17
existing seeders under `database/seeders/` cannot fill that gap: they are demo/dev
fixtures that use hardcoded primary keys, insert unconditionally, and (in
`SettingsSeeder`'s case) overwrite merchant settings wholesale. Running any of them
on a real install would duplicate rows or clobber configuration. Alpha-1 needs a
separate, production-safe first-run dataset.

## What Changes

- Add a **guarded onboarding seeder tree** under `database/seeders/OnBoarding/`,
  invoked only from the `1.0.0-alpha.1` version-update callback in
  `config/version-updates.php`. It is deliberately **not** registered in
  `DatabaseSeeder` and is not reachable via `wp kirki db:seed`, keeping it fully
  isolated from the demo seeders.
- Every onboarding seeder is **idempotent**: it checks its own target before
  writing and no-ops if already populated, and resolves all foreign keys by
  slug/name lookup rather than hardcoded IDs. This matters because
  `VersionUpdateManager` records the version only *after* the callback returns, so
  a timeout mid-seed re-fires the entire callback on the next admin request.
- Seed a **USD currency** row with `is_base = 1`, plus `currency_settings.base_currency`.
- Seed a **255-row, 3-level category tree** (15 top-level → 61 → 179). 14 leaf
  slugs collide across branches (`accessories` ×5, `shoes`/`helmets`/`toys` ×3), so
  colliding rows get a parent-name prefix while display names stay verbatim.
- Seed a **`Color` attribute** (`type => 'color'`) with 30 named hex presets, and a
  **`Material` attribute** (`type => 'list'`, Ceramic/Glass) required by the demo catalog.
- Seed **product schema profiles**, restricted to the 4 groups / 10 keys the
  product-form picker actually renders.
- Seed **default settings** via `Option::set`, writing each key only when its option
  row does not already exist: All Countries selling location, product reviews and
  star ratings **disabled**, guest checkout **disabled**, and a **Cash on Delivery**
  offline payment method with a descriptive instructions string and no icon.
- Seed **3 demo products** (1 simple, 2 variable — 8 variants total) built through
  `CreateProductAction`, with their images imported into the WordPress media library.
- Add a **media importer** that sideloads local plugin assets into the WP media
  library and returns attachment IDs. No such helper exists anywhere in the codebase
  today — products currently reference attachment IDs that are assumed to pre-exist.
- After a fully successful seed, **delete `assets/images/products/`** from the
  installed plugin, gated on `KIRKI_ECOMMERCE_MODE === 'production'` so the
  bind-mounted dev working tree is never touched.

No breaking changes: everything is additive, and nothing existing reads or writes
the tables and options being populated on a fresh install.

## Capabilities

### New Capabilities
- `onboarding-seed-data`: First-run store provisioning — the guarded, idempotent
  seeding of baseline catalog data (currency, categories, attributes, product schema
  profiles, demo products), default store settings, and the import of bundled product
  images into the WordPress media library, all driven from the plugin's
  version-update pipeline rather than from the developer seeding commands.

### Modified Capabilities

(none — no existing spec covers seeding, settings defaults, or media import.
`plugin-packaging` is unaffected: `bin/make-package.sh` already copies `assets`
wholesale, so the product images ship in the zip without any packaging change.)

## Impact

- **New (`database/seeders/OnBoarding/`)**: `OnBoardingSeeder`, `OnBoardingCatalog`
  (static data), `CurrencySeeder`, `CategorySeeder`, `AttributeSeeder`,
  `ProductSchemaSeeder`, `SettingsSeeder`, `ProductSeeder`, `MediaImporter`.
- **Modified**: `config/version-updates.php` — the existing `1.0.0-alpha.1` closure
  gains the seeder invocation after `Utils::generate_site_pages()`.
- **Database**: no migrations. Writes rows to `kirki_ecommerce_currencies`,
  `_categories`, `_attributes`, `_attribute_values`, `_product_schemas`, `_products`,
  `_variants`, `_media_product`, plus WP `posts`/`postmeta` for the imported attachments.
- **Options**: writes `kirki_ecommerce_{general,product,payment,checkout,currency}`,
  each only when absent.
- **Filesystem**: writes images into `wp-content/uploads`; deletes
  `assets/images/products/` from the installed plugin in production mode only.
- **No frontend changes.** The admin SPA reads all of this through existing
  endpoints; nothing in `resources/app/` is touched.
- **Source data** lives in root-level `categories.md`, `colors.md`, `schema.md` and a
  WooCommerce CSV export. None of those are copied by `bin/make-package.sh`, so all
  of it must be baked into PHP literals — nothing may be parsed at runtime.
