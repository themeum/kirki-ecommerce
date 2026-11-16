# Tasks

## 1. Test support and baseline

- [x] 1.1 Run `composer test:unit` and the integration suite (`composer test:docker:integration`, or `composer test:integration` when the WP test environment is set up) on the unchanged code. Save the pass and fail counts in a note in this file. Verify: both runs complete, so later runs have a baseline to compare with.
  - _Baseline (unchanged code, run in Docker with `bash kirki-ecommerce-test unit|integration`):_
    - _Unit: 888 tests, 10707 assertions, all pass._
    - _Integration: 1521 tests, 41928 assertions, 3 failures. All 3 fail on unchanged code and do not touch currencies: `EscapedOutputTest` "Icon render keeps the bundled svg" (SVG attribute order), `StorePresetsTest` "Failed images still create the products", `StorePresetsTest` "Bangladesh store gets inside and outside dhaka zones"._
    - _Setup notes: the local host `bin/phpunit` prints nothing, so use the Docker runner. The Docker runner needed `bash kirki-ecommerce-test install` once, and the `kirki_ecommerce_test` database created in this worktree's MariaDB container (it was missing)._
- [x] 1.2 Add a test helper in `tests/Support/` that counts SELECT queries on the currencies table through the `query` filter, with `start` and `count` methods. Verify: a small test that runs `Currency::base()->first()` twice sees a count of 2.
- [x] 1.3 In `RestTestCase`, clear the currency caches (`CurrencyService::flush_cache()`, the `MoneyManager` singleton and its static symbol cache) in `tearDown()` and in `setUpBeforeClass()` after `reset_plugin_database()`. Verify: `CurrencyApiTest` still passes.
- [x] 1.4 Group check: run `composer test:unit`, `composer phpcs:wporg`, and `npm run typecheck && npm test` from `resources/app/`. Verify: results equal the baseline from 1.1.
  - _Result: unit 888 pass; `vendor/bin/phpcs --standard=phpcs-wporg.xml.dist` clean (the `composer` wrapper printed nothing here, so phpcs and phpunit run directly or in Docker); `npm run typecheck` clean; `npm test` 218 files, 2229 tests pass (needed `npm ci` once)._

## 2. Cache in `CurrencyService`

- [x] 2.1 Add `protected static $currencies`, a protected `load()`, a public `flush_cache()` and a public `get_by_code(string $code)` (nullable, upper-case key). Make `get_base_currency()` and `get_symbol_map()` read from the cache. Add docblocks with `@since`. Verify: integration test shows 20 mixed reads (base, symbols, by code) run one currencies query.
- [x] 2.2 Call `flush_cache()` after the write in `insert`, `create`, `update`, `delete`, `bulk_delete`, `delete_all`, `set_base` and `ensure_base`. In `with_demoted_bases()`, flush in a `finally` block. Verify: integration tests for each write show the next read returns the new base currency, rate, active state or missing row.
- [x] 2.3 Add a rollback test: make `with_demoted_bases()` fail after a read inside the transaction. Verify: the next `get_base_currency()` equals the database row.
- [x] 2.4 ~~Bind `CurrencyService` as a singleton~~ Changed during implementation: the router builds its own `CurrencyService` objects, so a singleton does not share one cache (see `design.md`, Correction). The cache is `static` instead, and there is no binding. Verify: a write through one `CurrencyService` object is visible through another, a currency created through the REST endpoint is visible to `Supports\Currency`, and the 7 order tests pass (`CurrencyLookupCachingTest`, `OrderApiTest`, `OrderEditApiTest`).
- [x] 2.5 Add `get_by_code()` and `flush_cache()` to the fake service in `tests/Unit/TestCase.php`. Verify: `composer test:unit` equals the baseline.
- [x] 2.6 Group check: run `composer test:unit`, the integration suite, `composer phpcs:wporg`, and `npm run typecheck && npm test` from `resources/app/`. Verify: no new failures against the baseline.
  - _Result: unit 888 pass; integration 1539 tests (1521 baseline + 18 new), only the 3 baseline failures; phpcs:wporg and the docblock sniff clean; `npm run typecheck` clean; `npm test` 2229 pass._

## 3. `MoneyManager` and `Supports\Currency`

- [x] 3.1 Write unit tests first (they fail on the old code): `new MoneyManager()` makes no service call. `to_minor()` and `from_minor()` with a named currency make no service call. Without a currency they use the service's base currency. Verify: the tests fail before step 3.2 and pass after it.
  - _Ran on the old `MoneyManager.php` from `HEAD`: 9 of the 12 new unit tests fail (the behavior ones). The other 3 and the existing tests pass on both, as invariants. All 12 pass on the new code._
