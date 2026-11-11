## ADDED Requirements

### Requirement: Local preset data can be cached from the command line

The plugin SHALL provide the WP-CLI command `wp kirki presets:cache`. In a
repository checkout, the command SHALL read the local `presets.json` and each
local `<set>/products.json` from `resources/data/preconfigured-data/`, and SHALL
keep each file that has a supported version for the current preset base URL,
for the number of seconds in `--ttl` (default 3600). A products file with an
unsupported version SHALL be skipped with a warning; the other files SHALL still
be kept. With `--forget`, the command SHALL remove the kept presets file and the
kept products files for the current base URL.

When a kept products file exists for the set that a sample data load needs, the
plugin SHALL use it and SHALL NOT request that products file. The plugin SHALL
NOT keep a products file that it downloads itself. Images SHALL still be
requested from the base URL.

#### Scenario: Cache the local data

- **WHEN** a developer runs `wp kirki presets:cache` in a repository checkout
- **THEN** the local `presets.json` and every local products file with a supported version are kept for 3600 seconds, and the command reports how many products files it kept

#### Scenario: Store setup uses the local presets

- **WHEN** the local data was cached and the merchant completes store setup
- **THEN** the presets come from the local `presets.json`, and `presets.json` is not requested

#### Scenario: Sample data uses the local products file

- **WHEN** the local data was cached and the merchant loads sample data
- **THEN** the products come from the local products file of the industry, no products file and no `presets.json` is requested, and the images are requested from the base URL

#### Scenario: Custom time

- **WHEN** a developer runs `wp kirki presets:cache --ttl=86400`
- **THEN** the data is kept for 86400 seconds

#### Scenario: Invalid time

- **WHEN** a developer runs `wp kirki presets:cache --ttl=0`
- **THEN** the command fails with an error and keeps nothing

#### Scenario: Unsupported presets version

- **WHEN** the local `presets.json` has a version that the plugin does not support
- **THEN** the command fails with an error and keeps nothing

#### Scenario: Forget the cached data

- **WHEN** a developer runs `wp kirki presets:cache --forget`
- **THEN** the kept presets file and products files are removed, and the next store setup or sample data load requests them from the base URL

#### Scenario: No source folder

- **WHEN** the command runs on a site whose plugin has no `resources/data/preconfigured-data/` folder
- **THEN** the command fails with an error and keeps nothing

#### Scenario: Downloaded products are not kept

- **WHEN** no kept products file exists and the merchant loads sample data
- **THEN** the products file is requested, and it is requested again on the next sample data load
