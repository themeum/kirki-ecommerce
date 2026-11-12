# Design

## Context

See `proposal.md` (Why). Verified state of the code:

- `MoneyManager` is a container singleton (`AppServiceProvider`), and the `money` alias resolves to it. The `Money` facade caches that instance.
- `MoneyManager::to_minor()`, `from_minor()`, `format_from_minor()` and `format_from_decimal()` call `new static()`. The constructor runs `base_currency()`, which runs `Currency::base()->first()`. The query runs even when the caller passes a currency. `format_from_minor()` creates two managers.
- `Supports\Currency::resolve_currency()` runs `CurrencyModel::where('code', ...)->first()` on every call. `MoneyManager::convert_to_currency()` uses it through `exchange_rate()`.
- `MoneyManager::resolve_requested_currency()` reads the currency table for the cookie or header code. This is cached on the singleton for the request.
- `CurrencyService` has no constructor and no dependencies. It is not bound as a singleton, so each `app()->make()` gives a new object.
- The framework `Route` does not use the container for controllers. Its own `make()` builds a controller and its constructor dependencies with reflection and a static cache, so `CurrencyController` holds a `CurrencyService` object that `app(CurrencyService::class)` never returns, even if the service were bound as a singleton.
- `CurrencyService` write paths call `get_base_currency()` themselves (`insert()`, `with_demoted_bases()`).
- `CurrencySeeder` and some integration tests write `Currency` rows directly, without the service.
- The framework `Model` has no save or delete events.
- Unit tests replace `CurrencyService` with a fake in the container (`TestCase::bind_money_dependencies`). The fake has `get_base_currency()`, `get_symbol_map()` and `get_currency_preferences()` only.

## Goals / Non-Goals

**Goals:**
- At most one currencies query per request for all money and currency reads.
- One place owns the cache and its clearing.
- No stale data after a write in the same request.
- Keep all call sites (about 229 `Money::` calls) and all released signatures.

**Non-Goals:**
- No cross-request cache (object cache, transient). Clearing it on every write and on every plugin that writes would add risk for no need.
- No change to `MoneyManager`'s static symbol cache, `get_currency_preferences()`, or settings caching.
- No change to `prepare_amount_object_from_minor()` building two Money objects. This costs CPU, not queries. It can be a separate change.
- No change to `PresetContext` or `get_active_currencies()`. They are not on the hot path.
- Not fixing the `exchange_rate === 0` check (see Risks).

## Decisions

### 1. Cache in `CurrencyService`, in a `static` property

`CurrencyService` keeps `protected static $currencies = null`: all currency models keyed by upper-case code. A protected `load()` fills it on first use. The property is `static` so that every `CurrencyService` object shares one copy, whoever built the object (the container, the router, or `new`). The codebase already uses this pattern: `MoneyManager::$currency_symbols`, `SettingsFactory::$cache`, `OptionManager::$cache`.

Reads that use it:
- `get_base_currency()`: the first row with `is_base`, or null. Same return type as before.
- `get_symbol_map()`: derived from the cached rows. Same shape as before.
- `get_by_code(string $code)`: new. Returns the model or null, and does not throw. The key is upper-cased, which matches the case-insensitive database lookup.

`flush_cache()` (public, called on any object) sets the static `$currencies` to null.

Why this over other choices:

| Choice | Verdict |
|---|---|
| Static cache in `CurrencyService` (chosen) | The service already owns all writes, so cache and clearing stay in one file. No new class. Works for every object that builds the service. Tests clear it with `flush_cache()`. |
| Instance cache with a container singleton | Does not work today. The router builds its own `CurrencyService` for controllers, so a write through the API clears a different cache from the one money code reads. Tested: 7 order tests failed. It would also need a framework change first. |
| Fix `Route::make()` to use the container, then use a singleton | A good framework change, and it can be done later on its own. This change should not depend on a framework release. |
| New `CurrencyCache` class | One more class to wire for one array. Add it only if the cache needs a TTL or a shared store later. |
| Cache in `MoneyManager` | `Supports\Currency`, `base_currency()` and the writers would not share it, so the same query would still repeat. |
| Lazy load per code | Needs "not found" entries and a base lookup by flag. It makes up to 4 queries (base, requested, target, symbols). One load of all rows is simpler. The table holds a few rows. |

### 2. `MoneyManager` keeps no currency state

- Remove the constructor and the `$base_currency` property.
- `get_base_currency()` returns `app(CurrencyService::class)->get_base_currency()->code`.
- `load_base_currency()` stays public (released). It calls `flush_cache()` and returns `$this`.
- `resolve_requested_currency()` uses `get_by_code()` and keeps its own per-request memo.
- `new MoneyManager()` still works.

The base currency cannot be stale in the manager any more, because the manager does not copy it.

### 3. Remove `new static()`

- `to_minor()` and `from_minor()` stay `static`. They use `$instance = app(static::class)`. In production this is the singleton. A subclass that is not bound gets a new instance from autowiring, which is now free because the constructor does nothing.
- `format_from_minor()` and `format_from_decimal()` are instance methods. They use `$this` and the cached base currency. They no longer call `new static()` or the static helpers.
- `ProductService` still calls `MoneyManager::to_minor()` statically. This keeps working.

### 4. `Supports\Currency::resolve_currency()` reads `get_by_code()`

`exchange_rate()`, `is_active()`, `convert()` and `format()` get the cache without other change. The thrown messages stay the same.

