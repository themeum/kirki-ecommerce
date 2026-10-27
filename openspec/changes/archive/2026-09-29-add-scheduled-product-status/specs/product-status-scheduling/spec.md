## Purpose

Defines the `scheduled` product status and its `scheduled_at` timestamp: when it is required, what makes it valid, and what happens to it when a product's status moves away from `scheduled`.

## ADDED Requirements

### Requirement: Scheduled is a selectable product status

The product status SHALL accept `scheduled` as a value, alongside the existing `draft` and `published` values that a merchant can choose (`trashed` remains system-set only).

#### Scenario: Choosing Scheduled

- **WHEN** a merchant sets a product's status to `scheduled`
- **THEN** the product is saved with `status: scheduled`

### Requirement: Scheduled requires a future scheduled_at

A product SHALL NOT be saved with `status: scheduled` unless `scheduled_at` is present and is a date/time in the future at the moment of saving.

#### Scenario: Missing scheduled_at is rejected

- **WHEN** a product is submitted with `status: scheduled` and no `scheduled_at`
- **THEN** the save is rejected with a validation error on `scheduled_at`

#### Scenario: Past scheduled_at is rejected

- **WHEN** a product is submitted with `status: scheduled` and a `scheduled_at` that is earlier than the current time
- **THEN** the save is rejected with a validation error on `scheduled_at`

#### Scenario: Valid future scheduled_at is accepted

- **WHEN** a product is submitted with `status: scheduled` and a `scheduled_at` later than the current time
- **THEN** the product is saved with that `scheduled_at` value

### Requirement: Scheduled requires the same completeness as Published

A product being saved with `status: scheduled` SHALL satisfy the same variant pricing completeness rule already required for `status: published`.

#### Scenario: Scheduled without pricing is rejected

- **WHEN** a product is submitted with `status: scheduled` and its variant(s) are missing a required price
- **THEN** the save is rejected with the same validation error that `status: published` would produce for the missing price

### Requirement: scheduled_at is cleared when status leaves Scheduled

A product's `scheduled_at` SHALL be null whenever its current status is not `scheduled`. Moving a product's status away from `scheduled` to any other status clears `scheduled_at`.

#### Scenario: Switching from Scheduled to Draft

- **WHEN** a product that currently has `status: scheduled` and a `scheduled_at` value is saved with `status: draft`
- **THEN** the saved product has `status: draft` and `scheduled_at: null`

#### Scenario: Switching from Scheduled to Published

- **WHEN** a product that currently has `status: scheduled` and a `scheduled_at` value is saved with `status: published`
- **THEN** the saved product has `status: published` and `scheduled_at: null`

### Requirement: scheduled_at is exposed alongside the other lifecycle timestamps

A product's API representation SHALL include `scheduled_at`, following the same UTC storage and serialization convention already used for `published_at` and `trashed_at`.

#### Scenario: Reading a scheduled product

- **WHEN** a product with `status: scheduled` is fetched
- **THEN** the response includes a `scheduled_at` value in the same format as `published_at`/`trashed_at`
