## Why

To test a change to the preset data in `resources/data/preconfigured-data/`
(for example new shipping zones, or a changed products file), a developer must
publish it to S3 first, because the plugin reads the data only from the preset
URL. A development site needs a way to use the local files without a publish.

## What Changes

- New WP-CLI command `wp kirki presets:cache [--ttl=<seconds>] [--forget]`:
  - Default: reads the local `presets.json` and every `<set>/products.json`,
    checks their versions, and puts them into the plugin cache for the preset
    URL, for `--ttl` seconds (default 1 hour).
  - `--forget`: removes these cached entries, so the site reads S3 again.
  - It works only in a repository checkout. The plugin zip does not contain the
    source folder.
- Sample data loading (`PresetRepository::get_products()`) first reads a
  cached products file for the set. When one exists, it requests nothing.
  The plugin itself never writes this cache entry. Only the command does.
- Images are not included. They still download from the preset URL, once per
  site (an image that was imported before is reused).
- Docs: `docs/preset-data.md` and `docs/onboarding.md`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `remote-preset-source`: adds a requirement. A developer can load the local
  preset data and sample products files into the cache from the command line,
  and store setup and sample data loading then use them without a request.

## Impact

- Code: `app/Setup/Presets/PresetRepository.php` (products cache key and
  lookup), new `app/Console/Commands/CachePresetsCommand.php`,
  `bootstrap/commands.php`.
- Tests: `tests/Integration/RemotePresetRepositoryTest.php`.
- Docs: `docs/preset-data.md`, `docs/onboarding.md`.
- Production behavior does not change. A site without the command never has a
  cached products file. The only new cost is one cache read per sample data
  load.