### 5. Clear the cache after every write

- Each `CurrencyService` write method calls `flush_cache()` after the write: `insert`, `create`, `update`, `delete`, `bulk_delete`, `delete_all`, `set_base`, `ensure_base`.
- `with_demoted_bases()` flushes in a `finally` block, so both commit and rollback clear any state read inside the transaction.
- `CurrencySeeder` calls `flush_cache()` after its insert, because it skips the service.
- Writers outside the service (third-party code, direct `Currency` model writes) must call `flush_cache()`. The docblock says so.

### 6. Test strategy

Unit tests (no database, fake service):
- `new MoneyManager()` makes no call to the service.
- `to_minor()` and `from_minor()` with a named currency make no service call.
- `to_minor()` and `from_minor()` without a currency use the base currency of the service.
- `format_from_minor()` and `format_from_decimal()` return the same strings as before, for position, separators and rounding cases in the current test file.
- The existing `MoneyManagerTest` stays green. The fake in `TestCase` gets `get_by_code()` and `flush_cache()`.

Integration tests (real WP database):
- A helper counts SELECT queries on the currencies table with the `query` filter.
- Query budget: 50 `to_minor`, 50 `from_minor`, `format_from_minor` and 20 display conversions each run at most one currencies query. A request with no money runs none.
- Clearing: after `set_base`, `update` of a rate, `delete`, `bulk_delete`, `ensure_base`, `insert` and the seeder, the next read returns the new data.
- Rollback: a failed `with_demoted_bases()` leaves reads consistent with the database.
- Output: unknown and inactive display currency give the base currency. Conversion to an unknown code without a rate throws the same error.
- `RestTestCase` calls `flush_cache()`, forgets the `MoneyManager` singleton and clears its static symbol cache in `tearDown()` and after `reset_plugin_database()` in `setUpBeforeClass()`. The test database rolls back between tests, but these live for the whole process.
- Separate `CurrencyService` objects share the cache: a write through one is visible through another, and a currency created through the REST endpoint is visible to `Supports\Currency` in the same request.
- Audit the integration tests that write `Currency` rows directly (`AnalyticsMetricsTest`, `OnboardingApiTest`, `SeedsAnalyticsData`, `CurrencySyncScheduleTest`, `DashboardApiTest`, `UtcDateTimeStorageTest`) and add `flush_cache()` where a read follows the write.
- Run the full `composer test` (Unit and Integration) before and after the change. Both runs must pass with the same results.

## Risks / Trade-offs

- [A writer skips the service and the cache goes stale] → Every writer in this repo is covered (service, seeder, tests). The docblock on `flush_cache()` tells outside writers to call it. The cache lives for one request only, so the worst case is one stale request.
- [The static cache leaks across tests] → `RestTestCase` clears it in `tearDown()`. Unit tests replace the service with a fake and do not touch it.
- [A read inside a transaction caches data that is then rolled back] → `with_demoted_bases()` flushes in `finally`.
- [Lookup is case sensitive] → Keys are upper case, and `get_by_code()` upper-cases its input. The database lookup was case-insensitive.
- [`get_base_currency()` returns null when no base exists, and `->code` fails] → The same as before: the old constructor also read `->code` on the result. Behavior does not change.
- [Pre-existing bug, not fixed] `Supports\Currency` checks `$to->exchange_rate === 0`, but the model casts the rate to `float`, so the check never fires and a zero rate passes. Fixing it changes behavior, so it needs its own decision.

## Backward Compatibility

All of these surfaces exist on `origin/main`. All stay.

- `MoneyManager`: every public method keeps its name, arguments and return type. `to_minor()`, `from_minor()`, `get_currency_symbol()` and `get_currency_numeric_code()` stay `static`. `load_base_currency()` stays and still returns `$this`. `new MoneyManager()` still works.
- Removed: the protected `$base_currency` property and the constructor body. They are internal state, and nothing in the repo reads them. A third-party subclass that reads the property would break. This is a low risk, and I record it here for review.
- `Money` facade: no change to the `@method` list.
- `CurrencyService`: additions only (`get_by_code()`, `flush_cache()`). The container binding does not change.
- No change to the database schema, stored data, routes, hooks or response shapes. No migration.

## Correction during implementation

- **The singleton design was wrong.** The first plan was an instance cache and a container singleton for `CurrencyService`. The framework `Route` builds controllers and their dependencies with its own resolver, so `CurrencyController` got its own `CurrencyService`. Writes through the API cleared that object's cache, and money code read another object's stale cache. 7 order tests failed ("This currency is not available"). An earlier check for `new CurrencyService` missed it, because the router uses reflection. The cache is now `static`. A framework change (`Route::make()` resolving through the container) is a possible later improvement and is not needed for this change.
- A base change opens its own transaction, which commits the transaction that WordPress wraps around each test. So currency rows from an earlier test can survive. The new `CurrencyLookupCachingTest` empties the currencies table in `setUp()` and does not rely on the rollback.
- **The symbol cache was not a safe non-goal.** The Non-Goals list left `MoneyManager`'s static symbol cache alone. It is a second cache that `flush_cache()` does not clear, so `Money::get_currency_symbol()` returned an old symbol after an update. It is removed, and the symbol is read through `CurrencyService` each time. `load_base_currency()` was also removed, because the manager keeps no copy of the base currency and nothing outside the tests called it.
