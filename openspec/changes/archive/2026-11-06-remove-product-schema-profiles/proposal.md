## Why

The product JSON-LD is filtered by a stored "schema profile" (`kirki_ecommerce_product_schemas`). A merchant must keep a profile list in Settings > Essentials, and the product form has no profile selector. As a result, `schema_id` is a hidden field, and most stores print a reduced field set for no reason. One fixed field set, filled from the product data, is simpler and gives better rich results.

## What Changes

- The single product page always prints every structured data field that the product data can fill: Product `name`, `description`, `image`, `sku`, `gtin`, `category`; Brand `name`, `logo`; Offer / AggregateOffer price fields, `priceCurrency`, `availability`, `itemCondition` (`NewCondition`, as today), `seller.name` (site name, as today), and `url`. Empty values are not printed. `aggregateRating` and `review` are still never printed.
- **BREAKING**: remove the schema profile feature: the `ProductSchema` model, service, controller, requests, DTOs, resource, `ProductSchemaProfile` support class, the product schema seeder, and the store preset step that inserts a default profile.
- **BREAKING**: remove the `/product-schemas` REST routes (list, show, create, update, delete, bulk).
- **BREAKING**: remove `schema_id` from the product model, create / update requests and DTOs, the product resource (API output), and product duplication.
- Add a new migration that drops the `fk_kecom_products_schema_id` foreign key and the `products.schema_id` column, and then drops the `kirki_ecommerce_product_schemas` table. The plugin is released, so the released `Create*` migrations stay unchanged.
- Remove the Schema Profile section from Settings > Essentials, its service, query keys, endpoints and form schema, and `schema_id` from the product form schemas.
- Remove `schema_profiles` from the bundled presets file and the local preset source.
- The `kirki_ecommerce_product_json_ld` filter keeps its arguments `($data, $seo, $product)`.
- Rewrite section 4 of `docs/seo-and-social-meta.md` for the fixed field set.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-structured-data`: profile selection and profile filtering are removed; the JSON-LD prints a fixed field set from product data.
- `store-presets`: the default schema profile preset is removed. This delta is written against the specs after `industry-location-store-presets` is archived. That change must be archived first.
- `store-setup`: the "setup writes the presets" scenario no longer lists a schema profile (same ordering condition).
- `onboarding-seed-data`: the baseline requirement no longer mentions schema profiles (same ordering condition).
- `product-seo-card`: the save payload no longer contains `schema_id`.
- `model-attribute-persistence`: `ProductSchema.schema` is no longer a covered field.
- `plugin-packaging`: store setup from the package no longer seeds schema profiles.
- `admin-api-access-control`: product schemas are no longer a catalog management endpoint.

## Impact

- **PHP**: `app/Models`, `app/Services`, `app/Http/Controllers/Api`, `app/Http/Requests`, `app/DTO`, `app/Resources`, `app/Supports/ProductJsonLd.php`, `app/Setup/Presets`, `app/Services/StorePresetService.php`, `app/Actions/Product/DuplicateProductAction.php`, `routes/api.php`, `config/migrations.php`, one new migration in `database/migrations/`, `database/seeders/`.
- **Data**: on upgrade, all stored schema profiles and every product's `schema_id` are deleted. No merchant-facing data is lost from the product page, because the new field set includes every field that a profile could print.
- **API**: `/product-schemas` returns 404 after the upgrade. Product responses no longer have `schema_id`. A client that still sends `schema_id` on product save is not rejected; the key is ignored.
- **Admin UI**: Settings > Essentials shows only the Variation Library.
- **Presets**: a preset source that still sends `schema_profiles` is not an error; the key is ignored.
- **Tests and docs**: PHP unit and integration tests, React schema tests, `docs/seo-and-social-meta.md`.
