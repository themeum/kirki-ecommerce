## ADDED Requirements

### Requirement: Available currencies panel layout

The available-currencies panel SHALL be one bordered list. Its first row SHALL be a
header with the title "Available Currencies" and, when the store has more than one
currency, a "Sync now" control. Each currency row SHALL show the currency symbol, code
and name, a "Base Currency" badge on the base currency, and an "Inactive" badge on an
inactive currency. The base currency row SHALL show the rate 1.00 and no actions. An
inactive row SHALL show its text in a subdued color and SHALL NOT show its rate until
the administrator hovers over or focuses the row.

#### Scenario: Several currencies

- **WHEN** the store has USD (base), GBP and an inactive RUB
- **THEN** the panel shows a header row with "Available Currencies" and "Sync now"
- **AND** the USD row shows "$", "USD", "US Dollar", a "Base Currency" badge and 1.00
- **AND** the RUB row shows an "Inactive" badge in subdued text and no rate

#### Scenario: Single currency

- **WHEN** the store has only one currency
- **THEN** the panel shows the header row without "Sync now" and the currency row
- **AND** the panel shows no status footer

#### Scenario: Hovering a non-base row

- **WHEN** the administrator hovers over or focuses a non-base row
- **THEN** the row shows its actions menu and inline rate input in place of the rate

### Requirement: Sync status footer

When the store has more than one currency, the last row of the available-currencies
panel SHALL be a status footer with an information icon and exactly one of these
messages, chosen in this order:

1. No provider selected: automatic updates are off and rates are updated manually; the
   message SHALL tell the administrator to select an API provider.
2. A provider selected without a saved API key: the message SHALL name the provider,
   say it is not connected, and tell the administrator to add an API key.
3. Automatic updates on and the last automatic sync failed (`last_sync_error` set): the
   message SHALL say when the sync failed, show the error, say that current rates are
   kept, and say when the next attempt runs. This message SHALL use a warning tone.
4. Automatic updates on: the message SHALL say the API connection is active, when the
   last sync was, and when the next update runs.
5. Automatic updates off with a configured provider: the message SHALL say the API is
   connected, that automatic updates are off, when the last sync was, and that "Sync
   now" updates rates.

A part of a message that depends on a time SHALL be left out when that time is empty.
Times SHALL be shown as relative times.

#### Scenario: No provider

- **WHEN** no provider is selected
- **THEN** the footer says "Automatic updates are off. Exchange rates are updated
  manually. Select an API provider below to keep rates current."

#### Scenario: Provider without API key

- **WHEN** "ExchangeRate API" is selected and no API key is saved
- **THEN** the footer says "ExchangeRate API is selected but not connected. Add an API
  key below to turn on automatic rate updates."

#### Scenario: Automatic updates on

- **WHEN** automatic updates are on, the last sync was 2 minutes ago, the next sync is
  in 58 minutes, and no error is recorded
- **THEN** the footer says "API connection active. Last sync: 2 minutes ago. Next
  update in 58 minutes."

#### Scenario: Automatic sync failed

- **WHEN** automatic updates are on, the last automatic sync failed 5 minutes ago with
  "Invalid API key.", and the next sync is in 55 minutes
- **THEN** the footer, in a warning tone, says "Last automatic sync failed 5 minutes
  ago: Invalid API key. Current rates are kept. Next attempt in 55 minutes."

#### Scenario: Connected, automatic updates off

- **WHEN** a provider and API key are saved, automatic updates are off, and the last
  sync was 3 hours ago
- **THEN** the footer says "API connected. Automatic updates are off. Last sync: 3
  hours ago. Use Sync now to update rates."

#### Scenario: Never synced

- **WHEN** automatic updates are on and no sync has completed yet
- **THEN** the footer says "API connection active." followed only by the next-update
  part, if `next_sync_at` is set

## REMOVED Requirements

### Requirement: Last synced indicator

**Reason**: Replaced by the five-state "Sync status footer", which shows the last sync
time in every connected state and also covers the off, unconfigured and failed states.
**Migration**: See "Sync status footer" in this capability.
