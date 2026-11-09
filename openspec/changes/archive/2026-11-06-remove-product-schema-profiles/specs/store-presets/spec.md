## MODIFIED Requirements

### Requirement: The "other" industry skips industry presets

When the merchant chose the industry "other", or an industry with no entry in
the industry data, the system SHALL apply no industry presets. The common
presets and the country presets SHALL still apply.

#### Scenario: Industry is "other"

- **WHEN** presets are applied with industry "other" and country "DE"
- **THEN** no categories, industry attributes, industry shipping profiles or industry tax profiles are created
- **AND** the Color attribute, the default shipping and tax profiles, the legal pages and consents, and the "DE" shipping and tax presets are created

### Requirement: Presets never overwrite merchant data

Each preset kind SHALL check its own target before it writes, and SHALL write
nothing when that target already holds data: categories, shipping zones, the
tax region list, profiles with the same name, attributes with
the same slug, pages with the same slug, and consents. A
preset kind that fails while it writes SHALL be logged and SHALL NOT stop the
other kinds.

#### Scenario: Existing shipping zone

- **WHEN** presets are applied on a store that already has a shipping zone
- **THEN** no preset zone is created and the existing zone is unchanged

#### Scenario: One kind fails

- **WHEN** writing the shipping zones throws an error during store setup
- **THEN** the error is logged, the remaining preset kinds are written, and store setup succeeds

## ADDED Requirements

### Requirement: Schema profile presets are ignored

The presets SHALL NOT create product schema profiles. When the presets data
still holds a `schema_profiles` entry, the system SHALL ignore it, write
nothing for it, and SHALL still apply every other preset kind.

#### Scenario: Presets data with schema profiles

- **WHEN** presets are applied and the presets data holds a `schema_profiles` list
- **THEN** no error occurs, nothing is written for that list, and the other preset kinds are written

## REMOVED Requirements

### Requirement: A default product schema profile is preset
**Reason**: Schema profiles are removed. The product JSON-LD always prints a fixed field set from the product data.
**Migration**: None. Stores that already have a preset profile lose it when the upgrade migration drops the profile table.
