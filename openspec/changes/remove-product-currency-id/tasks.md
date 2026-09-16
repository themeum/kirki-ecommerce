## 1. Confirm the premise before removing anything

- [ ] 1.1 Re-confirm no pricing path reads `products.currency_id`: grep `currency_id` across `app/` and confirm the only hits are the model, both product DTOs, both product requests, `ProductResource`, `DuplicateProductAction`, and the two seeders
- [ ] 1.2 Confirm `base_*` money is read as base currency — `VariantResource` passes no currency argument to `Money::prepare_amount_from_minor()`, and `MoneyManager` substitutes `get_base_currency()` when that argument is empty
- [ ] 1.3 Reproduce the currency-deletion failure on a dev database: switch the base currency, then try to delete the former base while older products still reference it, and record the error

## 2. Database migration

- [ ] 2.1 Determine the live key names on `kirki_ecommerce_products` — the foreign key `fk_kirki_ecommerce_products_currency_id` and the explicit `currency_id` index (derived as `{table}_currency_id_index` through `format_key_name`), plus any backing index the foreign key left behind
- [ ] 2.2 Add `database/migrations/AlterProductsDropCurrencyId.php` whose `up()` drops the foreign key, then the index(es), then the `currency_id` column — following the order in `AlterCartItemsVariantForeignKeyToCascade`
- [ ] 2.3 Make each drop tolerant of an already-absent key so the migration survives sites whose key names predate `AlterSchemaKeysToExplicitNames`
- [ ] 2.4 Write `down()` to restore `currency_id` as a **nullable** column with its index and foreign key — per design.md, the reversal restores shape, not data
- [ ] 2.5 Register the migration wherever the other `Alter*` migrations are registered, matching how the most recent one was added

## 3. PHP model, DTOs, and requests

- [ ] 3.1 Remove `currency_id` from `$casts` and `$fillable` in `app/Models/Product.php`
- [ ] 3.2 Remove the `$currency_id` property from `app/DTO/Product/CreateProductDTO.php` and `app/DTO/Product/UpdateProductDTO.php`
- [ ] 3.3 Remove the `currency_id` validation rule and the `Sanitizer::INT` entry from `app/Http/Requests/Product/ProductCreateRequest.php`
- [ ] 3.4 Remove the same two entries from `app/Http/Requests/Product/ProductUpdateRequest.php`
- [ ] 3.5 Remove the `currency_id` copy from `app/Actions/Product/DuplicateProductAction.php`

## 4. API response (breaking)

- [ ] 4.1 Remove the `currency` key from `app/Resources/Product/ProductResource.php`
- [ ] 4.2 Confirm no other resource, view, or shortcode reads `$product->currency` or `$product->currency_id`

## 5. Seeders

- [ ] 5.1 Remove the `currency_id` value from `database/seeders/ProductSeeder.php`
- [ ] 5.2 Remove `currency_id` from `make_product_data()` in `database/seeders/OnBoarding/ProductSeeder.php` and delete the now-unused `resolve_base_currency_id()` helper and its call site

## 6. Frontend schemas and form

- [ ] 6.1 Remove `ProductCurrencySchema` and the `currency` field from `resources/app/features/products/schemas/catalog/product.ts`
- [ ] 6.2 Remove the `currency` field and the `currency_id: values.currency?.id ?? null` payload mapping from `resources/app/features/products/schemas/forms/product-form.ts`
- [ ] 6.3 Remove the `currency: defaultSettings?.base_currency ?? null` line from the seeded values in `resources/app/features/products/pages/create-product.tsx`, and drop `useDefaultSettingsQuery` there if nothing else in the file uses it
- [ ] 6.4 Remove the two `currency_id` assertions from `resources/app/features/products/tests/schemas/forms/product-form.test.ts`
- [ ] 6.5 Confirm `resources/app/schemas/catalog/app-config.ts` still defines its own currency shape and was not depending on the removed `ProductCurrencySchema`

## 7. Verification

- [ ] 7.1 Run the migration on a database built from scratch through the full migration sequence, and confirm the column, index, and foreign key are gone
- [ ] 7.2 Run it on a database upgraded from an earlier plugin version, confirming the key names resolve on that path too
- [ ] 7.3 Exercise product create, update, and duplicate, plus the product list and detail endpoints, and confirm no layer writes or reads the dropped column
- [ ] 7.4 Delete a currency that was previously the base and is still referenced by older products — the case recorded in 1.3 — and confirm it now succeeds
- [ ] 7.5 Confirm money display is unchanged: the product form, variants table, and SEO preview still show the store's base currency symbol and code
- [ ] 7.6 Run `composer phpcs:wporg`, then `npm run typecheck`, `npm run lint`, and `npm test` in `resources/app/`, and confirm no new failures against the pre-change baseline
