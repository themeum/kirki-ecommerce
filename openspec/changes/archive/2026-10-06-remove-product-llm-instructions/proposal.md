## Why

`products.llm_instructions` is never used. No code reads it: it is only stored, validated, copied on duplicate, and echoed back in the product response. Its only editor, the AEO tab, is already gone from the product form, and `aeo.tsx` is left behind with nothing importing it. Keeping the column suggests an LLM feature that does not exist.

The `product-seo-card` spec has drifted the same way. Commit `480ff712` removed the Schema tab from the product form, but the spec still requires four tabs (Search Engines, AEO, Social Share, Schema) and describes a Schema tab that no longer exists. This change brings the spec back in line with the two-tab card that ships.

## What Changes

- Drop the `llm_instructions` column from `kirki_ecommerce_products` by editing `CreateProductsTable` directly. Pre-release builds define each table in a single create migration and require a fresh install (`schema-upgrade-migrations`), so no alter migration is added.
- Remove `llm_instructions` from the `Product` model, both product DTOs, both product request validators (rule and sanitizer), `DuplicateProductAction`, and the demo `ProductSeeder`.
- **BREAKING**: remove the `llm_instructions` key from `ProductResource`. The product create and update endpoints also stop accepting it; a client that still sends it has the value ignored.
- Frontend: remove `llm_instructions` from the product catalog schema, `ProductSeoFormSchema`, and the product form payload mapping, and delete the unused `aeo.tsx` component.
- Remove `llm_instructions` from the API examples under `docs/ecommerce/`.
- Spec cleanup in `product-seo-card`: the card has two tabs, Search Engines and Social Share. The AEO and Schema tab requirements are removed, and the live-image and save-payload requirements stop mentioning them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-seo-card`:
  - "Card presents four tabbed sections" becomes a two-tab requirement.
  - Removed: "AEO LLM instructions field", "Schema profile select from settings", "Schema read-only property display", and "Schema live preview with sale price".
  - "Featured image previews update live" no longer mentions the Schema preview.
  - "SEO form sync preserved" no longer lists `llm_instructions` in the save payload.

## Impact

**Database**: `CreateProductsTable` no longer creates `llm_instructions`. Existing pre-release installs pick this up only through a fresh install.

**API (breaking)**: `ProductResource` no longer emits `llm_instructions`. The plugin is pre-1.0 (`1.0.0-beta.1`), so this is acceptable, but release notes should call it out.

**PHP**:
- `app/Models/Product.php` (fillable)
- `app/DTO/Product/CreateProductDTO.php` and `app/DTO/Product/UpdateProductDTO.php`
- `app/Http/Requests/Product/ProductCreateRequest.php` and `app/Http/Requests/Product/ProductUpdateRequest.php` (rule and `Sanitizer::TEXT` key)
- `app/Actions/Product/DuplicateProductAction.php`
- `app/Resources/Product/ProductResource.php`
- `database/seeders/ProductSeeder.php`

**Frontend**:
- `resources/app/features/products/schemas/catalog/product.ts`
- `resources/app/features/products/schemas/forms/product-seo-form.ts`
- `resources/app/features/products/schemas/forms/product-form.ts`
- `resources/app/features/products/tests/schemas/forms/product-form.test.ts` (two fixtures)
- `resources/app/features/products/components/product-form/sections/seo-settings/aeo.tsx` (deleted)

**Docs**:
- `docs/ecommerce/products/{create-3,edit-3,get-by-id-3,shop-product-html}.yml`
- `docs/ecommerce/Site/checkout.yml`

**Not affected**:
- `schema_id` keeps its column, form field, and save payload. Only the product form's Schema tab is gone, and that happened in `480ff712`; nothing here changes how `schema_id` is stored.
- The onboarding seeder never set `llm_instructions`.
