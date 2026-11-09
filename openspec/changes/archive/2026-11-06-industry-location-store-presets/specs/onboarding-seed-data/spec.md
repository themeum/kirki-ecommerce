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
