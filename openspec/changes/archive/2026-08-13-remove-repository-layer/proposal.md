## Why

`app/Repositories/` (18 classes) adds no separation of concerns over `app/Services/` (26 classes) — every repository is a bare `class XxxRepository` with no interface, no shared base class, and exactly one consumer pattern: a Service that either passes calls straight through (`return $this->repository->method($args)`) or wraps them with a `NotFoundException` check. All real query logic (filters, eager-loading, sorting, transactions) already lives in the repositories, not duplicated in services, so there is no abstraction being protected — just an indirection tax on every read/write path. Removing the layer collapses two files doing one job into one, without changing any behavior.

## What Changes

- Move each repository class's method bodies into its corresponding service class, preserving behavior exactly (query filters, eager-loading shapes, sort logic, `DB::begin_transaction()/commit()/roll_back()` in `VariantRepository::bulk_update()`, slug generation, etc.).
- Delete all 18 files in `app/Repositories/` and the directory itself.
- Remove the `Repositories` sub-namespace: drop `use Kirki\Ecommerce\App\Repositories\XxxRepository;` imports and constructor type-hints across all consumers.
- Update `ProductController` to depend only on `ProductService` (currently injects `ProductRepository` directly, bypassing the service) — call the equivalent service method instead.
- Update `MoneyManager` and `Currency` (`app/Supports/Currency.php`), which each do `new CurrencyRepository()` directly, to depend on `CurrencyService` instead.
- `VariantRepository` is shared by both `VariantService` and `InventoryService` — its methods move into `VariantService`, and `InventoryService` switches to consuming `VariantService` for what it currently gets from the repository directly.
- **BREAKING (internal only)**: the `Kirki\Ecommerce\App\Repositories\*` classes are deleted. No public/API-facing behavior changes — this is purely an internal architecture change. Nothing outside `app/` (routes, REST responses, DTOs) is affected.

## Capabilities

No spec-level behavior changes — this is a pure internal refactor (`skip_specs: true`). All 18 repositories have exactly one behavioral surface today (their consuming Service's public API), and that surface is preserved unchanged; only the code's internal shape moves. No new or modified capability specs apply.

## Impact

- **Affected code**: `app/Repositories/*.php` (18 files, deleted), `app/Services/*.php` (15 services gain repository logic inline: Address, Attribute, AttributeValue, Brand, Cart, Category, Collection, Country, Coupon, Currency, Customer, Order, Page, ProductSchema, ShippingBox, ShippingProfile, Tag, TaxProfile — plus Product, Variant per below), `app/Http/Controllers/Api/ProductController.php` (drop direct repository dependency), `app/Managers/MoneyManager.php` and `app/Supports/Currency.php` (switch to `CurrencyService`), `app/Services/InventoryService.php` (switch to `VariantService`).
- **Not affected**: `app/Scheduler/Repositories/QueueRepository.php` (different namespace/directory, out of scope), all REST routes/responses, DTOs, database migrations, and the 19 `tests/Integration/*ApiTest.php` files (none instantiate repositories directly — they exercise the stack via HTTP, so behavior-preserving moves should not require test changes).
- **Dependencies**: none — no composer package removal, no DI container bindings to unregister (repositories were resolved by concrete-class auto-wiring, never bound as interfaces).
