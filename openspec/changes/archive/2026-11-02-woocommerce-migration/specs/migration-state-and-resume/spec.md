## Purpose
Defines how migration progress is saved so that a failed or interrupted run can resume, and how source records are linked to the Kirki records created from them.

## ADDED Requirements

### Requirement: Progress is persistent

The system SHALL save the state of a migration run in the database after every chunk. The state SHALL include the selected groups, the status of each group (pending, running, done, failed), the position in each group, the counts of created, reused and skipped items, and the last error.

#### Scenario: Page reload during migration

- **WHEN** the merchant reloads the page in the middle of a migration
- **THEN** the system reports the saved run and the merchant can continue it

#### Scenario: Server error in the middle of a group

- **WHEN** a chunk request fails with a server error
- **THEN** the saved position is the end of the last chunk that finished

### Requirement: A run can resume

The system SHALL continue a run from the saved position of each unfinished group. Items before the saved position SHALL NOT be processed again.

#### Scenario: Resume after failure

- **WHEN** a run stopped after 120 of 300 products and the merchant resumes it
- **THEN** the next chunk starts at product 121

### Requirement: Source records are linked to Kirki records

For each item that is created or matched, the system SHALL save a link between the source plugin, the source entity type, the source id and the Kirki id. Later groups SHALL use these links to point to the correct Kirki records.

#### Scenario: Order item to product

- **WHEN** an order contains a line item for source product 57, and product 57 was migrated to Kirki product 903
- **THEN** the created order item points to Kirki product 903

#### Scenario: Variation to variant

- **WHEN** an order line item names a source variation
- **THEN** the created order item points to the matching Kirki variant of the migrated product

### Requirement: A repeated run does not duplicate data

An item that already has a link SHALL NOT be created again. Running the same migration a second time SHALL create no duplicate record.

#### Scenario: Second run

- **WHEN** the merchant runs a full migration twice
- **THEN** the second run creates no new records and reports all items as already migrated

### Requirement: Merchant can see the final report

When a run ends, the system SHALL provide counts of created, reused and skipped items for each group, and the list of skipped items with reasons.

#### Scenario: Completed run with skips

- **WHEN** a run ends with 3 skipped coupons
- **THEN** the report shows the 3 coupons with their source ids and reasons
