## Context

See proposal.md - Why/What Changes for motivation and full scope. Key facts from the codebase survey that shape this design:

- 18 repositories, no interfaces, no base class — each `XxxRepository` is a standalone class holding real Eloquent query logic (`list_query()`/`apply_filters()` patterns, eager-loading shapes, transactions).
- 15 of 18 repos have exactly one consumer: their matching `XxxService`, injected by constructor type-hint, called in passthrough fashion.
- 3 repos break the 1:1 pattern and need extra handling: `CurrencyRepository` (consumed by `CurrencyService`, `MoneyManager`, `Currency` support class), `ProductRepository` (consumed by `ProductService` **and** `ProductController` directly), `VariantRepository` (consumed by both `VariantService` and `InventoryService`).
- No DI container bindings exist for repositories — resolution is concrete-class auto-wiring, so removing a class is just deleting the file and its `use`/type-hint references, not touching a service provider.
- No tests instantiate repositories directly; all 19 integration tests exercise services via HTTP, so this is a "same public API surface" refactor verifiable end-to-end.

## Goals / Non-Goals

**Goals:**
- Eliminate `app/Repositories/` entirely, with zero behavior change to any Service's public methods or downstream API responses.
- Every repository method body lands in its service verbatim (same query filters, same eager-loading, same sort logic, same transaction boundaries) — this is a move, not a rewrite.
- Give the 3 non-1:1 repos (Currency, Product, Variant) a single clean home rather than duplicating logic across two services or leaving a controller reaching past its service.

**Non-Goals:**
- No change to method signatures, return types (Models/collections), or DTO shapes consumed by controllers — only the repository indirection is removed.
- No introduction of a new abstraction (no `BaseService` CRUD trait, no interfaces) to replace what the repositories provided — the survey found no shared base class to preserve, so none is being invented.
- No changes to `app/Scheduler/Repositories/QueueRepository` — different namespace, different concern, out of scope.
- No changes to migrations, DTOs, or REST route definitions.

## Decisions

**1. Move method bodies as-is; do not "clean up" queries while moving.**
Repository methods (e.g. `ProductRepository::apply_filters()`, ~100 lines) move into the service unchanged. Any simplification is a separate, later refactor — mixing "move" and "improve" in one change makes the diff unreviewable and risks silently changing filter behavior. Rationale: the proposal's contract is zero behavior change; that's only checkable if the moved code is textually traceable to its origin.

**2. Inline repository methods as `protected` methods on the service, not a new trait/base class.**
Alternative considered: extract shared CRUD (`find`, `create`, `update`, `delete`, `bulk_delete`) into a `Concerns/HasCrud` trait, since the pattern repeats across all 18 repos. Rejected for this change: the survey found these were already independently copy-pasted per repository (no existing base class), so introducing a trait now is a new abstraction beyond what was asked — it can be proposed separately once the flattened services make the duplication visible in one place. For this change, each service simply gains its former repository's methods as its own methods (public where the service already exposes that operation, protected for internal helpers like `list_query()`).

**3. Method naming: keep repository method names, resolve collisions by merging call sites.**
Where a service method was a pure passthrough (`Service::find($id) { return $repo->find($id); }`), the repository body replaces the passthrough body directly — no new method, no rename. Where the repository had a private helper (`list_query()`) called by multiple repository methods, that helper moves in as a `protected` method on the service under the same name.

**4. `CurrencyRepository` → fold into `CurrencyService`; `MoneyManager` and `Currency` depend on `CurrencyService`.**
Alternative considered: keep `CurrencyRepository` alive solely for `MoneyManager`/`Currency` since it's a low-level shared read path. Rejected: that leaves the repository layer partially in place, defeating the point of the change, and `CurrencyService` is the natural single owner of currency lookups. `MoneyManager::from_code()`-style helpers and `Currency::` (app/Supports) switch their `new CurrencyRepository()` calls to constructor-injected `CurrencyService` (or, if either class is instantiated outside the container in a context without DI, to a resolved-once static accessor consistent with how the class already obtains its other dependencies — verify at implementation time and prefer constructor injection wherever the class is already container-resolved).

**5. `ProductController`'s direct `ProductRepository` injection → replaced with a call through `ProductService`.**
The controller bypassing its service to hit the repository directly is the one place where "repository as its own layer" was actually being used as such — this is the reason it must move, not be deleted outright. Add the missing method (or reuse an existing equivalent) on `ProductService` that does what the controller was getting from `ProductRepository` directly, and update the controller to call it there. No route/response shape change.

**6. `VariantRepository` shared by `VariantService` and `InventoryService` → owned by `VariantService`; `InventoryService` depends on `VariantService`.**
`VariantService` is the natural owner (variant is the entity). `InventoryService` already being a consumer of variant data rather than the other way around, it switches its `VariantRepository` calls to equivalent `VariantService` calls. `VariantRepository::bulk_update()`'s `DB::begin_transaction()/commit()/roll_back()` moves into `VariantService::bulk_update()` intact — transaction boundary does not change.

**7. Order of migration: one repository/service pair per commit-sized unit, simple ones first.**
Do the 15 clean 1:1 pairs first (mechanical, low risk), then the 3 special cases (Currency, Product, Variant) last since they touch multiple consumers. This keeps each step independently verifiable against the integration test suite and easy to bisect if something regresses.

