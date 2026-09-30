## Purpose

Provisions a newly installed store with a usable baseline — currency, category
tree, attribute presets, product schema profiles, demo products with real imagery,
and sensible default settings — so that a merchant activating the plugin for the
first time lands on a working store rather than an empty one, without ever
overwriting configuration that already exists.

## ADDED Requirements

### Requirement: Onboarding seed runs once on version update

The onboarding dataset SHALL be seeded from the `1.0.0-alpha.1` version-update
callback, and SHALL NOT be reachable from the developer seeding command or the
demo seeder set.

#### Scenario: Fresh install

- **WHEN** the plugin is activated on a site that has never installed version `1.0.0-alpha.1`
- **THEN** the onboarding dataset is seeded during the first admin request

#### Scenario: Already-installed version

- **WHEN** an admin request occurs on a site that has already recorded `1.0.0-alpha.1` as installed
- **THEN** no onboarding seeding is attempted

#### Scenario: Developer seeding command is unaffected

- **WHEN** a developer runs the plugin's database seeding command
- **THEN** only the existing demo seeders run, and no onboarding seeder is executed

### Requirement: Seeding is idempotent and never destroys existing data

Each seeded concern SHALL verify its own target before writing and SHALL make no
changes when that target is already populated. A seeding run that fails partway
SHALL be safely resumable, with already-completed concerns skipped rather than
repeated.

#### Scenario: Re-run after a completed seed

- **WHEN** the onboarding seed is triggered again on a store that has already been seeded
- **THEN** no duplicate rows are created and no error is raised

#### Scenario: Resume after partial failure

- **WHEN** a seeding run fails after some concerns have been written but before others
- **AND** the seed is triggered again
- **THEN** the concerns that already completed are skipped and only the outstanding ones are written

#### Scenario: Merchant has pre-existing data

- **WHEN** the seed runs on a store that already has categories, products, or a configured setting
- **THEN** that existing data is left untouched

### Requirement: A base currency is available

The store SHALL have a US Dollar currency marked as the base currency, and the
currency settings SHALL name USD as the base currency code.

#### Scenario: No currency exists

- **WHEN** the seed runs on a store with no currency rows
- **THEN** a US Dollar currency is created as the base currency with an exchange rate of 1 and marked active

#### Scenario: A USD currency already exists

- **WHEN** the seed runs on a store that already has a USD currency row
- **THEN** no additional currency row is created

### Requirement: A category tree is available

The store SHALL be seeded with a three-level category tree covering common
e-commerce industries. Every category SHALL have a unique slug, and a category's
level SHALL be one greater than its parent's.

#### Scenario: Categories are seeded

- **WHEN** the seed runs on a store with no categories
- **THEN** a three-level tree is created with each child linked to its parent and each level numbered 1, 2, or 3

#### Scenario: Two categories share a display name

- **WHEN** the tree contains the same category name under two different parents
- **THEN** both are created with their display names intact and with distinct slugs, each disambiguated by its parent's name

#### Scenario: Categories already exist

- **WHEN** the seed runs on a store that already has at least one category
- **THEN** no categories are created

### Requirement: Colour and material attribute presets are available

The store SHALL be seeded with a colour attribute whose values each carry a hex
code, and a material attribute needed by the demo catalog.

#### Scenario: Colour attribute is seeded

- **WHEN** the seed runs on a store with no colour attribute
- **THEN** a colour-type attribute is created with a named preset value and hex code for each colour in the preset library

#### Scenario: Material attribute is seeded

- **WHEN** the seed runs on a store with no material attribute
- **THEN** a list-type material attribute is created with the values required by the demo products

#### Scenario: One attribute already exists

- **WHEN** the seed runs on a store that already has the colour attribute but not the material attribute
- **THEN** the colour attribute is left untouched and only the material attribute is created

### Requirement: Product schema profiles are available and editable

The store SHALL be seeded with product schema profiles, exactly one of which is
the default. Every seeded profile SHALL contain only fields the product form's
schema picker can render, so that opening and saving a profile does not silently
discard data.

#### Scenario: Schema profiles are seeded

- **WHEN** the seed runs on a store with no product schema rows
- **THEN** profiles are created, exactly one is marked as default, and each includes the required product name and offer price fields

#### Scenario: A merchant edits a seeded profile

- **WHEN** a merchant opens a seeded schema profile in the product form and saves it without changes
- **THEN** the stored profile is unchanged

#### Scenario: Schema profiles already exist

- **WHEN** the seed runs on a store that already has a product schema row
- **THEN** no profiles are created

### Requirement: Store settings have onboarding defaults

The seed SHALL establish default values for the general, product, payment, and
checkout settings, writing a settings group only when that group has not already
been configured.

#### Scenario: Selling location

- **WHEN** general settings have not been configured
- **THEN** the selling location is set to all countries

#### Scenario: Reviews are off by default

- **WHEN** product settings have not been configured
- **THEN** product reviews and star ratings on reviews are both disabled

#### Scenario: Guest checkout is off by default

- **WHEN** checkout settings have not been configured
- **THEN** guest checkout is disabled

#### Scenario: Cash on Delivery is offered

- **WHEN** payment settings have not been configured
- **THEN** an enabled offline payment method named "Cash on Delivery" is available with descriptive instructions and no icon

#### Scenario: A settings group is already configured

- **WHEN** a merchant has already saved one of these settings groups
- **THEN** that group is left exactly as the merchant configured it

### Requirement: Demo products are available with imagery

The store SHALL be seeded with demo products covering both a product without
variants and products with one and two variation axes. Each product and each
variant SHALL carry imagery drawn from the images bundled with the plugin, and
every purchasable variant SHALL have a price.

#### Scenario: Demo products are seeded

- **WHEN** the seed runs on a store with no products
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

- **WHEN** the seed runs on a store that already has at least one product
- **THEN** no demo products are created

### Requirement: Bundled product images are reclaimed after a successful install

Once every bundled product image has been imported successfully, the plugin SHALL
remove the bundled product image directory from an installed production plugin, and
SHALL leave it in place otherwise.

#### Scenario: Successful production seed

- **WHEN** every bundled product image has been imported on a production install
- **THEN** the bundled product image directory is removed from the plugin

#### Scenario: Development install

- **WHEN** the seed completes on a development install
- **THEN** the bundled product image directory is left in place

#### Scenario: An image failed to import

- **WHEN** at least one bundled product image could not be imported
- **THEN** the bundled product image directory is left in place so a later run can still read it
