## ADDED Requirements

### Requirement: Baseline seed runs during store setup

The baseline onboarding dataset SHALL be seeded as part of the merchant's store setup
in the onboarding wizard. That dataset is the category tree, attribute presets,
product schema profiles and settings defaults. It SHALL NOT be seeded on plugin
activation, on a version update, by the developer seeding command, or by the demo
seeder set. Settings defaults SHALL be seeded before the merchant's wizard answers are
applied, so the answers take precedence.

#### Scenario: Fresh install before onboarding

- **WHEN** the plugin is activated and no store setup has been submitted yet
- **THEN** no categories, attributes, schema profiles, or settings defaults have been seeded

#### Scenario: Store setup

- **WHEN** the merchant's store setup succeeds
- **THEN** the category tree, attribute presets, product schema profiles, and settings defaults are seeded

#### Scenario: Wizard answers win over defaults

- **WHEN** store setup seeds the general settings defaults on a store with no general settings
- **THEN** the store name, address, and tax switch from the wizard are what the general settings hold afterwards

#### Scenario: Developer seeding command is unaffected

- **WHEN** a developer runs the plugin's database seeding command
- **THEN** only the existing demo seeders run, and no onboarding seeder is executed

## MODIFIED Requirements

### Requirement: Demo products are available with imagery

The store SHALL receive demo products only when the merchant loads sample data. The
demo products SHALL cover a product without variants and products with one and two
variation axes. Each product and each variant SHALL carry imagery drawn from the
images bundled with the plugin. Every purchasable variant SHALL have a price in the
store's base currency.

#### Scenario: Store setup does not add products

- **WHEN** the merchant's store setup succeeds
- **THEN** no demo products are created

#### Scenario: Demo products are seeded

- **WHEN** sample data is loaded on a store with no products
- **THEN** demo products are created, each assigned to a seeded category, each with a priced default variant

#### Scenario: Variable products carry their variation axes

- **WHEN** a demo product varies by colour, or by colour and material together
- **THEN** a variant exists for each combination, linked to the seeded attribute values, each with its own image and price

#### Scenario: Images become media library items

- **WHEN** the demo products are seeded
- **THEN** each bundled product image is imported into the WordPress media library and referenced by the product or variant that uses it

#### Scenario: An image is imported twice

- **WHEN** an image that was already imported by a previous seeding run is imported again
- **THEN** the existing media library item is reused rather than duplicated

#### Scenario: Media import is not possible

- **WHEN** images cannot be written to the media library
- **THEN** the demo products are still created, without imagery, and the seed does not fail

#### Scenario: Products already exist

- **WHEN** sample data is loaded on a store that already has at least one product
- **THEN** no demo products are created

### Requirement: Bundled product images are reclaimed after a successful install

Once sample data loading has imported every bundled product image successfully, the
plugin SHALL remove the bundled product image directory from an installed production
plugin. It SHALL leave the directory in place otherwise, including when sample data
has never been loaded.

#### Scenario: Successful production seed

- **WHEN** sample data loading imports every bundled product image on a production install
- **THEN** the bundled product image directory is removed from the plugin

#### Scenario: Development install

- **WHEN** sample data loading completes on a development install
- **THEN** the bundled product image directory is left in place

#### Scenario: An image failed to import

- **WHEN** at least one bundled product image could not be imported
- **THEN** the bundled product image directory is left in place so a later run can still read it

#### Scenario: Sample data never loaded

- **WHEN** the merchant completes onboarding without loading sample data
- **THEN** the bundled product image directory is left in place

## REMOVED Requirements

### Requirement: Onboarding seed runs once on version update

**Reason**: The seed now runs during the merchant's store setup, so the merchant's
answers drive the store's configuration. Alpha versions are obsolete and
`1.0.0-beta.1` is treated as the first version, so there is no version-update seed.

**Migration**: Covered by "Baseline seed runs during store setup" in this capability,
and by the `store-setup` and `store-onboarding-gate` capabilities. No data migration:
alpha installs are unsupported.

### Requirement: A base currency is available

**Reason**: The base currency is now the one the merchant selects in the onboarding
wizard, not a forced US Dollar.

**Migration**: See "Selected currency becomes the base currency" in the `store-setup`
capability.