## Risks / Trade-offs

- **[Risk] A repository method's query behavior is subtly changed during the copy-paste move (e.g. an eager-load relation dropped, a `when()` condition mistyped).** → Mitigation: move method bodies verbatim in the same commit/step as deleting the repository method, run the relevant `tests/Integration/*ApiTest.php` file immediately after each service is migrated (per proposal.md - Impact, all 19 integration files exercise services via HTTP and should catch behavioral drift), and diff each moved method against its repository source before deleting the repository file.
- **[Risk] `MoneyManager`/`Currency` are instantiated outside normal controller DI (static-ish helper usage) where constructor injection of `CurrencyService` isn't straightforward.** → Mitigation: inspect both call sites at implementation time (design decision 4); if the class isn't container-resolved, use the same resolution mechanism the class already uses for its other dependencies rather than inventing a new one (e.g. a static container helper already used elsewhere in the codebase), keeping the change consistent with existing patterns rather than introducing a new DI style.
- **[Risk] `ProductController`'s direct repository call may be doing something `ProductService` doesn't currently expose (e.g. a raw query shortcut for performance).** → Mitigation: read the exact controller call site before migrating (decision 5) and confirm the equivalent service method preserves the same query shape/performance characteristics, not just the same return type.
- **[Trade-off] No shared CRUD trait is introduced (decision 2), so some boilerplate (`find`/`create`/`update`/`delete`) will now be duplicated across 18 services instead of 18 repositories.** → Accepted: this duplication already existed pre-change (repos didn't share a base class either), so this is not a regression, and inventing a trait now would be scope creep beyond "remove the repository layer."

## Migration Plan

1. Migrate the 15 one-to-one repository/service pairs (Address, Attribute, AttributeValue, Brand, Cart, Category, Collection, Country, Coupon, Customer, Order, Page, ProductSchema, ShippingBox, ShippingProfile, Tag, TaxProfile), one pair at a time: copy method bodies into the service, delete the repository file, remove its `use` import and constructor dependency, run that resource's integration test.
2. Migrate `CurrencyRepository` into `CurrencyService`; update `MoneyManager` and `Currency` to use `CurrencyService`; delete `CurrencyRepository`; run currency-related tests.
3. Migrate `VariantRepository` into `VariantService`; update `InventoryService` to depend on `VariantService`; delete `VariantRepository`; run variant/inventory tests.
4. Migrate `ProductRepository` into `ProductService`; update `ProductController` to drop its direct repository dependency and call `ProductService` instead; delete `ProductRepository`; run product tests.
5. Confirm `app/Repositories/` is empty and remove the directory; run the full test suite (`composer test` / project's PHP test command) and `npm run typecheck` per CLAUDE.md §0 (no browser verification for this change — it's backend-only).

Rollback: each step is an independent, revertible commit (or task group) — if step N regresses, revert that step's commit without affecting the already-migrated steps before it.

## Open Questions

None — the two implementation-time checks in decisions 4 and 5 (exact `MoneyManager`/`Currency` instantiation context; exact `ProductController` repository call site) are concrete lookups, not decisions that would change the approach, specs, or task breakdown.

## Correction during implementation

The proposal's survey found `CartRepository` had exactly one consumer (`CartService`). During task 3.1, `app/Services/GuestCartService.php` (which `extends CartService`) turned out to also reach the repository directly via the inherited `protected $repository` property (`$this->repository->find_by_token($token)` in `ensure_guest_cart_cookie()`), rather than going through a `CartService` method. This wasn't a distinct consumer registered via constructor injection, so it didn't show up in the original grep for `new XxxRepository`/type-hint injection — it only surfaced once the property was removed and PHP's `-l`/runtime resolution would have failed. Fixed by making the moved repository methods (`find_by_token`, `find_by_customer`, `create_cart`, `update_cart`, `add_item_to_cart`, `update_by_token`) `protected` methods on `CartService` (accessible to the `GuestCartService` subclass) and updating the call site to `$this->find_by_token($token)`. No approach or task-breakdown change — same migration target, just one more call site to fix.

Task 5.1 (Variant): `VariantRepository::find()` returned `null` on a miss; `InventoryService` relied on that and threw its own `NotFoundException` with a per-call custom message (e.g. "Variant with id %s could not be found."). `VariantService`'s pre-existing public `find()` throws a differently-worded `NotFoundException` ("Variant not found.") on a miss. Routing `InventoryService`'s internal lookups through the public `find()` would have silently changed the exception message returned to API consumers. Added `VariantService::find_or_null()` (a public, non-throwing raw lookup) for `InventoryService` to call instead, keeping `InventoryService`'s own not-found messages exactly as they were.

Task 6 (Product): decision 5 assumed `ProductController`'s direct `ProductRepository $repository` constructor injection was an active bypass reaching real repository functionality, so the plan was to add/reuse a `ProductService` method for it to call instead. On inspection, `$this->repository` is assigned in the constructor (`ProductController.php:37`) but never read anywhere else in the file (`grep -n "this->repository"` returns only the assignment line) — it's dead code, not a bypass. No `ProductService` method needed; the fix is simply to drop the unused `ProductRepository $repository` constructor parameter and `protected $repository` property, leaving `ProductService $service` as the controller's only dependency. Same end state (repository gone, controller depends only on the service), smaller diff than planned.
