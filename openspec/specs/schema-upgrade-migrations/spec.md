# schema-upgrade-migrations Specification

## Purpose

Defines how the plugin evolves an existing installation's database schema across releases via versioned alter migrations, so that upgrading the plugin never leaves a site's schema out of sync with the code running against it.

## Requirements

### Requirement: Existing installations converge to the current schema on upgrade
When a site upgrades to a plugin version whose table definitions differ from what that site's database currently has, the system SHALL run alter migrations that bring every affected table's columns, keys, and foreign keys in line with the current definitions, without requiring manual database intervention by the site owner.

#### Scenario: Site upgrades across a schema-changing release
- **WHEN** a site running an older plugin version, whose database still reflects the prior schema for `kirki_ecommerce_carts`, `kirki_ecommerce_coupon_customers`, `kirki_ecommerce_coupons`, `kirki_ecommerce_shipping_profiles`, and `kirki_ecommerce_tax_profiles`, is upgraded to this release
- **THEN** each of those tables' columns, keys, and foreign keys match the current definitions after the upgrade completes
- **AND** no manual SQL or database intervention is required by the site owner

#### Scenario: Fresh install reaches the current schema via the same migration sequence
- **WHEN** the plugin is installed fresh with no prior version ever having run
- **THEN** the migrations that create these tables in their original shape and the migrations that alter them to the current shape both run, in that order, as part of the same initial migration run
- **AND** the resulting schema matches the current definitions exactly, identical to what an upgraded existing installation ends up with

### Requirement: Schema migrations run at most once per installation
An alter migration SHALL be recorded as applied once it runs successfully, and SHALL NOT run again on that installation on subsequent upgrades or plugin reactivations.

#### Scenario: Repeated upgrade checks do not reapply a migration
- **WHEN** a site has already applied an alter migration for a given schema change
- **THEN** subsequent plugin upgrades or reactivations do not run that migration again
- **AND** the table's data introduced or modified since is left untouched by it

### Requirement: Cart identity migration accepts loss of existing cart-owner association
Because carts are ephemeral and time-limited, the migration that changes how a cart's owner is identified SHALL be permitted to discard the existing owner association for carts that predate the change, rather than remapping it.

#### Scenario: Pre-upgrade cart loses its prior owner association
- **WHEN** a site upgrades and had carts associated with an owner under the prior identity scheme
- **THEN** those carts remain present with their line items intact after the upgrade
- **AND** their prior owner association is not guaranteed to be preserved or remapped

### Requirement: Fixed-value-set columns are stored as strings with documented allowed values
Columns representing a fixed set of allowed values SHALL be stored as string columns with the allowed values documented in the column's comment, rather than as native database `enum` columns, so that supporting a new allowed value is an application-level change and does not require a schema migration.

#### Scenario: Existing enum column converts without changing its data
- **WHEN** a site upgrades and had a column previously stored as a database `enum`
- **THEN** that column's existing values are preserved unchanged after conversion to a string column
- **AND** the column's default value and nullability are unchanged

#### Scenario: New allowed value does not require a migration
- **WHEN** a new value needs to be supported for a column that was previously modeled as a database `enum`
- **THEN** supporting that value requires only an application-level validation change
- **AND** no database migration is required to widen the column's storage

### Requirement: Coupon customer-eligibility migration accepts reset to defaults
The migration that restructures how a coupon's customer eligibility is stored SHALL be permitted to reset existing coupons to the new scheme's default eligibility values, rather than mapping forward the prior scheme's values.

#### Scenario: Existing coupon's eligibility resets on upgrade
- **WHEN** a site upgrades and had coupons configured with the prior customer-eligibility columns
- **THEN** those coupons remain present and usable after the upgrade
- **AND** their customer-eligibility configuration reflects the new scheme's defaults rather than a value carried over from the prior columns
