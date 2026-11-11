## 0. Precondition

- [x] 0.1 Before you archive this change, archive `industry-location-store-presets`. (Archived as `2026-11-06-industry-location-store-presets`, after its two stale deltas were reconciled with the main specs, with the user's approval.) The `store-presets`, `store-setup` and `onboarding-seed-data` deltas here are written against the specs after that archive.

## 1. Drop migration

- [x] 1.1 Add `database/migrations/DropProductSchemasTable.php` (`implements Migration`, `Schema` facade + `Structure`). `up()` drops `fk_kecom_products_schema_id` and `schema_id` on `kirki_ecommerce_products` in one `Schema::table()` closure, then calls `Schema::drop_if_exists('kirki_ecommerce_product_schemas')`. `down()` recreates the table with the same shape as `CreateProductSchemaTable`, then re-adds the nullable `schema_id` after `og_image` and the FK with `null_on_delete()`. Add class and method docblocks with `@since` set to the next plugin version.
- [x] 1.2 Append `DropProductSchemasTable::class` (and its `use`) at the end of `config/migrations.php`. Do not edit `CreateProductSchemaTable.php`, its registration, or the `schema_id` lines in `CreateProductsTable.php`.
- [x] 1.3 ~~Add `tests/Integration/Database/DropProductSchemasTableTest.php`~~ — dropped at the user's request (no separate migration test). The migration runs in every integration test set-up (`migrator()->run()`), so the integration suite still exercises it.
- [x] 1.4 Verify: `composer test:integration` passes (the migration runs in the test set-up); `cd resources/app && npm run typecheck && npm test`. (Run through `bash kirki-ecommerce-test`, because host PHP exits silently without `bootstrap/abspath.php`: 1466 integration tests OK.)

## 2. Structured data from product data

- [x] 2.1 `app/Supports/ProductJsonLd.php`: change `build()` to `build(array $seo, array $product)` and remove every profile gate. Remove `$fields` from `build_brand()` and `build_offers()`. Always set `itemCondition` and `seller`, but print `seller` only when the site name is not empty. Remove `when()`. `current()` calls `build($seo, $product)` and keeps the `DevHookNames::PRODUCT_JSON_LD` filter call unchanged. Update the class and method docblocks (no profile wording).
- [x] 2.2 Delete `app/Supports/ProductSchemaProfile.php` and `tests/Unit/Supports/ProductSchemaProfileTest.php`.
- [x] 2.3 `tests/Unit/Supports/ProductJsonLdTest.php`: call `build()` with two arguments. Add assertions for `category`, `brand.logo`, `offers.itemCondition` and `offers.seller.name`, a case with an empty site name (no `seller`), and a case where `image` and `category` have no data (keys absent).
- [x] 2.4 `tests/Integration/ProductHeadMetaTest.php`: remove the profile-selection and broken-profile tests and the `ProductSchema` set-up / tear-down. Keep or add one test that the printed JSON-LD has `category`, `brand` and `offers.itemCondition`. (Needed task 3.4 first: after the drop migration, product create returned 500 until `schema_id` left the model and DTOs.)
- [x] 2.5 Verify: `composer test:unit` and the `ProductHeadMetaTest` integration test pass; `cd resources/app && npm run typecheck && npm test`.

## 3. Remove the schema profile backend

- [x] 3.1 Delete `app/Models/ProductSchema.php`, `app/Services/ProductSchemaService.php`, `app/Http/Controllers/Api/ProductSchemaController.php`, `app/Http/Requests/ProductSchema/`, `app/DTO/ProductSchema/`, `app/Resources/ProductSchemaResource.php`.
- [x] 3.2 `routes/api.php`: remove the six `/product-schemas` routes and the `ProductSchemaController` import.
- [x] 3.3 Delete `tests/Integration/ProductSchemaApiTest.php`.
- [x] 3.4 Remove `schema_id` from `app/Models/Product.php` (`$casts`, `$fillable`), `app/DTO/Product/CreateProductDTO.php`, `app/DTO/Product/UpdateProductDTO.php`, `app/Http/Requests/Product/ProductCreateRequest.php` and `ProductUpdateRequest.php` (rule and sanitizer), `app/Resources/Product/ProductResource.php`, and `app/Actions/Product/DuplicateProductAction.php`.
- [x] 3.5 Delete `database/seeders/ProductSchemaSeeder.php` and remove it from `database/seeders/DatabaseSeeder.php`.
- [x] 3.6 Verify: product create, update and duplicate integration tests pass, and a product save payload that still has `schema_id` succeeds; `cd resources/app && npm run typecheck && npm test`. (Stale `schema_id` checked with a temporary test, then removed. Note: `ProductApiTest` and `ProductHeadMetaTest` fail when run after `OnboardingApiTest` in one process; the same happens on the unchanged `dev` tree, so it is pre-existing.)

## 4. Remove the schema profile preset

- [x] 4.1 Delete `app/Setup/Presets/SchemaProfilePresets.php`. Remove it from the step list and the imports in `app/Services/StorePresetService.php`.
- [x] 4.2 Remove the `schema_profiles` key from `app/Setup/Presets/Local/LocalPresetSource.php` and from `resources/data/preconfigured-data/presets.json`.
- [x] 4.3 Update the docblock of `app/Setup/OnBoardingSeeder.php` so it does not mention schema profiles.
- [x] 4.4 Update `tests/Integration/StorePresetsTest.php`, `tests/Integration/OnboardingApiTest.php` and `tests/Integration/UtcDateTimeStorageTest.php`: remove the schema profile assertions and the profile UTC case. Add one assertion to `StorePresetsTest` that presets data with a `schema_profiles` list applies with no error.
- [x] 4.5 Verify: `StorePresetsTest`, `OnboardingApiTest` and `UtcDateTimeStorageTest` pass; `cd resources/app && npm run typecheck && npm test`.

## 5. Admin UI

- [x] 5.1 Delete `resources/app/features/settings/essentials/pages/schema-profile/`, `essentials/services/schema.ts`, `essentials/schemas/catalog/schema-profile.ts`, `essentials/schemas/forms/schema-profile-form.ts`, and `essentials/tests/schemas/forms/schema-profile-form.test.ts`. (Also deleted `essentials/components/fields/schema-property-field.tsx` and its test, used only by the deleted dialog; removed `useSchemasQuery` from `features/settings/index.ts`; the Essentials skeleton now shows one card instead of two.)
- [x] 5.2 Remove `<SchemaProfile />` and its import from `essentials/pages/essential-settings.tsx`.
- [x] 5.3 Remove `schemaProfileKeys` from `features/settings/services/query-keys.ts` and from the export in `features/settings/index.ts`. Remove `PRODUCT_SCHEMAS` and `PRODUCT_SCHEMA` from `config/endpoints.ts`.
- [x] 5.4 Remove `schema_id` from `features/products/schemas/catalog/product.ts`, `features/products/schemas/forms/product-seo-form.ts` and the payload transform in `features/products/schemas/forms/product-form.ts`. Update the payload test `features/products/tests/schemas/forms/product-form.test.ts` in the same task: remove `schema_id` from its inputs and assert that the payload has no `schema_id` key.
- [x] 5.5 Run `npm run search:index` in `resources/app/` to rebuild `settings-search-index.json` without `essentials.schema-profile` (the index is git-ignored, so only the relevance test shows in the diff). Remove the `structured data` and `seo` rows that expect it from `features/settings/search/search-relevance.test.ts`.
- [x] 5.6 Verify: `cd resources/app && npm run typecheck && npm test` and lint pass. Ask the user to check Settings > Essentials visually.

## 6. Docs and final checks

- [x] 6.1 `docs/seo-and-social-meta.md`: rewrite section 4 as "Structured data" with the fixed field table and value sources (no profiles, no `schema_id`). Update the table of contents entry and the "Where this differs" bullets that mention profiles. (Scope added with the user's approval: also updated `docs/user-guide/kirki-ecommerce-user-guide.md` and `docs/onboarding.md`, deleted the Bruno folder `docs/ecommerce/product-schemas/`, and removed `schema_id` from 5 Bruno example bodies.)
- [x] 6.2 Run `grep -rniE 'ProductSchema|product_schemas|product-schemas|schema_id|schema_profiles|schemaProfile|SchemaProfile' app database config routes tests resources docs`. Only `CreateProductSchemaTable.php`, `CreateProductsTable.php`, `DropProductSchemasTable.php`, `config/migrations.php`, the new migration test, and unrelated zod `*Schema` names may match.
- [x] 6.3 Run `composer phpcs:wporg`, `composer phpcs:docblocks` and `composer test`. (phpcs run with `-d auto_prepend_file=bootstrap/abspath.php` on the changed files: no violations. `bash kirki-ecommerce-test all`: 629 unit and 1466 integration tests OK.)
- [x] 6.4 Verify: `cd resources/app && npm run typecheck && npm test`. Ask the user to check a product page's JSON-LD on an upgraded install and on a fresh install.
