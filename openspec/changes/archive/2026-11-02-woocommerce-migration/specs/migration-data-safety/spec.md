## Purpose
Defines what a migration may and may not change, so a merchant never loses source data or existing Kirki data, and so imported history does not trigger live store behavior.

## ADDED Requirements

### Requirement: The source data is never changed

A scan or migration SHALL NOT create, update or delete any record of the source plugin.

#### Scenario: Full migration

- **WHEN** a full migration finishes
- **THEN** all WooCommerce products, orders, customers, coupons and settings are unchanged

### Requirement: Existing Kirki data is never changed

A migration SHALL only add records. It SHALL NOT update or delete a Kirki record that existed before it created the link for that item.

#### Scenario: Kirki already has products

- **WHEN** Kirki already holds products and a migration runs
- **THEN** the existing products are unchanged and the migrated products are added

### Requirement: Unique values that clash are resolved

When a migrated value clashes with a unique value in Kirki, the system SHALL keep both records. A slug or SKU clash SHALL be resolved by adding a suffix to the migrated value. A coupon code clash SHALL be resolved by adding a suffix. A customer with the same email SHALL be reused and SHALL NOT be created again. Each resolution SHALL appear in the report.

#### Scenario: Same SKU

- **WHEN** a migrated product has a SKU that a Kirki product already uses
- **THEN** the migrated product is created with a suffixed SKU and the report names the change

#### Scenario: Same customer email

- **WHEN** a migrated customer has an email that a Kirki customer already uses
- **THEN** no new customer is created and the migrated orders point to the existing customer

### Requirement: Migration mode suppresses live behavior

While a migration inserts data, the system SHALL NOT send customer or admin emails, SHALL NOT change stock levels, SHALL NOT count coupon usage, and SHALL NOT fire order or customer events for imported records. Imported orders SHALL keep their original dates, number, status and totals. Imported stock and coupon usage values SHALL come from the source.

#### Scenario: Importing a completed order

- **WHEN** a completed order from last year is imported
- **THEN** no email is sent, product stock is not reduced again, and the order keeps its original creation and paid dates

### Requirement: Secrets are not copied

The migration SHALL NOT copy passwords, password hashes, payment gateway keys or other credentials.

#### Scenario: Payment settings

- **WHEN** the settings group is migrated
- **THEN** no gateway API key or secret is stored in Kirki
