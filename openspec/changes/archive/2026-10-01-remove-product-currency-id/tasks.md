## 1. Confirm the premise before removing anything

- [x] 1.1 Re-confirm no pricing path reads `products.currency_id`: grep `currency_id` and the `currency` relation across `app/` and `tests/` and confirm the only hits are the model (casts, fillable, `currency()` relation), both product DTOs, both product requests, `ProductService`'s eager loads, `ProductResource`, `DuplicateProductAction`, the two seeders, and `tests/Support/CreatesTestProducts.php`
  - _Confirmed. `app/` hits are exactly the listed ones; the relation is eager-loaded only in `ProductService` (2×)._
- [x] 1.2 Confirm `base_*` money is read as base currency — `VariantResource` passes no currency argument to `Money::prepare_amount_from_minor()`, and `MoneyManager` substitutes `get_base_currency()` when that argument is empty
  - _Confirmed. `VariantResource` calls `Money::prepare_amount_from_minor($this->base_price)` with no currency, and `prepare_money_from_minor()` does `$currency_code ?? $this->get_base_currency()`._
- [x] 1.3 Reproduce the currency-deletion failure on a dev database: switch the base currency, then try to delete the former base while older products still reference it, and record the error
  - _Reproduced on the test database instead of the dev one, which still has the pre-squash schema: `CurrencyApiTest::test_delete_former_base_currency_with_existing_products` fails with `Cannot delete or update a parent row … fk_kecom_products_currency_id`. The test stays as the regression test for 7.3._

## 2. Database migration

- [x] 2.1 In `database/migrations/CreateProductsTable.php`, remove the `currency_id` column, its `idx_kecom_products_currency_id` index, and its `fk_kecom_products_currency_id` foreign key. Do not add an alter migration (pre-release policy, `schema-upgrade-migrations`)

## 3. PHP model, DTOs, and requests

- [x] 3.1 Remove `currency_id` from `$casts` and `$fillable` in `app/Models/Product.php`, delete the `currency()` belongs-to relation, and drop the `Currency` import if nothing else in the file uses it
- [x] 3.2 Remove the `$currency_id` property from `app/DTO/Product/CreateProductDTO.php` and `app/DTO/Product/UpdateProductDTO.php`
- [x] 3.3 Remove the `currency_id` validation rule and the `Sanitizer::INT` entry from `app/Http/Requests/Product/ProductCreateRequest.php`
- [x] 3.4 Remove the same two entries from `app/Http/Requests/Product/ProductUpdateRequest.php`
- [x] 3.5 Remove the `currency_id` copy from `app/Actions/Product/DuplicateProductAction.php`
- [x] 3.6 Remove `'currency'` from both `Product::with([...])` eager-load lists in `app/Services/ProductService.php` (`find` and `update` paths)
- [x] 3.7 Remove `'variant.product.currency'` from the eager-load list in `app/Services/WishlistService.php::list_query()`
  - _Found by 4.2; missed by 1.1 because it names the relation by path, not as `'currency'`. `WishlistResource` never read it: prices go through `Money::resolve_display_currency()`._

## 4. API response (breaking)

- [x] 4.1 Remove the `currency` key from `app/Resources/Product/ProductResource.php`
- [x] 4.2 Confirm no other resource, view, or shortcode reads `$product->currency` or `$product->currency_id`
  - _Only hit was `WishlistService`'s eager load, handled as 3.7. No view or shortcode reads it._
- [x] 4.3 Remove `currency_id` from the product request/response examples and the product-level `currency` object from the response examples in `docs/ecommerce/products/{create-3,edit-3,get-by-id-3,shop-product-html}.yml` and `docs/ecommerce/Site/checkout.yml`
  - _Added during apply: the API docs are part of the change per the project's docs rule._

## 5. Seeders

- [x] 5.1 Remove the `currency_id` value from `database/seeders/ProductSeeder.php`
- [x] 5.2 Remove `currency_id` from `make_product_data()` in `database/seeders/OnBoarding/ProductSeeder.php` and delete the now-unused `resolve_base_currency_id()` helper and its call site
- [x] 5.3 Remove `'currency_id' => $this->base_currency_id()` from `product_payload()` in `tests/Support/CreatesTestProducts.php`; keep `SeedsTestCurrency::base_currency_id()` only if another caller still uses it
  - _`base_currency_id()` had no other caller and is deleted. The `currency_id` line was also how classes like `ScheduledProductPublishingTest` and `MailJobsTest` got a base currency (16 failures without it), so `product_payload()` now calls `seed_base_currency()` explicitly._

## 6. Frontend schemas and form

- [x] 6.1 Remove `ProductCurrencySchema` and the `currency` field from `resources/app/features/products/schemas/catalog/product.ts`
- [x] 6.2 Remove the `currency` field and the `currency_id: values.currency?.id ?? null` payload mapping from `resources/app/features/products/schemas/forms/product-form.ts`
- [x] 6.3 Remove the `currency: defaultSettings?.base_currency ?? null` line from the seeded values in `resources/app/features/products/pages/create-product.tsx`, and drop `useDefaultSettingsQuery` there if nothing else in the file uses it
  - _`useDefaultSettingsQuery` had no other use in the file and is removed with its loading flag._
- [x] 6.4 Remove the two `currency_id` assertions from `resources/app/features/products/tests/schemas/forms/product-form.test.ts`
- [x] 6.5 Confirm `resources/app/schemas/catalog/app-config.ts` still defines its own currency shape and was not depending on the removed `ProductCurrencySchema`
  - _Confirmed. Its doc comment and the one in `schemas/catalog/settings.ts` described it as a copy of `ProductCurrencySchema`; both are reworded._

## 7. Verification

- [x] 7.1 Run the migrations on a database built from scratch, and confirm `kirki_ecommerce_products` has no `currency_id` column, index, or foreign key
  - _Checked with a temporary integration test on the test database (deleted afterwards): no `%currency%` column or index on `kirki_ecommerce_products`, and no FK references `kirki_ecommerce_currencies`._
- [x] 7.3 Exercise product create, update, and duplicate, plus the product list and detail endpoints, and confirm no layer writes or reads the dropped column
  - _Covered by `ProductApiTest` (create, show, update, list, duplicate) on the full Integration run: OK (629)._
- [x] 7.4 Delete a currency that was previously the base and is still referenced by older products — the case recorded in 1.3 — and confirm it now succeeds
  - _Covered by `CurrencyApiTest::test_delete_former_base_currency_with_existing_products`, which failed in 1.3 and now passes. It reloads `MoneyManager`'s process-wide base currency after each switch, as a new request would, and forgets the singleton afterwards so later tests don't inherit it._
- [x] 7.5 Confirm money display is unchanged: the product form, variants table, and SEO preview still show the store's base currency symbol and code
  - _Not checked in a browser (project rule). `npm run typecheck` passes with `currency` gone from the product schemas, so no component reads it; money fields already use `useBaseCurrency`/`useBaseCurrencySymbol`. Worth a quick visual look._
- [x] 7.6 Run `composer phpcs:wporg`, then `npm run typecheck`, `npm run lint`, and `npm test` in `resources/app/`, and confirm no new failures against the pre-change baseline
  - _phpcs on every touched PHP file: findings identical to HEAD (pre-existing). Typecheck OK. Lint: 10 errors/2 warnings, all in files this change doesn't touch. `npm test`: same 3 baseline coupon-form failures. PHP Unit OK (400), Integration OK (629 = 628 + the new regression test)._
