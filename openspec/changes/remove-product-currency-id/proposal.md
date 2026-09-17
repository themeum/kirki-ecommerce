## Why

`products.currency_id` is vestigial: no pricing path reads it. Every `base_*` money value is interpreted as the store's base currency — `VariantResource` reads `base_price` through `Money::prepare_amount_from_minor()` with no currency argument, and `MoneyManager` substitutes `get_base_currency()` whenever that argument is empty. The column survives only as a persisted field, a `currency` key on `ProductResource`, a copy in `DuplicateProductAction`, and two seeders.

Keeping it is not neutral. It caused a live bug: the product form took its money-field symbol from the product's stored currency, so a store that switched its base currency to BDT still saw `$` on every product created while USD was base. That symptom is fixed, but the column that caused it remains, along with two more defects it still carries.

## What Changes

- Drop the `currency_id` column, its index, and its foreign key from `kirki_ecommerce_products` via a new alter migration.
- Remove `currency_id` from the `Product` model, both product DTOs, both product request validators, and `DuplicateProductAction`.
- **BREAKING**: remove the `currency` key from `ProductResource`. Any consumer reading `product.currency` from the REST API must instead read the store's base currency from `/app-config`.
- Remove the `currency` field and its `currency_id` payload mapping from the product form schema, and drop `ProductCurrencySchema` from the product catalog schema.
- Stop seeding a product currency in `ProductSeeder` and the onboarding `ProductSeeder` (including its `resolve_base_currency_id` helper).

Two defects are resolved as a direct consequence:

1. **Schema and API stop disagreeing.** The column is declared `NOT NULL` with a foreign key, while both request validators accept `integer|nullable` and the form submits `values.currency?.id ?? null`. Today a product created with no base currency configured sends `null` into a `NOT NULL` column and fails at the database rather than at validation.
2. **Currency deletion stops being blocked.** The foreign key has no `null_on_delete` or cascade, so MySQL restricts deletion of any currency a product references. After a store switches its base currency, the old base is still referenced by every product created before the switch and can no longer be deleted — which contradicts the existing `multi-currency-settings` deletion scenario.

## Capabilities

### New Capabilities

None. This change removes a field; it introduces no new behavior.

### Modified Capabilities

- `product-form`: the "Create page default seeding" requirement currently seeds `currency` from default settings into form default values. Currency is no longer a product form field, so it drops out of the seeded set; weight unit, dimension unit, and shipping box seeding are unaffected.
- `multi-currency-settings`: the "Deleting a currency" scenario is strengthened to hold even when historical products were created while that currency was the base — deletion must not be blocked by product references.

## Impact

**Database** — `kirki_ecommerce_products`: drops column `currency_id`, index `currency_id`, and foreign key `fk_kirki_ecommerce_products_currency_id`. The drop order matters: the foreign key and index must go before the column. Existing rows lose a value nothing reads.

**API (breaking)** — `ProductResource` no longer emits `currency`. The plugin is at `1.0.0-alpha.4`, so this is judged acceptable pre-1.0, but it is a public response-shape change and should be called out in release notes rather than shipped silently.

**PHP** — `app/Models/Product.php` (casts, fillable), `app/DTO/Product/CreateProductDTO.php`, `app/DTO/Product/UpdateProductDTO.php`, `app/Http/Requests/Product/ProductCreateRequest.php` (validation rule + `Sanitizer` key), `app/Http/Requests/Product/ProductUpdateRequest.php` (same), `app/Resources/Product/ProductResource.php`, `app/Actions/Product/DuplicateProductAction.php`, `database/seeders/ProductSeeder.php`, `database/seeders/OnBoarding/ProductSeeder.php`.

**Frontend** — `resources/app/features/products/schemas/catalog/product.ts` (`ProductCurrencySchema` and the `currency` field), `resources/app/features/products/schemas/forms/product-form.ts` (the `currency` field and the `currency_id` mapping), `resources/app/features/products/pages/create-product.tsx` (drops the currency line from seeded values), and `resources/app/features/products/tests/schemas/forms/product-form.test.ts` (two assertions on `currency_id`).

**Not affected** — money display. The product form, variants table, and SEO preview already read the base currency directly via `useBaseCurrency`/`useBaseCurrencySymbol`, so removing the column changes no rendered amount or symbol.

**Already covered by existing requirements** — `schema-upgrade-migrations` requires that alter migrations converge existing installations to the current schema; this migration falls under that requirement and needs no change to it.
