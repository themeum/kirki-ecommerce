## MODIFIED Requirements

### Requirement: Baseline seed runs during store setup

The baseline onboarding dataset SHALL be seeded as part of the merchant's store setup
in the onboarding wizard. That dataset is the settings defaults only. Categories and
attributes are not part of the baseline; the store presets supply them. The baseline
SHALL NOT be seeded on plugin activation, on a version update, by the developer
seeding command, or by the demo seeder set. Settings defaults SHALL be seeded before
the merchant's wizard answers are applied, so the answers take precedence.

#### Scenario: Fresh install before onboarding

- **WHEN** the plugin is activated and no store setup has been submitted yet
- **THEN** no categories, attributes, or settings defaults have been seeded

#### Scenario: Store setup

- **WHEN** the merchant's store setup succeeds
- **THEN** the settings defaults are seeded by the baseline, and no categories or attributes are created by it

#### Scenario: Wizard answers win over defaults

- **WHEN** store setup seeds the general settings defaults on a store with no general settings
- **THEN** the store name, address, and tax switch from the wizard are what the general settings hold afterwards

#### Scenario: Developer seeding command is unaffected

- **WHEN** a developer runs the plugin's database seeding command
- **THEN** only the existing demo seeders run, and no onboarding seeder is executed
