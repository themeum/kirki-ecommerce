## Context

See proposal.md (Why). `PresetRepository` is a container singleton. `load()` keeps
the decoded `presets.json` in `$this->data`, so one PHP request downloads it at
most one time. `fetch(string $path, int $version, &$status)` is the only network
read: trusted-URL check, `Http::timeout(10)->get()`, then status, JSON and
`version` checks. Any failure logs a warning and gives `null`.

`get_products($industry)` reads `<set>/products.json`. A 403 or 404 for an
industry set falls back to `other/products.json`. `SampleDataImporter::import()`
calls `get_products()`, then `get_common()` and `get_industry()`. Both call
`load()`.

The unit test `tests/Unit/Setup/SourcePresetRepository.php` extends the class and
replaces `fetch()` with local file reads (the unit suite has no WordPress HTTP API
and no cache).

The framework cache (`Cache` facade, default store `database`) is already used by
`PaymentGatewayCatalog`, with `Cache::flexible()` and `Cache::forget()`.

## Goals / Non-Goals

**Goals:**

- One download of `presets.json` for store setup followed by sample data, within
  1 hour.
- When the sample data import must download both files, they download together.

**Non-Goals:**

- Caching `products.json` (one download for each load, and the import needs fresh
  SKUs only on the first load).
- A smaller presets file, or splitting `presets.json` by industry.
- Clearing the cache when the data is published (the publish script runs outside
  WordPress).

## Decisions

### 1. Cache the decoded presets in `load()`, 1 hour, only on success

`load()` becomes:

1. `$this->data` set → return it.
2. `Cache::get(cache key)` is an array → keep it in `$this->data`, return it.
3. Otherwise `fetch('presets.json', PRESETS_VERSION)`. A non-null result →
   `Cache::put(key, data, HOUR_IN_SECONDS)`. Keep it in `$this->data` (`[]` on
   failure, as now).

Key: `CACHE_KEY . md5($this->base_url)` with `const CACHE_KEY = 'store_presets_'`.
Then a `wp-config.php` override never reads another location's data.

The cache read and write are in two protected methods, `cached_presets()` and
`cache_presets(array $data)`. `SourcePresetRepository` replaces them with no-ops,
so the unit suite stays free of the cache.

*Alternatives:*

- `Cache::remember()` would also cache the failure value. Rejected: the spec says
  that a failed read is not kept.
- `Cache::flexible()` (stale data, refreshed after the response) is what the
  payment catalog uses. Rejected here: presets are read at most a few times per
  store, so a background refresh gives nothing, and stale data for 7 days is not
  wanted.

**TTL 1 hour:** this covers the normal flow (store setup, then sample data within
minutes). A published `presets.json` reaches a store at most 1 hour later. Only
store setup and sample data read the file, so in practice this only affects a
store that runs both in the same hour as a publish.

### 2. Read the two files in one pool inside `get_products()`

`get_products()` is the only caller that knows that sample data is loading. When
`$this->data` is null and the cache has no presets, it reads both files in one
protected `fetch_many(array $paths)`:

```
fetch_many([
  '<set>/products.json' => PRODUCTS_VERSION,
  'presets.json'        => PRESETS_VERSION,
])  -> ['<set>/products.json' => [data|null, status], 'presets.json' => [data|null, status]]
```

The presets result is handled like the result of step 3 in decision 1 (cached on
success, `$this->data` set to it or `[]`). The products result goes through the
current 403/404 fallback, which still uses a single `fetch()`.

`fetch()` is split so that the single read and the pool read share the checks:

- `url_for(string $path)`: builds the URL and runs the trusted check (logs and
  gives `null` when it fails).
- `decode(Response $response, string $url, int $version, &$status)`: the status,
  JSON and `version` checks, with the same warnings as now.

`fetch()` calls them with `Http::timeout(10)->get()`. `fetch_many()` calls them
with `Http::pool()`, `$pool->as($path)->timeout(10)->get($url)`. An untrusted path
is left out of the pool and gives `[null, 0]`. In `SourcePresetRepository`,
`fetch_many()` loops over its own `fetch()`.

When the presets are already loaded or cached, `get_products()` reads only the
products file with `fetch()`, as now.

*Alternative:* a new `SampleDataImporter`-level method that pools both URLs.
Rejected: the URL, trust, version and fallback rules belong to the repository.

### 3. Tests clear the cache

Store setup commits the test transaction (see `StorePresetsTest::tearDown`), so a
cached `presets.json` would stay for the next test. Then a test that serves a
failing or changed `presets.json` would read the old copy. `serve_preset_data()`
in `ServesPresetData` therefore calls `Cache::forget()` for the key of the
configured base URL before it adds its filter. A public static
`PresetRepository::cache_key(string $base_url)` gives the key, so the test does
not build the key itself.

## Risks / Trade-offs

- [A publish reaches a store up to 1 hour later] → Accepted (decision 1). A
  developer who tests a publish on a site clears the cache, or waits.
- [113 KB serialized in the database cache store] → One row for each base URL,
  with an expiry. The framework garbage collection removes expired rows.
- [`get_products()` now also loads presets] → Only `SampleDataImporter` calls it,
  and the importer always needs the presets next. A failed presets read still
  makes `import()` throw `503`, as now.

## Migration Plan

No data migration. The first read after the update fills the cache. To roll
back, revert the change. Cached rows expire after 1 hour.

## Measured result

Measured on 2026-11-04 with a temporary probe on the test database, from the dev
`php` container to the real bucket (`us-east-1`), Xdebug off. The probe reads the
Home Decor products file and the presets, three runs:

| JSON step | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| One after the other (before this change) | 3.70 s | 2.81 s | 4.71 s |
| Together, no cached presets | 1.91 s | 5.08 s | 2.07 s |
| Cached presets (store setup in the last hour) | 0.84 s | 1.24 s | 1.15 s |

The normal flow (store setup, then sample data) uses the cached row, so its JSON
step goes from about 3–5 s to about 1 s. The "together" row has one slow run
(5.08 s), the same network variation as the image downloads in
`parallel-sample-image-downloads`. No correction is needed.
