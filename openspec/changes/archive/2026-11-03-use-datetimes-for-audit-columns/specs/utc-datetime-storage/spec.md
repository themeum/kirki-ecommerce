# Spec Delta

## MODIFIED Requirements

### Requirement: Date columns use DATETIME

Every date and time column on a plugin table SHALL have the database type `datetime`, not `timestamp`. This includes `created_at` and `updated_at`. Columns that store a Unix number in an integer column, such as the queue tables, are not date columns.

#### Scenario: Schema of a fresh install
- **WHEN** the plugin is installed fresh and its tables are created
- **THEN** no date column of any plugin table, including `created_at` and `updated_at`, has the database type `timestamp`

#### Scenario: Named date columns
- **WHEN** a reader inspects `orders.paid_at`, `orders.shipped_at`, `products.published_at` and `carts.expires_at`
- **THEN** each has the database type `datetime`

#### Scenario: Audit columns
- **WHEN** a reader inspects `created_at` and `updated_at` on any plugin table that has them
- **THEN** each has the database type `datetime`
- **AND** `created_at` defaults to the current time and `updated_at` is nullable
