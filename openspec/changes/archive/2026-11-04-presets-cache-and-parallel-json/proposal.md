## Why

After `parallel-sample-image-downloads`, **Load sample data** still spends 2.3–4.9 s
on JSON. Two reasons:

- The sample data request downloads `presets.json` (113 KB) again, although store
  setup downloaded it a short time before. Each request is a new PHP process, so
  the copy in `PresetRepository` is lost.
- `SampleDataImporter::import()` downloads `<industry>/products.json`, then
  `presets.json`, one after the other.

## What Changes

- `PresetRepository` keeps a successfully read `presets.json` in the framework
  cache for 1 hour, keyed by the preset base URL. Any request in that hour (store
  setup, sample data) reads the cached copy and does not download the file. A
  failed read is not cached.
- When the sample data import needs `<industry>/products.json` and `presets.json`
  is not loaded or cached, the two files are downloaded together in one
  `Http::pool()` call. The fallback to `other/products.json` (after a 403 or 404)
  is still a second request, only when needed.
- No change to the REST API, the data files or the UI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `remote-preset-source`: adds a requirement that a read `presets.json` is reused
  for 1 hour, and a requirement that the products file and `presets.json` are
  downloaded together for sample data.

## Impact

- **Code**: `app/Setup/Presets/PresetRepository.php`.
- **Tests**: `tests/Support/ServesPresetData.php` (clear the cache, because store
  setup commits the test transaction), `tests/Integration/PresetRepositoryTest.php`
  or `StorePresetsTest.php` (new cases).
- **Behavior**: a `presets.json` that is published again reaches a store up to
  1 hour later (only for a store that reads it in that hour, which is store setup
  and sample data).
- **Docs**: `docs/onboarding.md` (preset reading), `docs/preset-data.md` §7
  (the publish note).
