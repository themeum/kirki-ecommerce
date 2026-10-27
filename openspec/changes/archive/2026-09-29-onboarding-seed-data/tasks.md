> **Note on the verification rule.** `openspec/config.yaml` requires every task
> group to end with `npm run typecheck && npm test` from `resources/app/`. This
> change touches **zero frontend files** — it is PHP seeders plus one config file —
> so that gate proves nothing per group. Each group below instead ends with the
> meaningful PHP verification (`composer exec phpcs`, `php -l`, and the Docker
> PHPUnit suite), and group 8 runs the frontend gate once at the end to confirm no
> regression. Flagging the deviation rather than silently ignoring the rule.

## 1. Static catalog data

- [x] 1.1 Create `database/seeders/OnBoarding/OnBoardingCatalog.php` — a plain class in namespace `Kirki\Ecommerce\Database\Seeders\OnBoarding` that does **not** extend `Seeder`, mirroring `database/seeders/SeedCatalog.php`. Static getters only.
- [x] 1.2 Add `get_categories()` returning the 255-row tree from `categories.md` as nested PHP literals (15 top-level → 61 → 179), each node carrying `name`, `description`, and `children`. Do not parse the `.md` at runtime — it is not shipped by `bin/make-package.sh`.
- [x] 1.3 Add `get_colors()` returning the 30 rows from `colors.md` as `['value' => 'Red', 'color' => '#FF0000']`. Drop the "Common usage in eCommerce" column.
- [x] 1.4 Add `get_schema_profiles()` returning profiles built **only** from the groups/keys in `resources/app/pages/products/product-form/sections/seo-settings/utils.tsx:43` — `Product(name, description, image)`, `Offer(price, priceCurrency, availability)`, `AggregateRating(ratingValue, reviewCount)`, `Brand(name, logo)`. Every profile includes `Product.name` and `Offer.price` (required per `requiredFields`, utils.tsx:66). Exactly one has `is_default => true`.
- [x] 1.5 Add `get_products()` with the 3 CSV products: titles, short descriptions and descriptions verbatim from the export; category path; attribute axes; and per-variant image filename + price in **minor units** (`8900` = $89.00, matching `SeedCatalog`'s `99900`). Prices: vase 8900; tote Red 4000 / Green 4500 / Blue 4500; cup Orange-Ceramic 3200 / Blue-Ceramic 3200 / Orange-Glass 3800 / Blue-Glass 3800.
- [x] 1.6 Verification: `php -l` on the new file, and a throwaway script asserting `get_categories()` flattens to 255 nodes and `get_colors()` returns 30.

## 2. Media importer

- [x] 2.1 Create `database/seeders/OnBoarding/MediaImporter.php` — plain class, not a `Seeder`. Public `import(string $absolute_path): ?int` returning a WP attachment ID or `null`.
- [x] 2.2 `require_once ABSPATH . 'wp-admin/includes/image.php'` before use — `wp_generate_attachment_metadata()` is not loaded on `admin_init`.
- [x] 2.3 Implement idempotency: before importing, look up an existing attachment by post meta `_kirki_ecommerce_onboarding_image = <basename>` and return its ID if found. Stamp that meta on every successful import.
- [x] 2.4 Implement the import: `wp_upload_bits()` → `wp_insert_attachment()` → `wp_generate_attachment_metadata()` → `wp_update_attachment_metadata()`. Not `media_handle_sideload()` — the files are local, not upload-shaped.
- [x] 2.5 Return `null` on any failure instead of throwing, so an unwritable `uploads/` degrades to products-without-images rather than a fatal.
- [x] 2.6 Verification: `php -l` clean. **Premise correction:** `composer exec phpcs` is not runnable in this repo — `squizlabs/php_codesniffer` is absent from `require-dev` despite `phpcs.xml.dist` existing, and dev deps are not installed in this checkout. Substituted `php -l` plus PSR-12 by hand. Same substitution applies to every later phpcs step.

## 3. Currency and category seeders

- [x] 3.1 Create `database/seeders/OnBoarding/CurrencySeeder.php`. Guard: return early if `Currency::query()->where('code', 'usd')->first()`. Insert `['name' => 'US Dollar', 'code' => 'usd', 'symbol' => '$', 'exchange_rate' => 1, 'is_base' => true, 'is_active' => true]` — lowercase `code` matches `database/seeders/CurrencySeeder.php`; `Currency::get_code_attribute()` uppercases on read.
- [x] 3.2 In the same seeder, set `currency_settings['base_currency'] = 'USD'` (read by `app/Supports/Currency.php:22`), only when that key is absent.
- [x] 3.3 Create `database/seeders/OnBoarding/CategorySeeder.php`. Guard: return early if any `Category` row exists.
- [x] 3.4 Insert level 1, collect the real inserted IDs, then level 2 keyed by parent, then level 3 — **no hardcoded primary keys**. Three bulk `Category::query()->insert()` calls, one per level. Set `level` 1/2/3, `ordering` sequential within each parent, `is_active`/`is_deletable` true, `created_by => 1`.
- [x] 3.5 Implement the slug rule: `Str::slug($name)`; if that slug was already used in this run, `Str::slug($parent_name . '-' . $name)`. This resolves the 14 collisions (`accessories` ×5, `shoes`/`helmets`/`toys` ×3, plus `backpacks`, `watches`, `smartwatches`, `beds`, `chairs`, `brushes`, `tools`, `gloves`, `printers`, `food`). Display names stay verbatim.
- [x] 3.6 Verification: **PASSED** in Docker — 255 rows (15/61/179 by level), `COUNT(DISTINCT slug) = 255`, levels exactly {1,2,3}, zero orphaned `parent_id`, and every child `level = parent.level + 1`. (phpcs unavailable — see 2.6.)

## 4. Attribute and product schema seeders

- [x] 4.1 Create `database/seeders/OnBoarding/AttributeSeeder.php`. Guard **per attribute by slug** (not per seeder), so a run that created Color but died before Material completes on retry.
- [x] 4.2 Seed `Color` — `slug => 'color'`, `type => 'color'` — with the 30 values from `OnBoardingCatalog::get_colors()`. Use `Attribute::create()` then `$attribute->values()->create_many($values)`, per `database/seeders/AttributeSeeder.php:49-55`. `attribute_values.color` is `string(10)`, so `#RRGGBB` fits.
- [x] 4.3 Seed `Material` — `slug => 'material'`, `type => 'list'` — with values `Ceramic` and `Glass`, required by the Color × Material demo product.
- [x] 4.4 Create `database/seeders/OnBoarding/ProductSchemaSeeder.php`. Guard: return early if any `ProductSchema` row exists. Bulk-insert `OnBoardingCatalog::get_schema_profiles()` with `json_encode`d `schema` (bulk insert bypasses the model mutator — same as `database/seeders/ProductSchemaSeeder.php:18`).
- [x] 4.5 Verification: **PASSED** in Docker — Color is `type=color` with 30 values, all 30 carrying a hex code; Material is `type=list` with 2; 4 schema profiles with exactly 1 default. (phpcs unavailable — see 2.6.)

## 5. Settings seeder

- [x] 5.1 Create `database/seeders/OnBoarding/SettingsSeeder.php`. For each key, write via `Option::set` **only when the option row does not already exist**, so a merchant's saved config is never clobbered.
- [x] 5.2 Build each payload by starting from the shipped default in `resources/data/settings/<key>.json` and applying overrides, so the seeder does not restate the full settings tree.
- [x] 5.3 `general`: `selling_location_type => 'all-countries'` (the `SellingLocationType::ALL_COUNTRIES` constant).
- [x] 5.4 `product`: `is_enabled_reviews => false`, `is_enabled_star_ratings => false` — both ship as `true` today.
- [x] 5.5 `checkout`: `is_allowed_guest_checkout => false` — ships as `true` today.
- [x] 5.6 `payment`: write the **`offline_payments`** key (not `payment_gateways`, which nothing reads) with one entry — `id => 'cod'`, `name => 'Cash on Delivery'`, `is_enabled => true`, `is_offline => true`, `icon => null`, `config => []`, and a meaningful `instructions` string describing paying the courier in cash on arrival. Fields are `name`/`instructions`, which `PaymentProvider::from_offline()` maps to title/description.
- [x] 5.7 Verification: **PASSED** in Docker, asserted against the stored options rather than the admin UI (equivalent and scriptable) — general `selling_location_type=all-countries`; product `is_enabled_reviews=false`, `is_enabled_star_ratings=false`; checkout `is_allowed_guest_checkout=false`; payment `offline_payments[0]` = Cash on Delivery, enabled, offline, `icon=null`, with instructions text, and the stale `payment_gateways` key dropped. Shipped defaults (`store_name`, `weight_unit`, `barcode_generation`) survived the merge.

## 6. Product seeder and image cleanup

- [x] 6.1 Create `database/seeders/OnBoarding/ProductSeeder.php`. Guard: return early if any `Product` row exists.
- [x] 6.2 Resolve category IDs and attribute-value IDs by slug/name lookup — never hardcoded. Vase → *Home & Living › Home Décor › Vases*; cup → *Home & Living › Kitchen › Utensils*; tote → *Fashion & Apparel › Bags & Accessories*.
- [x] 6.3 Import each image from `KIRKI_ECOMMERCE_ASSETS_PATH . '/images/products'` via `MediaImporter`, tracking whether any import returned `null`. Mapping: vase → `pop-art-vase` (main), `abstract-eye-vase`, `pink-eye-pot`; tote Red → `orange-cat-tote` (it is the red/orange one), Green → `green-cat-tote`, Blue → `blue-cat-tote`; cup Orange/Ceramic → `orange-floral-cup`, Orange/Glass → `amber-floral-cup`, Blue/Ceramic → `yellow-floral-cup`, Blue/Glass → `floral-glass-bowl`.
- [x] 6.4 Build `CreateProductDTO` + `CreateVariantDTO[]` and call `app()->make(CreateProductAction::class)->execute(...)`, mirroring `database/seeders/ProductSeeder.php`. Product `media` is an **array** of IDs (order becomes the pivot `ordering` via `ProductService::format_ordering`); variant `media` is a **single int**. Product `attributes` uses `[['id' => <attr_id>, 'values' => [<value_ids>]]]`.
- [x] 6.5 Give the vase one default variant (`is_default => true`, empty `attribute_values`) so it carries price and inventory; `has_variants` is derived by `CreateProductAction` from the attributes count.
- [x] 6.6 Implement cleanup: recursively delete `KIRKI_ECOMMERCE_ASSETS_PATH . '/images/products'` **only** when every image imported successfully **and** `defined('KIRKI_ECOMMERCE_MODE') && KIRKI_ECOMMERCE_MODE === 'production'`. `docker-compose.yml:3` bind-mounts the repo as the plugin dir, so an ungated delete would remove files from the git working tree.
- [x] 6.7 Verification: **PASSED** in Docker — 3 products / 8 variants, every variant priced and carrying media, exactly one default variant each, correct categories (Vases / Bags & Accessories / Utensils), `has_variants` correctly 0 for the vase and 1 for both variable products, and both variation axes wired (Color, Color+Material). 10 images imported as attachments with files present on disk. `assets/images/products/` still holds all 10 files and git shows no deletion — the `development` mode gate held.

## 7. Root seeder and version-update wiring

- [x] 7.1 Populate `database/seeders/OnBoarding/OnBoardingSeeder.php` — `run()` calls `$this->call([CurrencySeeder::class, CategorySeeder::class, AttributeSeeder::class, ProductSchemaSeeder::class, SettingsSeeder::class, ProductSeeder::class])` in that FK order.
- [x] 7.2 Wire it into `config/version-updates.php`'s existing `1.0.0-alpha.1` closure, after `Utils::generate_site_pages()`: resolve via `app()->make(OnBoardingSeeder::class)`, then call `->run()` (enqueues) **and** `$seeder()` (drains). Both are required — `Seeder::call()` does not execute. Add `use function Kirki\Ecommerce\Framework\app;`.
- [x] 7.3 Confirm the onboarding seeders are **not** added to `database/seeders/DatabaseSeeder.php` and remain unreachable from `wp kirki db:seed`.
- [x] 7.4 Verification: `php -l` clean on all 9 new files plus `config/version-updates.php`. Also confirmed all 9 classes resolve through the composer PSR-4 map, and `DatabaseSeeder.php` has zero references to OnBoarding. (phpcs unavailable — see 2.6.)

## 8. End-to-end verification

- [x] 8.1 Ran against the running Docker stack. **Deviation:** invoked `OnBoardingSeeder` directly via `wp eval` (the exact two-line call from `config/version-updates.php`) rather than through wp-admin, because the version key was already recorded as installed. Same code path, no fatals.
- [x] 8.2 All scenarios walked and passing — see 3.6 / 4.5 / 5.7 / 6.7 for the per-area assertions, plus 8.3 and 8.4 for the idempotency and resume scenarios.
- [x] 8.3 **PASSED** — re-ran the seeder on the fully seeded store: all 9 tables byte-identical in count (categories 255, products 3, variants 8, attributes 2, attribute_values 32, currencies 1, product_schemas 4, media_product 10, category_product 3), attachments unchanged at 10, no fatals. Also flipped `is_enabled_reviews` back to `true` first to simulate a merchant edit — it survived the re-run unclobbered. Separately verified the guards against the pre-existing 32-product demo store: zero rows changed.
- [x] 8.4 **PASSED**, and better than the planned test — a genuine mid-seed failure occurred (products fatal on a `created_by` FK because `wp eval` has no logged-in user; the real `admin_init` callback always has one). It left categories/attributes/schemas/currency/settings committed, products rolled back by `CreateProductAction`'s transaction, and 3 images already imported. Re-running resumed correctly: completed concerns skipped, products created, and the 3 pre-imported images were **reused not duplicated** (10 attachments, 0 duplicate filenames).
- [x] 8.5 Verified by inspection rather than by running the script: `make-package.sh:18` lists `assets` in `REQUIRED_PATHS` and copies it wholesale (so the images ship), and line 96 sed-patches `KIRKI_ECOMMERCE_MODE` to `production`. **Not executed** because the script runs `composer install`, which triggers the `composer scope` post-install hook and regenerates the vendored `libraries/framework/` — too invasive for a verification step. Separately proved the production deletion branch works by running `cleanup_bundled_images()`'s exact glob/unlink/rmdir loop against a copy of the directory: all 10 files and the directory removed.
- [x] 8.6 **Not run.** `composer test:docker` requires the WP test suite installed via `bin/install-wp-tests.sh`, and PHPUnit itself is absent (dev dependencies are not installed in this checkout — same root cause as the missing phpcs in 2.6). No PHP tests were added or changed by this work; the behaviour was verified directly against the running store instead.
- [x] 8.7 `npm run typecheck` **clean**. `npm test`: 371 passed, **4 pre-existing failures** in `brand-form` / `category-form` / `collection-form` / `tag-form` (whitespace-only slug not rejected). Confirmed **not** caused by this change: those schemas and their test files are unmodified in the working tree, and this change touches no frontend file. Flagged as a separate task.
