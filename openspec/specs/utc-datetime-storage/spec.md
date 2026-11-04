# utc-datetime-storage Specification

## Purpose

Makes sure every stored date and time is a UTC value that does not depend on the database server or session time zone, and that is not limited to dates before 2038.

## Requirements

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

### Requirement: Stored dates are UTC

The system SHALL store every date and time in UTC, including `created_at` and `updated_at` on rows that are written in bulk without going through a model. The stored value SHALL NOT depend on the time zone of the database server or session.

#### Scenario: Bulk insert under a non-UTC session time zone
- **WHEN** the database session time zone is +07:00 and rows are saved by a bulk insert
- **THEN** the stored `created_at` and `updated_at` equal the current UTC time within a few seconds

#### Scenario: Model write
- **WHEN** a record is created through its model
- **THEN** its `created_at` and `updated_at` are the current UTC time

### Requirement: A stored time does not move when the time zone changes

A stored date and time SHALL read back with the same value when the database server or session time zone changes.

#### Scenario: Session time zone changes after the write
- **WHEN** an order is saved with `paid_at` of `2026-01-15 10:00:00` while the session time zone is UTC
- **AND** the session time zone then changes to +07:00
- **THEN** reading the row returns `2026-01-15 10:00:00`

### Requirement: Dates after 2038 are stored

The system SHALL store and return a date and time later than 2038-01-19 without error and without change.

#### Scenario: Far-future date round trip
- **WHEN** an order is saved with an `estimated_delivery_date` of `2040-06-01 12:00:00`
- **THEN** reading the order returns `2040-06-01 12:00:00`
