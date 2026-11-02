## Purpose

Keeps stored exchange rates current without administrator action by syncing them from
the configured provider in the background, at the frequency the administrator chose.

## ADDED Requirements

### Requirement: Rates sync on a schedule while automatic updates are on

While automatic updates are on and a provider and API key are saved, the store SHALL
sync exchange rates from the provider in the background, once per configured update
frequency (15 minutes, 30 minutes, 1 hour, 6 hours, 12 hours or 24 hours). Each run
SHALL record the time of the next run as `next_sync_at`. The sync SHALL NOT run inside
an administrator's request.

#### Scenario: Turning automatic updates on

- **WHEN** the administrator turns automatic updates on with a provider, an API key and
  the frequency "every 1 hour", and saves
- **THEN** the save response returns without waiting for the provider
- **AND** a background sync runs soon after the save
- **AND** after that sync, `last_sync_at` is the sync time and `next_sync_at` is one
  hour later

#### Scenario: Following runs

- **WHEN** a scheduled sync completes
- **THEN** the next sync runs at `next_sync_at`, one frequency interval later

#### Scenario: Automatic updates off

- **WHEN** automatic updates are off
- **THEN** no background sync runs
- **AND** `next_sync_at` is empty

### Requirement: Only the current schedule runs

A change to the automatic-updates toggle, the provider, the API key or the update
frequency SHALL replace the current schedule. A run that belongs to a replaced schedule
SHALL make no provider request and change no data. A save of the currency settings that
changes none of these four values SHALL NOT change the schedule.

#### Scenario: Changing the frequency

- **WHEN** a sync is scheduled one hour from now and the administrator changes the
  frequency to "every 15 minutes" and saves
- **THEN** a sync runs soon after the save and the next one is 15 minutes after it
- **AND** the run that was scheduled one hour from now does nothing

#### Scenario: Turning automatic updates off

- **WHEN** a sync is scheduled and the administrator turns automatic updates off and
  saves
- **THEN** the scheduled run does nothing
- **AND** `next_sync_at` is empty

#### Scenario: Saving an unrelated currency setting

- **WHEN** automatic updates are on and the administrator changes only the decimal
  separator and saves
- **THEN** no extra sync runs and `next_sync_at` does not change

### Requirement: A failed automatic sync keeps rates and continues

When a scheduled sync fails (for example an invalid API key, a network error or a
provider error), the store SHALL keep every stored rate unchanged, record the error
message as `last_sync_error` and its time as `last_sync_error_at`, and still schedule
the next run one interval later. The next successful sync SHALL clear `last_sync_error`
and `last_sync_error_at`.

#### Scenario: Provider error during a scheduled sync

- **WHEN** a scheduled sync runs and the provider rejects the API key
- **THEN** no currency's rate changes
- **AND** `last_sync_error` holds the provider's error message and `last_sync_error_at`
  holds the time of the failure
- **AND** `next_sync_at` is one interval later

#### Scenario: Recovery after a failure

- **WHEN** a scheduled sync succeeds after an earlier failure
- **THEN** `last_sync_error` and `last_sync_error_at` are empty

### Requirement: A stopped schedule is repaired

While automatic updates are on, when `next_sync_at` is more than one update interval in
the past, or is empty, the store SHALL start a new schedule within about one minute,
through the queue's recurring maintenance run.

#### Scenario: Lost scheduled run

- **WHEN** automatic updates are on with the frequency "every 1 hour" and
  `next_sync_at` is two hours in the past
- **THEN** within the next queue maintenance run a new schedule starts
- **AND** a sync runs and `next_sync_at` moves into the future

#### Scenario: Healthy schedule

- **WHEN** automatic updates are on and `next_sync_at` is in the future
- **THEN** the maintenance run does not start a new schedule
