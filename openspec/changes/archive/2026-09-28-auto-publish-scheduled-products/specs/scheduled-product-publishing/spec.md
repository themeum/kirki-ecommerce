## Purpose

Makes a product saved with `status: scheduled` go live on its own once its `scheduled_at` arrives, and defines how a changed or withdrawn schedule affects that automatic publish.

## ADDED Requirements

### Requirement: A scheduled product is published when scheduled_at arrives

A product that has `status: scheduled` SHALL be transitioned to `status: published` automatically, without merchant action, once the current time reaches its `scheduled_at`. The transition SHALL leave the product in the same state a manual publish produces: `status: published`, `published_at` set to the time the transition ran (UTC), and `scheduled_at: null`.

#### Scenario: Product created as Scheduled goes live

- **WHEN** a product is created with `status: scheduled` and a future `scheduled_at`, and that time arrives
- **THEN** the product has `status: published`, a non-null `published_at` no earlier than `scheduled_at`, and `scheduled_at: null`

#### Scenario: Product updated to Scheduled goes live

- **WHEN** an existing `draft` product is saved with `status: scheduled` and a future `scheduled_at`, and that time arrives
- **THEN** the product has `status: published`, a non-null `published_at`, and `scheduled_at: null`

#### Scenario: Nothing happens before scheduled_at

- **WHEN** a product has `status: scheduled` and its `scheduled_at` is still in the future
- **THEN** the product remains `status: scheduled` with its `scheduled_at` unchanged

### Requirement: Only the latest schedule is honoured

When a scheduled product's schedule is changed or withdrawn before it goes live, the product SHALL be published only according to its schedule as last saved. An earlier schedule SHALL NOT publish the product.

#### Scenario: Rescheduled to a later time

- **WHEN** a product scheduled for time T1 is saved again with a later `scheduled_at` T2, and T1 arrives
- **THEN** the product is still `status: scheduled` with `scheduled_at` T2, and it is published only once T2 arrives

#### Scenario: Rescheduled to an earlier time

- **WHEN** a product scheduled for time T1 is saved again with an earlier (still future) `scheduled_at` T0, and T0 arrives
- **THEN** the product is published at T0, and nothing further changes when T1 arrives

#### Scenario: Unscheduled back to Draft

- **WHEN** a scheduled product is saved with `status: draft` before its `scheduled_at` arrives, and that time then arrives
- **THEN** the product remains `status: draft`

#### Scenario: Published manually before the schedule

- **WHEN** a scheduled product is saved with `status: published` before its `scheduled_at` arrives, and that time then arrives
- **THEN** the product's `published_at` keeps the value set by the manual publish

#### Scenario: Trashed before the schedule

- **WHEN** a scheduled product is trashed before its `scheduled_at` arrives, and that time then arrives
- **THEN** the product remains `status: trashed`

#### Scenario: Deleted before the schedule

- **WHEN** a scheduled product is permanently deleted before its `scheduled_at` arrives, and that time then arrives
- **THEN** nothing is published and no error is recorded

### Requirement: Saving without changing the schedule does not queue another publish

Saving a product that is already `scheduled` with the same `scheduled_at` SHALL NOT queue an additional automatic publish; the one queued when the schedule was set remains responsible for it.

#### Scenario: Editing other fields of a scheduled product

- **WHEN** a product with `status: scheduled` is saved with only non-schedule fields changed (e.g. title or description) and the same `scheduled_at`
- **THEN** no additional publish is queued, and the product is still published once when `scheduled_at` arrives

### Requirement: A failed save queues no publish

An automatic publish SHALL be queued only when the save that sets the schedule succeeds. If the save is rejected or rolled back, no publish is queued for it.

#### Scenario: Save rolled back after the schedule was set

- **WHEN** a product save with `status: scheduled` fails partway (e.g. a variant cannot be saved) and is rolled back
- **THEN** no automatic publish is queued for that save