- [x] 3.2 In `MoneyManager`, remove the constructor and `$base_currency`. Make `get_base_currency()` read `app(CurrencyService::class)->get_base_currency()->code`. Make `load_base_currency()` call `flush_cache()` and return `$this`. Verify: the tests from 3.1 pass and `MoneyManagerTest` is unchanged and green.
- [x] 3.3 Replace `new static()` with `app(static::class)` in `to_minor()` and `from_minor()`. Make `format_from_minor()` and `format_from_decimal()` use `$this`. Verify: `grep -n "new static" app/Managers/MoneyManager.php` shows nothing, and unit tests for position, separators and rounding return the same strings as before.
- [x] 3.4 In `MoneyManager::resolve_requested_currency()` and `Supports\Currency::resolve_currency()`, use `get_by_code()`. Keep the thrown messages. Verify: integration tests for unknown cookie, inactive cookie and conversion to an unknown code without a rate give the base currency, the base currency and the "Currency not found" error.
- [x] 3.5 Add the integration query-budget tests: 50 `to_minor`, 50 `from_minor`, `format_from_minor`, 20 display conversions and a request with no money each stay within the budget in `specs/currency-lookup-caching/spec.md`. Verify: all pass on the new code. Write the test first and run it before tasks 3.2 and 3.3, to see it fail on the old code.
  - _Ran with the `app/` changes reverted to `HEAD`: all 6 budget tests fail on the old code (to_minor, from_minor, format, display conversions, request without money, base helper). All pass on the new code._
- [x] 3.6 Add output-equality tests: for sample amounts in USD, BDT and EUR, `prepare_amount_object_from_minor()` raw, display and currency match values recorded from the old code. Verify: tests pass.
  - _Ran on the old code as well: it passes there with the same values, as do the unknown, inactive and active cookie tests and the conversion error test. So output and errors are unchanged._
- [x] 3.7 Group check: run `composer test:unit`, the integration suite, `composer phpcs:wporg`, and `npm run typecheck && npm test` from `resources/app/`. Verify: no new failures against the baseline.
  - _Result (after switching to the static cache): unit 903 pass; integration 1550 tests, only the 3 baseline failures; phpcs:wporg and the docblock sniff clean; `npm run typecheck` clean; `npm test` 2229 pass._

## 4. Outside writers and test audit

- [x] 4.1 Call `flush_cache()` in `CurrencySeeder` after the insert. Add an integration test: read currencies, run the seeder, read again and see the seeded rows. Verify: the test passes.
  - _The new seeder test fails when the flush is removed (checked), and passes with it._
- [x] 4.2 Audit the integration tests that write `Currency` rows directly (`AnalyticsMetricsTest`, `OnboardingApiTest`, `SeedsAnalyticsData`, `CurrencySyncScheduleTest`, `DashboardApiTest`, `UtcDateTimeStorageTest`) and the ones that do not extend `RestTestCase`. Add `flush_cache()` where a read follows a direct write. Verify: the full integration suite equals the baseline.
  - _Audit result: the direct writes in `StorePresetsTest`, `OnboardingApiTest`, `DashboardApiTest`, `AnalyticsMetricsTest`, `SeedsAnalyticsData`, `UtcDateTimeStorageTest`, `CurrencyApiTest` and `WooCommerceSettingsGroupTest` all run at the start of a test, while the cache is cold, or are followed by a service write that clears it, so they need no change. Two sites in `OrderEditApiTest` write a rate after the cache can be warm, so they now call `flush_cache()`. One of them (the exchange-rate-at-order-time test) would otherwise read a stale rate and could pass even when the code is wrong._
- [x] 4.3 Add the docblock note on `flush_cache()` that writers outside the service must call it. Verify: `composer phpcs:wporg` passes.
  - _The docblock on `CurrencyService::flush_cache()` says that code writing to the currencies table without the service must call it._
- [x] 4.4 Group check: run `composer test:unit`, the integration suite, `composer phpcs:wporg`, and `npm run typecheck && npm test` from `resources/app/`. Verify: no new failures against the baseline.
  - _Result: unit 903 pass; integration 1551 tests, only the 3 baseline failures; phpcs:wporg and the docblock sniff clean; `npm run typecheck` clean; `npm test` 2229 pass._

## 5. Final checks

- [x] 5.1 Run the full `composer test` (Unit and Integration). Verify: every test that passed in 1.1 still passes, and the new tests pass.
  - _Final run: unit 903 tests pass (baseline 888 + 15 new). Integration 1552 tests (baseline 1521 + 31 new), and the only failures are the same 3 as the baseline: `EscapedOutputTest` icon render, `StorePresetsTest` failed images, `StorePresetsTest` Bangladesh zones. phpcs:wporg and the docblock sniff clean. `npm run typecheck` clean, `npm test` 2229 pass._
- [x] 5.2 Re-count the currencies queries for one cart API request with a display currency, before and after. Verify: the count goes from about 15 or more to 1, and the count is written in the change notes.
  - _One `GET cart` with a display currency and one item runs 9 currencies queries on the old code and 1 on the new code (measured with a throwaway test, now deleted). The estimate in the proposal of "about 15" was too high for a one-item cart. `CartApiTest` now keeps a permanent test for the new count._
- [x] 5.3 Write the "Backward compatibility" note from `design.md` in the final response, and list each released surface that changed.
  - _See the final response._

## Workflow follow-up

- Archive the change after review. Run `/opsx:archive`.
