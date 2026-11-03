## 1. Cache presets.json

- [x] 1.1 Add `const CACHE_KEY = 'store_presets_'`, a public static `cache_key(string $base_url)` (`CACHE_KEY . md5($base_url)`), and the protected `cached_presets()` (`Cache::get()`, an array or `null`) and `cache_presets(array $data)` (`Cache::put(..., HOUR_IN_SECONDS)`) to `PresetRepository`
- [x] 1.2 Change `load()` as in design §1: `$this->data`, then the cache, then `fetch()`; cache only a non-null result
- [x] 1.3 In `tests/Unit/Setup/SourcePresetRepository.php`, replace `cached_presets()` (gives `null`) and `cache_presets()` (does nothing)
- [x] 1.4 In `tests/Support/ServesPresetData.php`, call `Cache::forget(PresetRepository::cache_key(...))` for the configured base URL in `serve_preset_data()`
- [x] 1.5 Add tests: a second repository (new instance) reads the cached presets with no request; a failed read is not cached (the next instance requests again); another base URL does not read the cached data; store setup, then sample data requests `presets.json` one time in total
- [x] 1.6 Verify: `bash kirki-ecommerce-test unit` and `bash kirki-ecommerce-test integration`; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 2. Read products.json and presets.json together

- [x] 2.1 Split `fetch()` into `url_for()` and `decode()` (design §2), with the same warnings; `fetch()` keeps its signature and behavior
- [x] 2.2 Add the protected `fetch_many(array $paths)` with `Http::pool()` (`$pool->as($path)->timeout(10)->get($url)`); an untrusted path gives `[null, 0]` with no request
- [x] 2.3 In `get_products()`, when the presets are not loaded and not cached, read `<set>/products.json` and `presets.json` with `fetch_many()`; handle the presets result as in `load()` (cache on success); keep the 403/404 fallback to `other/products.json` with `fetch()`
- [x] 2.4 In `SourcePresetRepository`, replace `fetch_many()` with a loop over its `fetch()`
- [x] 2.5 Add tests: with no cached presets, the products file and `presets.json` are both requested, each one time, and the sample data loads; with cached presets, only the products file is requested; a 404 products file falls back to `other` after the first two requests; a failed `presets.json` with a good products file makes the sample data request fail with `503` and create nothing
- [x] 2.6 Verify: `bash kirki-ecommerce-test unit` and `bash kirki-ecommerce-test integration`; phpcs on the changed files; run `npm run typecheck && npm test` in `resources/app/`

## 3. Docs and timing

- [x] 3.1 Update `docs/onboarding.md` (preset reading and §5 sample data): `presets.json` is kept for 1 hour, and the two files download together; update `docs/preset-data.md` §7: a publish reaches a store that read the file in the last hour only after the hour ends
- [x] 3.2 Measure the JSON step of a sample data load with a temporary probe on the test database, with and without cached presets, and record the times in design.md; delete the probe
- [x] 3.3 Verify: `openspec validate presets-cache-and-parallel-json --strict`; run `npm run typecheck && npm test` in `resources/app/`
