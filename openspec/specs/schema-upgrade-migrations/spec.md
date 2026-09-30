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

### Requirement: Every schema key carries an explicit project-owned name
Every index, unique key, and foreign key on a plugin table SHALL have a name determined by the
plugin itself, following a single documented scheme derived from the table and the columns the key
covers. No key's name may be left for the database engine or the underlying schema library to
choose, so that a key's name is a stable fact of the plugin rather than a side effect of the
environment or library version it was created under.

Primary keys are exempt: the database engine names the primary index unconditionally and ignores
any requested name, so a primary key is already identical everywhere and is referred to
positionally rather than by name.

#### Scenario: Every key in a fully migrated database matches the naming scheme
- **WHEN** a database is migrated to the current schema from any starting point
- **THEN** every index, unique key, and foreign key on every plugin table has the name the scheme
  produces for that table and column set
- **AND** no key retains a name chosen by the database engine or by the schema library's own
  name-generation

#### Scenario: A migration that omits an explicit key name is rejected
- **WHEN** a migration creates an index, unique key, or foreign key without giving it a name
- **THEN** the resulting key does not match the naming scheme
- **AND** the mismatch is reported as a failure that identifies the offending table and key

### Requirement: Key names are stable across schema-library upgrades
A key's name SHALL NOT change as a result of upgrading the underlying schema library. Two
installations running the same plugin version SHALL have identical key names regardless of which
library version originally created their tables.

#### Scenario: Sites created under different library versions converge
- **WHEN** a site whose tables were created under an older schema library, and a site freshly
  installed under the current one, are both migrated to the same plugin version
- **THEN** both databases have identical index, unique key, and foreign key names on every plugin
  table
- **AND** subsequent migrations that drop or recreate a key by name succeed on both

#### Scenario: A migration can drop a key by a name written in its source
- **WHEN** a migration needs to drop an existing index or foreign key
- **THEN** it identifies that key by a name literally present in the plugin's own source
- **AND** it does not need to query the database to discover what the key is currently called

### Requirement: Renaming a key preserves its referential semantics
A migration that renames existing keys SHALL change only their names. The columns a key covers,
its uniqueness, and for a foreign key its referenced table, referenced column, and its
`ON DELETE` and `ON UPDATE` rules SHALL be identical before and after.

#### Scenario: Foreign key behaviour is unchanged by a rename
- **WHEN** a foreign key is renamed during an upgrade
- **THEN** it still references the same table and column
- **AND** its delete and update rules are unchanged
- **AND** rows continue to cascade, restrict, or null exactly as they did before the upgrade

#### Scenario: Index coverage is unchanged by a rename
- **WHEN** an index or unique key is renamed during an upgrade
- **THEN** it still covers the same columns in the same order
- **AND** its uniqueness is unchanged

### Requirement: Key renaming is idempotent and resumable
Because schema changes are not transactional, a migration that renames keys SHALL leave any
already-correct key untouched and SHALL be safe to run again after a partial failure, reaching the
same end state as an uninterrupted run.

#### Scenario: Re-running after a partial failure completes the work
- **WHEN** a key-renaming migration fails partway through, leaving some keys renamed and some not
- **THEN** running it again renames only the keys still carrying the wrong name
- **AND** the database reaches the same final state as an uninterrupted run

#### Scenario: Running against an already-correct database does nothing
- **WHEN** a key-renaming migration runs against a database whose keys already match the scheme
- **THEN** no key is dropped or recreated
- **AND** the schema is unchanged

### Requirement: Only the plugin's own keys are renamed
A key-renaming migration SHALL restrict itself to keys belonging to the plugin's own tables, and
SHALL NOT alter constraints defined by WordPress core or by other plugins, including foreign keys
declared on a non-plugin table that reference a plugin table.

#### Scenario: A foreign key owned by another plugin is left alone
- **WHEN** a table outside the plugin declares a foreign key referencing a plugin table
- **THEN** that foreign key is not dropped, renamed, or recreated
- **AND** it continues to function unchanged after the upgrade

