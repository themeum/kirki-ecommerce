## 1. Baseline and premise

- [x] 1.1 Re-confirm nothing reads `llm_instructions`: grep the repo (excluding `vendor/` and archived changes) and confirm the only hits are the ones listed in proposal.md Impact, plus the `product-seo-card` spec
  - _Confirmed: hits match proposal.md Impact exactly, plus `openspec/specs/product-seo-card/spec.md`._
- [x] 1.2 Record baselines: `bash kirki-test unit`, `bash kirki-test integration`, and `npm run typecheck`, `npm run lint`, `npm test` in `resources/app/` (expected: 3 coupon-form test failures and existing lint errors in untouched files)
  - _Baseline (on top of the uncommitted `remove-product-currency-id` work): Unit OK (400), Integration OK (629), typecheck OK, lint 10 errors / 2 warnings, `npm test` 3 failed / 1358 (coupon-form)._
- [x] 1.3 Verify: `npm run typecheck && npm test` (from `resources/app/`) matches the baseline

## 2. Database and PHP

- [x] 2.1 Remove `$table->text('llm_instructions')->nullable();` from `database/migrations/CreateProductsTable.php`. Do not add an alter migration
- [x] 2.2 Remove `'llm_instructions'` from `$fillable` in `app/Models/Product.php`
- [x] 2.3 Remove the `$llm_instructions` property from `app/DTO/Product/CreateProductDTO.php` and `app/DTO/Product/UpdateProductDTO.php`
- [x] 2.4 Remove the `llm_instructions` validation rule and `Sanitizer::TEXT` entry from `app/Http/Requests/Product/ProductCreateRequest.php` and `app/Http/Requests/Product/ProductUpdateRequest.php`
- [x] 2.5 Remove the `llm_instructions` copy from `app/Actions/Product/DuplicateProductAction.php`
- [x] 2.6 Remove the `llm_instructions` key from `app/Resources/Product/ProductResource.php`
- [x] 2.7 Remove the `llm_instructions` value from `database/seeders/ProductSeeder.php`
- [x] 2.8 Run `bash kirki-test unit` and `bash kirki-test integration`, and confirm they match the baseline from 1.2
  - _Unit OK (400), Integration OK (629), the same as the baseline._
- [x] 2.9 Verify: `npm run typecheck && npm test` (from `resources/app/`) matches the baseline

## 3. Frontend

- [x] 3.1 Remove `llm_instructions` from `ProductSchema` in `resources/app/features/products/schemas/catalog/product.ts`
- [x] 3.2 Remove `llm_instructions` from `ProductSeoFormSchema` (`schemas/forms/product-seo-form.ts`) and from the payload transform in `schemas/forms/product-form.ts`. In the same task, update the payload test `features/products/tests/schemas/forms/product-form.test.ts`: drop the two `llm_instructions` fixtures and assert that the parsed payload has no `llm_instructions` key
  - _Added `expect(result).not.toHaveProperty('llm_instructions')` to the simple-product payload test. It would have failed before: the transform always emitted the key, as `null`._
- [x] 3.3 Delete the unused `features/products/components/product-form/sections/seo-settings/aeo.tsx`, and confirm nothing imports it
  - _Deleted with `git rm`; no importer existed._
- [x] 3.4 Run `npm run lint` and confirm no new findings in touched files against the baseline from 1.2
  - _10 errors / 2 warnings, the same as the baseline, all in untouched files._
- [x] 3.5 Verify: `npm run typecheck && npm test` (from `resources/app/`) matches the baseline

## 4. Docs

- [x] 4.1 Remove `llm_instructions` from the request and response examples in `docs/ecommerce/products/{create-3,edit-3,get-by-id-3,shop-product-html}.yml` and `docs/ecommerce/Site/checkout.yml`
- [x] 4.2 Re-run the grep from 1.1 and confirm `llm_instructions` remains only in this change's own artifacts, the `product-seo-card` spec (until sync), and archived changes
  - _Remaining hits: `openspec/specs/product-seo-card/spec.md` (synced at archive) and the new negative assertion in `product-form.test.ts`._
- [x] 4.3 Verify: `npm run typecheck && npm test` (from `resources/app/`) matches the baseline

## 5. Verification

- [x] 5.1 Build the schema from scratch on the test database and confirm `kirki_ecommerce_products` has no `llm_instructions` column
  - _Temporary integration test (deleted afterwards) listed the fresh `kirki_ecommerce_products` columns: no `llm_instructions` (and no `currency_id`)._
- [x] 5.2 In `tests/Integration/ProductApiTest.php::test_show_product_returns_resource`, assert the response has no `llm_instructions` key. Then confirm the product create, update, duplicate, show, and list integration tests pass
  - _Assertion added. Full Integration run: OK (629 tests, 12302 assertions; one more assertion than the baseline)._
- [x] 5.3 Run phpcs on every touched PHP file and confirm its findings match the HEAD versions
  - _Findings for all 10 touched PHP files match HEAD (two existing PSR-12 header/trait errors in `Product.php` and `ProductResource.php`)._
- [x] 5.4 Run `openspec validate remove-product-llm-instructions --strict`
- [x] 5.5 Verify: `npm run typecheck && npm test` (from `resources/app/`) matches the baseline
