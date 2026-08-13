## 1. Simple 1:1 repositories — batch A (Address, Tag, Country, Page, ShippingBox, ShippingProfile, TaxProfile)

- [x] 1.1 Move `AddressRepository` method bodies into `AddressService`; delete `AddressRepository`; remove its `use` import and constructor dependency from `AddressService`
- [x] 1.2 Move `TagRepository` method bodies (including `list_query()` helper and slug-uniqueness call) into `TagService`; delete `TagRepository`; remove its import/dependency
- [x] 1.3 Move `CountryRepository` method bodies into `CountryService`; delete `CountryRepository`; remove its import/dependency
- [x] 1.4 Move `PageRepository` method bodies into `PageService`; delete `PageRepository`; remove its import/dependency
- [x] 1.5 Move `ShippingBoxRepository` method bodies into `ShippingBoxService`; delete `ShippingBoxRepository`; remove its import/dependency
- [x] 1.6 Move `ShippingProfileRepository` method bodies into `ShippingProfileService`; delete `ShippingProfileRepository`; remove its import/dependency
- [x] 1.7 Move `TaxProfileRepository` method bodies into `TaxProfileService`; delete `TaxProfileRepository`; remove its import/dependency
- [x] 1.8 Run `composer test:unit` and `composer test:integration` (or `composer test`); fix any failures before proceeding — verified together with batch B (2.8) in the same test run; all batch A/B integration tests pass, re-confirmed by the full suite run at 7.3
- [x] 1.9 Run `phpcs` against changed files per `phpcs.xml.dist`; fix any violations — `phpcs` is not installed in this environment (not a composer dependency, no global binary, not in the docker test image); followed CLAUDE.md's PHP conventions manually instead

## 2. Simple 1:1 repositories — batch B (Attribute, AttributeValue, Brand, Category, Collection, Customer, ProductSchema)

- [x] 2.1 Move `AttributeRepository` method bodies into `AttributeService`; delete `AttributeRepository`; remove its import/dependency
- [x] 2.2 Move `AttributeValueRepository` method bodies into `AttributeValueService`; delete `AttributeValueRepository`; remove its import/dependency
- [x] 2.3 Move `BrandRepository` method bodies into `BrandService`; delete `BrandRepository`; remove its import/dependency
- [x] 2.4 Move `CategoryRepository` method bodies into `CategoryService`; delete `CategoryRepository`; remove its import/dependency
- [x] 2.5 Move `CollectionRepository` method bodies into `CollectionService`; delete `CollectionRepository`; remove its import/dependency
- [x] 2.6 Move `CustomerRepository` method bodies into `CustomerService`; delete `CustomerRepository`; remove its import/dependency
- [x] 2.7 Move `ProductSchemaRepository` method bodies into `ProductSchemaService`; delete `ProductSchemaRepository`; remove its import/dependency
- [x] 2.8 Run `composer test:unit` and `composer test:integration`; fix any failures before proceeding — ran together with batch A (see 1.8); all Address/Tag/Country/Page/ShippingBox/ShippingProfile/TaxProfile/Attribute/AttributeValue/Brand/Category/Collection/Customer/ProductSchema integration tests pass
- [x] 2.9 Run `phpcs` against changed files; fix any violations — `phpcs` not available in this environment (see 1.9)

## 3. Simple 1:1 repositories — batch C (Cart, Coupon, Order)

- [x] 3.1 Move `CartRepository` method bodies (including eager-loading variants per method, mutate-then-refetch pattern in `update_by_token`/`update_cart`) into `CartService`; delete `CartRepository`; remove its import/dependency
- [x] 3.2 Move `CouponRepository` method bodies into `CouponService`; delete `CouponRepository`; remove its import/dependency
- [x] 3.3 Move `OrderRepository` method bodies (including `list_query()` filter/search logic and eager-loading baked into `find`/`find_by_uuid`/`find_by_transaction_id`) into `OrderService`; delete `OrderRepository`; remove its import/dependency
- [x] 3.4 Run `composer test:unit` and `composer test:integration`; fix any failures before proceeding — confirmed remaining 6 failures/1 error (Cart, Order, Product tests) are pre-existing on unmodified `dev` (verified via `git stash` + rerun against original code), unrelated to this refactor
- [x] 3.5 Run `phpcs` against changed files; fix any violations — `phpcs` not available in this environment (see 1.9)

## 4. Currency (multi-consumer: CurrencyService, MoneyManager, Currency support class)

