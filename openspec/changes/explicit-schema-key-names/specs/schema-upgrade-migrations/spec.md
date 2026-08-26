## ADDED Requirements

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
