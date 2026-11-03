## Purpose
Defines the source-independent migration engine: how a source plugin is detected, scanned and migrated group by group in small chunks. A new source plugin can be added without changing this behavior.

## ADDED Requirements

### Requirement: Sources are pluggable

The system SHALL support several source plugins through one common contract. A source SHALL be able to report whether it is installed, report its version and unsupported-version state, list the extension plugins it found, scan its data into groups, and migrate one chunk of one group. The migration engine SHALL NOT contain logic that is specific to one source plugin.

#### Scenario: A source is not installed

- **WHEN** a source plugin is not installed
- **THEN** that source reports "not detected" and no migration is offered for it

#### Scenario: Adding a second source

- **WHEN** a new source is registered
- **THEN** the engine offers and runs it with no change to the engine behavior

### Requirement: Scan lists only migratable groups

A scan SHALL return a list of data groups. Each group SHALL have an identifier, a label and an item count. A group SHALL appear only if its data can be mapped to the Kirki create payloads. Groups with a count of zero SHALL be omitted. The scan SHALL only read data.

#### Scenario: Scan result

- **WHEN** a scan runs on a source that has 100 products and 1000 orders
- **THEN** the result contains a Products group with count 100 and an Orders group with count 1000

#### Scenario: Empty group

- **WHEN** the source has no coupons
- **THEN** no Coupons group is returned

### Requirement: One request migrates one chunk of one group

A migration request SHALL process at most one chunk of exactly one group. The chunk size SHALL be between 30 and 50 items. The response SHALL contain the group, the number of items processed in the chunk, the number done so far, the group total, and whether the group is finished.

#### Scenario: Large group

- **WHEN** a group has 1000 items
- **THEN** the group is migrated over several requests and no request processes more than 50 items

#### Scenario: Last chunk

- **WHEN** a request processes the final items of a group
- **THEN** the response reports the group as finished

### Requirement: Groups run in dependency order

A group SHALL NOT start before the groups it depends on are finished or deselected. Orders SHALL come after catalog, customers and coupons.

#### Scenario: Order of groups

- **WHEN** the merchant selects all groups
- **THEN** catalog, customers and coupons finish before orders start

#### Scenario: Dependency deselected

- **WHEN** the merchant deselects Products and keeps Orders
- **THEN** order items that point to a product not in Kirki are stored as plain line items with the original name, SKU and price, and the item is listed in the report

### Requirement: Failures are reported per item

When one item cannot be migrated, the system SHALL skip that item, record the source id, the group and a reason, and continue with the next item. A skipped item SHALL NOT stop the group. The final result SHALL include the count of skipped items and their reasons.

#### Scenario: Unmappable product

- **WHEN** one product has data that cannot be mapped
- **THEN** that product is skipped, the other products in the chunk are created, and the skipped product is in the report

### Requirement: Migration endpoints require administrator rights

All scan and migration requests SHALL be accepted only from users who can manage the store. Other requests SHALL be rejected.

#### Scenario: Unauthorized request

- **WHEN** a user without store management rights sends a scan or chunk request
- **THEN** the request is rejected with an authorization error and no data is read or written
