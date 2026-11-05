## ADDED Requirements

### Requirement: Package contains no preset or sample product data

The packaged plugin SHALL NOT contain the preset and sample product source data,
including the sample product images, because the plugin reads them from the remote
preset location. The plugin SHALL keep working without them: store setup and the
sample data import SHALL read only the remote location.

#### Scenario: Preset source folder is excluded

- **WHEN** the package is built
- **THEN** the resulting plugin directory does not contain `resources/data/preconfigured-data/` or `resources/data/preconfigured-data.json`

#### Scenario: Other runtime data stays

- **WHEN** the package is built
- **THEN** the resulting plugin directory still contains the other files in `resources/data/`, for example `countries.php` and `currencies.json`
