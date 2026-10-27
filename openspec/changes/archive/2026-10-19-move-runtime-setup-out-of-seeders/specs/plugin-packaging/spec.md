## ADDED Requirements

### Requirement: Package contains no developer seeders

The packaged plugin SHALL NOT contain the developer seeders, which are the
demo and test data seeders that developers run from the command line. They
SHALL NOT ship as files and SHALL NOT be registered in the packaged autoload
maps. Code that the plugin runs in production, such as store setup and the
sample data import, SHALL NOT live with the developer seeders, so excluding
them removes no runtime behavior. The developer seeding command SHALL keep
working in a development install.

#### Scenario: No seeder files ship

- **WHEN** the package is built
- **THEN** the resulting plugin directory contains `database/migrations/`
  and does not contain a `database/seeders/` directory

#### Scenario: Developer seeders are absent from the autoload maps

- **WHEN** the produced zip is extracted and its generated autoload maps
  are inspected
- **THEN** no entry maps the developer seeders namespace or any developer
  seeder class

#### Scenario: Store setup works from the package

- **WHEN** a merchant completes the onboarding wizard on a site that runs
  the packaged plugin
- **THEN** store setup succeeds and seeds the category tree, attribute
  presets, product schema profiles and settings defaults

#### Scenario: Sample data import works from the package

- **WHEN** a merchant loads sample data on a site that runs the packaged
  plugin
- **THEN** the sample products and their images are imported

#### Scenario: Seeding command on a packaged install

- **WHEN** an administrator runs the plugin's database seeding command on a
  site that runs the packaged plugin
- **THEN** no seeder runs, no data is written, and no fatal error occurs

#### Scenario: Seeding command in development

- **WHEN** a developer runs the plugin's database seeding command in a
  development install
- **THEN** the developer seeders run as before
