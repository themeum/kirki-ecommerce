## ADDED Requirements

### Requirement: Pre-release builds define each table in a single create migration
Until the first stable `1.0.0` release, the plugin SHALL define every table it owns in exactly one create migration that builds the table in its current shape. It SHALL NOT ship migrations that alter, rename, re-key, or drop a table created by an earlier migration, nor migrations that only rewrite stored data. A schema change made before the first stable release SHALL be made by editing the table's create migration.

#### Scenario: Migration set holds only table creations
- **WHEN** the registered migrations of a pre-release build are listed
- **THEN** every entry creates exactly one plugin table
- **AND** no two entries create the same table
- **AND** no entry alters, drops, or renames a table, a column, or a key, and none rewrites option or row data

#### Scenario: Fresh install builds every table in its final shape
- **WHEN** a pre-release build is installed on a site with no plugin tables and no migration history
- **THEN** each plugin table is created once, already carrying all of its current columns, keys, and foreign keys
- **AND** no table is created and then modified within the same migration run

#### Scenario: A table that is no longer used is not created
- **WHEN** a table has been retired before the first stable release
- **THEN** no migration creates it, and a fresh install does not contain it

### Requirement: Pre-release builds do not support in-place upgrades
A site running an alpha or beta build SHALL NOT be expected to upgrade to a later pre-release build in place. Moving between pre-release builds SHALL require a fresh install: the plugin's tables and migration history are removed and the migrations run again.

#### Scenario: Beta site moves to a later pre-release build
- **WHEN** a site running `1.0.0-beta.1` wants to run a later pre-release build
- **THEN** its owner removes the plugin's tables and migration history and installs the new build fresh
- **AND** after that, the site's schema matches the new build's create migrations exactly

## MODIFIED Requirements

### Requirement: Existing installations converge to the current schema on upgrade
From the first stable `1.0.0` release onward, when a site upgrades to a plugin version whose table definitions differ from what that site's database currently has, the system SHALL run alter migrations that bring every affected table's columns, keys, and foreign keys in line with the current definitions, without requiring manual database intervention by the site owner. From that release onward, a released create migration SHALL NOT be edited, and any schema change SHALL ship as a new alter migration registered after every existing migration.

#### Scenario: Site upgrades across a schema-changing stable release
- **WHEN** a site running a stable plugin version is upgraded to a later stable version that changes a table's columns, keys, or foreign keys
- **THEN** that table's columns, keys, and foreign keys match the current definitions after the upgrade completes
- **AND** no manual SQL or database intervention is required by the site owner

#### Scenario: Fresh install reaches the current schema via the same migration sequence
- **WHEN** a stable plugin version is installed fresh with no prior version ever having run
- **THEN** the create migrations and every alter migration released since `1.0.0` run in registration order as part of the same initial migration run
- **AND** the resulting schema matches the current definitions exactly, identical to what an upgraded existing installation ends up with

### Requirement: Fixed-value-set columns are stored as strings with documented allowed values
Columns representing a fixed set of allowed values SHALL be stored as string columns with the allowed values documented in the column's comment, rather than as native database `enum` columns, so that supporting a new allowed value is an application-level change and does not require a schema migration.

#### Scenario: Fixed-value-set column is a string with its values documented
- **WHEN** a plugin table has a column limited to a fixed set of values
- **THEN** the column is a string column, not a database `enum`
- **AND** its comment lists the allowed values

#### Scenario: New allowed value does not require a migration
- **WHEN** a new value needs to be supported for a column limited to a fixed set of values
- **THEN** supporting that value requires only an application-level validation change
- **AND** no database migration is required to widen the column's storage

### Requirement: Every schema key carries an explicit project-owned name
Every index, unique key, and foreign key on a plugin table SHALL have a name determined by the plugin itself, written out literally in the migration that creates it. Names SHALL follow the scheme `{type}_kecom_{table}_{columns}`, where `{type}` is `fk` for a foreign key, `uq` for a unique key, and `idx` for a plain index; `{table}` is the table name without the WordPress table prefix and without the `kirki_ecommerce_` namespace; and `{columns}` is the covered columns in index order, joined with `_`. A name that would be longer than 64 characters SHALL instead use a shorter, hand-chosen name that keeps the `{type}_kecom_{table}_` prefix. No key's name may be left for the database engine or the underlying schema library to choose.

Primary keys are exempt: the database engine names the primary index unconditionally and ignores
any requested name, so a primary key is already identical everywhere and is referred to
positionally rather than by name.

#### Scenario: Every key in a freshly migrated database follows the naming scheme
- **WHEN** a database is migrated from empty to the current schema
- **THEN** every index, unique key, and foreign key on every plugin table has the name the scheme produces for its table and columns, or its documented short form
- **AND** no key carries a name chosen by the database engine or by the schema library's own name generation

#### Scenario: Foreign key and its backing index share one name
- **WHEN** a foreign key is created on a column that has no other index
- **THEN** the index the engine creates to back it carries the foreign key's `fk_kecom_…` name
- **AND** no second, differently named index exists over the same column

#### Scenario: A migration can drop a key by a name written in its source
- **WHEN** a migration needs to drop an existing index or foreign key
- **THEN** it identifies that key by a name literally present in the plugin's own source
- **AND** it does not need to query the database to discover what the key is currently called

## REMOVED Requirements

### Requirement: Cart identity migration accepts loss of existing cart-owner association
**Reason**: The migration that replaced the cart's owner column is folded into the carts create migration. With no in-place upgrades before `1.0.0`, there are no pre-existing carts to re-associate.
**Migration**: None. Fresh installs create carts with the current owner column.

### Requirement: Coupon customer-eligibility migration accepts reset to defaults
**Reason**: The eligibility columns are folded into the coupons create migration. With no in-place upgrades before `1.0.0`, there are no pre-existing coupons to reset.
**Migration**: None. Fresh installs create coupons with the current eligibility columns.

### Requirement: Key names are stable across schema-library upgrades
**Reason**: This requirement existed so that databases created under framework 2.1.15, whose foreign keys had engine-assigned names, would converge with fresh installs. Every key is now named literally in its create migration, and pre-release databases are not upgraded, so no legacy names remain to converge.
**Migration**: Covered by "Every schema key carries an explicit project-owned name".

### Requirement: Renaming a key preserves its referential semantics
**Reason**: The key-renaming migration is deleted. Keys are created under their final names and never renamed.
**Migration**: None.

### Requirement: Key renaming is idempotent and resumable
**Reason**: The key-renaming migration is deleted. Keys are created under their final names and never renamed.
**Migration**: None.

### Requirement: Only the plugin's own keys are renamed
**Reason**: The key-renaming migration is deleted, so no migration renames keys at all.
**Migration**: None.
