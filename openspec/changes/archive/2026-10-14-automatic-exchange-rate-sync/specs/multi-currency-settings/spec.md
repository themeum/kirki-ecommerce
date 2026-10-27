## ADDED Requirements

### Requirement: Exchange rate provider and automatic updates are configurable

The administrator SHALL be able to select an exchange-rate provider and enter its API
key and update frequency, and save them with the rest of the currency settings. The
administrator SHALL be able to turn automatic updates on or off with a toggle in the
Automatic Updates card header; the header SHALL have no other control. The
automatic-updates toggle SHALL be disabled while no provider is selected or no API key
is saved. The store SHALL NOT show a fallback-behaviour setting: a failed sync always
keeps the last known rates.

#### Scenario: Saving provider configuration

- **WHEN** the administrator selects a provider, enters an API key, and saves the
  Currency settings page
- **THEN** the provider and its configuration are persisted
- **AND** the "Sync now" control becomes available

#### Scenario: Toggle needs a configured provider

- **WHEN** no provider is selected, or the selected provider has no API key
- **THEN** the automatic-updates toggle is disabled

#### Scenario: Toggle is the only header control

- **WHEN** the administrator views the Automatic Updates card header
- **THEN** the automatic-updates toggle is the only control in the header
- **AND** the header shows no overflow (vertical ellipsis) menu

#### Scenario: Turning automatic updates on

- **WHEN** a provider and API key are configured and the administrator turns the
  automatic-updates toggle on and saves
- **THEN** automatic updates are persisted as on
- **AND** the save does not wait for a sync to finish

#### Scenario: No fallback setting

- **WHEN** the administrator opens the API configuration dialog or views the configured
  provider card
- **THEN** no "Fallback Behavior" field or value is shown

## MODIFIED Requirements

### Requirement: On-demand exchange rate sync

The store SHALL provide an endpoint and a "Sync now" control that pull fresh exchange
rates for all currencies from the configured provider and persist them, along with the
sync timestamp and, where the provider reports it, API usage. When automatic updates
are on, a successful or failed on-demand sync SHALL replace the automatic schedule so
that the next automatic sync runs one update interval after the on-demand sync.

#### Scenario: Successful sync

- **WHEN** a provider and API key are configured and the administrator triggers a sync
- **THEN** each currency's exchange rate is updated from the provider
- **AND** the last-sync timestamp is recorded
- **AND** the currency list and its "Last synced" indicator refresh

#### Scenario: Sync restarts the automatic schedule

- **WHEN** automatic updates are on with the frequency "every 1 hour", the next
  automatic sync is 10 minutes away, and the administrator triggers a sync
- **THEN** `next_sync_at` is one hour after the on-demand sync
- **AND** the automatic sync that was 10 minutes away does nothing

#### Scenario: No provider configured

- **WHEN** a sync is triggered with no exchange-rate provider configured
- **THEN** the request fails with a client error and a message telling the
  administrator to configure a provider first
- **AND** no rates change

#### Scenario: Provider rejects the request

- **WHEN** the provider returns an error (for example an invalid API key) during a sync
- **THEN** the request fails with the provider's error message surfaced to the
  administrator
- **AND** no rates change

#### Scenario: Sync control requires saved settings

- **WHEN** the administrator has unsaved changes to the provider configuration
- **THEN** the "Sync now" control is disabled until the settings are saved

## REMOVED Requirements

### Requirement: Exchange rate provider is configurable, automatic updates stay off

**Reason**: Automatic updates are now implemented on the queued job runner.
**Migration**: Replaced by "Exchange rate provider and automatic updates are
configurable" in this capability and by the `automatic-exchange-rate-sync` capability.
Stores that saved the toggle as on before this change start their schedule on the next
queue maintenance run.
