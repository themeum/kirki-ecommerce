## ADDED Requirements

### Requirement: A read presets file is reused for one hour

When the plugin reads `presets.json` successfully, it SHALL keep the data for 1
hour, separately for each preset base URL. In that hour, a store setup or a sample
data load SHALL use the kept data and SHALL NOT request `presets.json`. A failed
read (no response, a status that is not 2xx, invalid JSON, or an unsupported
version) SHALL NOT be kept, so the next read requests the file again.

#### Scenario: Sample data after store setup

- **WHEN** store setup read `presets.json`, and the merchant loads sample data 10 minutes later
- **THEN** the sample data load does not request `presets.json`

#### Scenario: Kept data expires

- **WHEN** the kept data is older than 1 hour, and the merchant loads sample data
- **THEN** `presets.json` is requested again

#### Scenario: Failed read is not kept

- **WHEN** store setup could not read `presets.json`, and the merchant runs store setup again
- **THEN** `presets.json` is requested again

#### Scenario: Other base URL

- **WHEN** `presets.json` was kept for one base URL, and `KIRKI_ECOMMERCE_PRESETS_URL` now names another base URL
- **THEN** `presets.json` is requested from the new base URL

### Requirement: Sample data files are downloaded together

When the merchant loads sample data and no kept `presets.json` exists, the plugin
SHALL request `<industry>/products.json` and `presets.json` at the same time, not
one after the other. When the products file answers 403 or 404, the plugin SHALL
then request `other/products.json`, as before. A failure of one file SHALL NOT
change how the other file is read.

#### Scenario: Both files needed

- **WHEN** the merchant loads sample data and no kept `presets.json` exists
- **THEN** the products file and `presets.json` are requested together, and each is requested one time

#### Scenario: Presets file is kept

- **WHEN** the merchant loads sample data and a kept `presets.json` exists
- **THEN** only the products file is requested

#### Scenario: Industry has no products file

- **WHEN** the industry's products file answers 404
- **THEN** `other/products.json` is requested after the first two requests, and the `other` products are loaded

#### Scenario: Presets file fails

- **WHEN** the products file is read and `presets.json` fails
- **THEN** the sample data request fails with an error, and creates nothing, as before