- [x] 4.1 Move `CurrencyRepository` method bodies into `CurrencyService`; remove `CurrencyRepository` import/dependency from `CurrencyService`
- [x] 4.2 Inspect `app/Managers/MoneyManager.php:119` call site; replace `new CurrencyRepository()` with a `CurrencyService` dependency resolved the same way the class resolves its other dependencies — per design.md decision 4's implementation-time check: `MoneyManager` is instantiated via `new static`, never container-resolved, and the caller needs the raw null-on-missing lookup (`CurrencyService::find_by_code` throws `NotFoundException` instead). Used the `Currency` model (`Kirki\Ecommerce\App\Models\Currency`, aliased `CurrencyModel`) directly — same one-line query the repository did, no exception-vs-null mismatch, consistent with the class's existing non-DI dependency style (helper functions, static Supports calls).
- [x] 4.3 Inspect `app/Supports/Currency.php:71` call site; replace `new CurrencyRepository()` with a `CurrencyService` dependency resolved the same way the class resolves its other dependencies — same reasoning as 4.2: `Currency` support class is 100% static methods with no DI; used the `Currency` model directly instead of `CurrencyService`.
- [x] 4.4 Delete `CurrencyRepository`
- [x] 4.5 Run `composer test:unit` and `composer test:integration`, with particular attention to currency/pricing-related tests; fix any failures before proceeding
- [x] 4.6 Run `phpcs` against changed files; fix any violations — `phpcs` not available in this environment (see 1.9)

## 5. Variant (multi-consumer: VariantService, InventoryService)

- [x] 5.1 Move `VariantRepository` method bodies into `VariantService`, preserving `bulk_update()`'s `DB::begin_transaction()/commit()/roll_back()` transaction boundary intact — repository's `update()` renamed to protected `update_variant()` on the service to avoid colliding with the service's existing public `update(UpdateVariantDTO $data)`; added public `find_or_null()` so `InventoryService` keeps its non-throwing lookup (the service's public `find()` throws `NotFoundException`, which would have changed InventoryService's error messages)
- [x] 5.2 Update `InventoryService` to depend on `VariantService` instead of `VariantRepository` for the calls it currently makes directly against the repository
- [x] 5.3 Delete `VariantRepository`; remove its import/dependency from both `VariantService` and `InventoryService`
- [x] 5.4 Run `composer test:unit` and `composer test:integration`, with particular attention to variant/inventory tests; fix any failures before proceeding
- [x] 5.5 Run `phpcs` against changed files; fix any violations — `phpcs` not available in this environment (see 1.9)

## 6. Product (controller bypasses service to call repository directly)

- [x] 6.1 Read the exact `ProductRepository` call site in `app/Http/Controllers/Api/ProductController.php:34` to confirm what it needs from the repository — found `$this->repository` is assigned in the constructor but never read anywhere in the file; it's dead code, not an active bypass (see design.md "Correction during implementation")
- [x] 6.2 Move `ProductRepository` method bodies (including `apply_filters()` and `list_query()`) into `ProductService`
- [x] 6.3 Add or reuse a `ProductService` method equivalent to what `ProductController` was calling on `ProductRepository` directly, preserving the same query shape/result — not needed; nothing was actually being called (see 6.1)
- [x] 6.4 Update `ProductController` to drop its direct `ProductRepository` dependency and call the equivalent `ProductService` method instead — dropped the unused `ProductRepository $repository` param/property; no new call needed, controller now depends only on `ProductService`
- [x] 6.5 Delete `ProductRepository`; remove its import/dependency from `ProductService` and `ProductController`
- [x] 6.6 Run `composer test:unit` and `composer test:integration`, with particular attention to product tests; fix any failures before proceeding
- [x] 6.7 Run `phpcs` against changed files; fix any violations — `phpcs` not available in this environment (see 1.9)

## 7. Final cleanup and full verification

- [x] 7.1 Confirm `app/Repositories/` contains no files (18/18 migrated) and remove the empty directory
- [x] 7.2 Grep the repo for any remaining `Kirki\Ecommerce\App\Repositories` references outside `app/Scheduler/Repositories/QueueRepository.php` (out of scope) and resolve any stragglers — none found; `QueueRepository` (different namespace, out of scope) untouched
- [x] 7.3 Run the full `composer test` suite — `composer test:unit`: 117/117 pass. `composer test:docker:integration`: 201 tests, 3223 assertions, 1 error/6 failures — identical to the confirmed pre-existing baseline on unmodified `dev` (verified via `git stash`); zero regressions introduced by this change
- [x] 7.4 Run `phpcs` across the full `app/` tree per `phpcs.xml.dist` — `phpcs` not available in this environment (see 1.9); followed CLAUDE.md's PHP conventions manually throughout
- [x] 7.5 Confirm no behavior change: verify `tests/Integration/ProductApiTest.php`, `OrderApiTest.php`, `VariantApiTest.php`, and any currency-related integration tests (the 4 non-trivial migrations) pass unmodified against the refactored services — Product/Order tests show the same pre-existing failures as baseline (unrelated to this refactor, confirmed via `git stash`); Variant and Currency tests fully pass
