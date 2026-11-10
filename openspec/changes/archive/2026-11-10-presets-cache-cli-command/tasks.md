## 1. Products cache in the repository

- [x] 1.1 In `app/Setup/Presets/PresetRepository.php`, add `const PRODUCTS_CACHE_KEY = 'store_sample_products_';` and `public static function products_cache_key(string $base_url, string $set)` returning `static::PRODUCTS_CACHE_KEY . md5(rtrim($base_url, '/') . '|' . $set)`, with a docblock
- [x] 1.2 Add `protected function cached_products(string $set)`: returns the cached data for `products_cache_key($this->base_url, $set)` when it is an array whose `products` is an array, otherwise null
- [x] 1.3 In `get_products()`, after `$set` and `$path` are resolved, return `array_merge($cached, ['set' => $set])` when `cached_products($set)` is not null; leave the rest unchanged; update the docblock description
- [x] 1.4 In `tests/Integration/RemotePresetRepositoryTest.php`, add: a cached products key for `fashion-and-apparel` gives those products with `set` and `$this->preset_requests === []`; with no cached key, a sample data read still requests the products file and does not cache it
- [x] 1.5 Verify: `bash kirki-ecommerce-test integration --filter='RemotePresetRepositoryTest|StorePresetsTest'` passes, and `npm run typecheck && npm test` (from `resources/app/`) passes — note: `test_domestic_rules_apply_to_both_bangladesh_zones` failed because the BD methods were changed outside this change to the keys `inside_dhaka`/`outside_dhaka`, which the Frozen `standard` rule no longer matches; per the user, the test now checks the `*` Fragile rule on each zone's single method

## 2. CLI command

- [x] 2.1 Create `app/Console/Commands/CachePresetsCommand.php` (extends `CommandBase`, like `ClearOptionsCommand`): `prepare()` with summary, description and synopsis `--ttl=<seconds>` (optional assoc, default 3600) and `--forget` (optional flag)
- [x] 2.2 `run()`: stop with `cli_error` when `resource_path('data/preconfigured-data')` does not exist; with `--forget`, `Cache::forget()` the presets key and the products key of each local set (`File::glob(<dir>/*/products.json)`), then `cli_success`
- [x] 2.3 Default path: check `--ttl` is a positive integer (`cli_error` otherwise); read `presets.json` with `File::json()` and stop with `cli_error` when it is not an array or its `version` is not `PRESETS_VERSION`; `Cache::put()` it under `cache_key(KIRKI_ECOMMERCE_PRESETS_URL)`
- [x] 2.4 For each local products file: check `version === PRODUCTS_VERSION` and `products` is an array (`cli_warning` and skip otherwise); `Cache::put()` it under `products_cache_key(KIRKI_ECOMMERCE_PRESETS_URL, <folder name>)`; end with `cli_success` that names the count, the TTL, and that images still come from the base URL
- [x] 2.5 Register `'presets:cache' => CachePresetsCommand::class` in `bootstrap/commands.php`
- [x] 2.6 Verify: `vendor/bin/phpcs --standard=phpcs-wporg.xml.dist` and the docblock sniff pass on the changed PHP files; in Docker, `kirki presets:cache --ttl=600` succeeds with 16 products files, `--ttl=0` fails, `--forget` empties both keys (check with `wpcli eval`); `npm run typecheck && npm test` (from `resources/app/`) passes — note: also `--ttl=abc` fails (exit 1); the bad-`presets.json`-version error was not run by hand, because it needs an edit to the real data file. All files are checked before anything is cached, so a bad presets file keeps nothing

## 3. Docs

- [x] 3.1 `docs/preset-data.md`: §1 Quick start gets `wp kirki presets:cache` (Docker: `docker compose --profile tools run --rm wpcli kirki presets:cache --ttl=86400`) with one line on testing local data without a publish; §7 replaces the `wp eval ... Cache::forget(...)` example with `wp kirki presets:cache --forget`; §9 says that images are not cached and still come from the preset URL
- [x] 3.2 `docs/onboarding.md` §4.1: one sentence on the sample products cache key, written only by the command
- [x] 3.3 Verify: the docs match the command's options and messages, and `npm run typecheck && npm test` (from `resources/app/`) passes
