# Proposal

## Why

Money code reads the currency table again and again in one request. `Money::to_minor()`, `Money::from_minor()` and `Money::format_from_*()` each build a new `MoneyManager`, and its constructor queries the base currency. Every converted amount queries the exchange rate again. A cart response with a display currency makes about 15 queries for the same row, and tax calculation makes one query per line. The singleton `MoneyManager` also keeps a base currency code that can go stale in the same request, while the `new static()` instances see fresh data.

## What Changes

- `CurrencyService` keeps one in-memory copy of all currency rows per request. It loads them on first use, and serves the base currency, the symbol map and lookup by code from that copy. The copy is `static`, so every `CurrencyService` object shares it, including the ones the router builds for controllers.
- Every `CurrencyService` write (`insert`, `create`, `update`, `delete`, `bulk_delete`, `delete_all`, `set_base`, `ensure_base`) clears the copy. `CurrencySeeder`, which writes without the service, clears it too.
- `MoneyManager` holds no currency state. The constructor query and the `$base_currency` property are removed. `get_base_currency()` reads from `CurrencyService`. `load_base_currency()` stays and clears the cache.
- `MoneyManager::to_minor()`, `from_minor()`, `format_from_minor()` and `format_from_decimal()` stop calling `new static()`. The static methods use the shared instance from the container. The instance methods use `$this`.
- `MoneyManager::resolve_requested_currency()` and `Supports\Currency::resolve_currency()` read the currency through the cached lookup.
- New tests prove the query budget and the cache clearing, and show that existing money output does not change.
- No public method, hook, route, response shape, option or table changes. No migration.

## Capabilities

### New Capabilities
- `currency-lookup-caching`: Money and currency helpers read currency data at most once per request, and the cached data is never stale after a currency write.

### Modified Capabilities

None. The behavior in `multi-currency-settings` (base change, rate rebasing) does not change.

## Impact

- Code: `app/Services/CurrencyService.php`, `app/Managers/MoneyManager.php`, `app/Supports/Currency.php`, `database/seeders/CurrencySeeder.php`.
- Tests: `tests/Unit/TestCase.php` (fake service), `tests/Unit/Managers/MoneyManagerTest.php`, a new `CurrencyService` unit test, `tests/Support/RestTestCase.php` (clear the cache between tests), a new integration test for query count and cache clearing.
- Backward compatibility: all released `MoneyManager` signatures stay. `new MoneyManager()` still works. `ProductService` still calls `MoneyManager::to_minor()` statically. See `design.md`.
- Flagged, not fixed: `Supports\Currency` compares `$to->exchange_rate === 0`, but the model casts the rate to `float`, so this check is never true. A zero rate is not caught.
