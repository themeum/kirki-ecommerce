## ADDED Requirements

### Requirement: A run can be reverted

The system SHALL offer a Revert action for a run that is completed or failed. Revert SHALL delete the Kirki records that the run created and SHALL restore the previous value of each Kirki setting that the run changed. Revert SHALL NOT read, change or delete any WooCommerce data.

#### Scenario: Revert after a completed run

- **WHEN** the merchant confirms Revert on a completed run that created 109 products and 1000 orders
- **THEN** those products and orders are deleted from Kirki and WooCommerce data is unchanged

#### Scenario: Records that were reused are not deleted

- **WHEN** the run matched an existing Kirki customer by email instead of creating one
- **THEN** Revert does not delete that customer

#### Scenario: Settings are restored

- **WHEN** the run filled an empty Kirki setting
- **THEN** Revert puts the setting back to its previous empty value

### Requirement: Revert asks for confirmation

The system SHALL show a confirmation dialog before Revert starts, and SHALL start nothing when the merchant cancels.

#### Scenario: Merchant cancels

- **WHEN** the merchant presses Revert and then cancels the dialog
- **THEN** no record is deleted

### Requirement: Revert works in chunks and shows progress

Revert SHALL run in chunks, like the migration, and SHALL show progress. Records SHALL be removed in the reverse order of the migration groups so that no record is removed before the records that point to it.

#### Scenario: Large run

- **WHEN** a run created 1000 orders and Revert starts
- **THEN** no single request removes all of them and the screen shows progress

### Requirement: Records in use are kept

When new Kirki data depends on a record that the run created, Revert SHALL keep that record and SHALL report how many records were kept.

#### Scenario: Migrated product used by a new order

- **WHEN** an order made after the migration contains a migrated product and the merchant reverts
- **THEN** the product is kept, and the result says that 1 record was kept because it is in use

### Requirement: Revert ends with a clean state

When Revert finishes, the system SHALL mark the run `reverted`, SHALL remove its ledger rows, and the screen SHALL return to the scan step so that the merchant can migrate again.

#### Scenario: Migrate again after revert

- **WHEN** Revert finishes and the merchant starts a new migration
- **THEN** the new run creates all selected records and does not skip any because of the old run
