## MODIFIED Requirements

### Requirement: Baseline seed runs during store setup

The baseline onboarding dataset SHALL be seeded as part of the merchant's store setup
in the onboarding wizard. That dataset is the settings defaults only. Categories,
attributes and product schema profiles are not part of the baseline; the store
presets supply them. The baseline SHALL NOT be seeded on plugin activation, on a
version update, by the developer seeding command, or by the demo seeder set.
Settings defaults SHALL be seeded before the merchant's wizard answers are applied,
so the answers take precedence.

#### Scenario: Fresh install before onboarding

- **WHEN** the plugin is activated and no store setup has been submitted yet
- **THEN** no categories, attributes, schema profiles, or settings defaults have been seeded

#### Scenario: Store setup

- **WHEN** the merchant's store setup succeeds
- **THEN** the settings defaults are seeded by the baseline, and no categories, attributes or schema profiles are created by it

#### Scenario: Wizard answers win over defaults

- **WHEN** store setup seeds the general settings defaults on a store with no general settings
- **THEN** the store name, address, and tax switch from the wizard are what the general settings hold afterwards

#### Scenario: Developer seeding command is unaffected

- **WHEN** a developer runs the plugin's database seeding command
- **THEN** only the existing demo seeders run, and no onboarding seeder is executed

### Requirement: Demo products are available with imagery

The store SHALL receive demo products only when the merchant loads sample data. The
demo products SHALL cover a product without variants and products with one and two
variation axes. Each product and each variant SHALL carry imagery drawn from the
images bundled with the plugin. Every purchasable variant SHALL have a price in the
store's base currency. Loading sample data SHALL create any attribute or attribute
value the demo products need that the store does not have, and SHALL reuse the ones
that exist. Loading sample data SHALL NOT create categories, and the demo products
SHALL have no category.

#### Scenario: Store setup does not add products

- **WHEN** the merchant's store setup succeeds
- **THEN** no demo products are created

#### Scenario: Demo products are seeded

- **WHEN** sample data is loaded on a store with no products
- **THEN** demo products are created, each with a priced default variant and no category

#### Scenario: Sample data creates no categories

- **WHEN** sample data is loaded on a store that has no categories
- **THEN** no category is created, and existing categories are unchanged

#### Scenario: Variable products carry their variation axes

- **WHEN** a demo product varies by colour, or by colour and material together
- **THEN** a variant exists for each combination, linked to the attribute values, each with its own image and price

#### Scenario: Demo attribute is missing

- **WHEN** sample data is loaded on a store that has a Color attribute but no Material attribute
- **THEN** a Material attribute is created with the values the demo products need, and the existing Color attribute is reused

#### Scenario: Demo attribute value is missing

- **WHEN** sample data is loaded on a store whose Color attribute has no "Orange" value
- **THEN** an "Orange" value is added to that Color attribute and the other values are unchanged

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

## REMOVED Requirements

### Requirement: A category tree is available

**Reason**: Categories are now industry dependent. The store presets create the
industry's category tree, and the "other" industry gets none.
**Migration**: See the store-presets capability, "Categories are preset by
industry". Sample data loading does not create categories (see "Demo products
are available with imagery"). Stores already set up keep their categories.

### Requirement: Colour and material attribute presets are available

**Reason**: Attributes are now industry dependent. The store presets create the
Color attribute for every store and the industry attributes (Material only where
it fits the industry).
**Migration**: See the store-presets capability, "Attributes are preset by
industry". Sample data loading creates the demo attributes it needs (see "Demo
products are available with imagery").

### Requirement: Product schema profiles are available and editable

**Reason**: The store presets now supply one default schema profile with every
supported field, so the baseline no longer seeds the four starter profiles.
**Migration**: See the store-presets capability, "A default product schema
profile is preset". Stores already set up keep their existing profiles.
