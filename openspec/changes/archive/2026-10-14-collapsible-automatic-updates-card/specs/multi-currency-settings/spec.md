## MODIFIED Requirements

### Requirement: Exchange rate provider and automatic updates are configurable

The administrator SHALL be able to select an exchange-rate provider and enter its API
key and update frequency, and save them with the rest of the currency settings. The
administrator SHALL be able to turn automatic updates on or off with a toggle in the
Automatic Updates card header; the header SHALL have no other control. The toggle SHALL
always be enabled, and its value SHALL be saved as the administrator sets it. Automatic
syncs SHALL run only while the toggle is on, a provider is selected and an API key is
saved.

While the toggle is off, the card SHALL be collapsed and SHALL show no expand control;
the provider selection and the API configuration SHALL be hidden and SHALL keep their
saved values. Turning the toggle on SHALL expand the card and show an expand/collapse
control (chevron). While the toggle is on, the chevron SHALL collapse and expand the
card. Turning the toggle off SHALL collapse the card. The card header SHALL use the
surface background and the expanded body SHALL use a darker (alternate surface)
background.

The store SHALL NOT show a fallback-behaviour setting: a failed sync always keeps the
last known rates. The store SHALL NOT show a rate-caching setting, and the currency
settings SHALL NOT store or return one. The provider cards SHALL show the selected
provider's logo.

#### Scenario: Saving provider configuration

- **WHEN** the administrator turns the toggle on, selects a provider, enters an API key,
  and saves the Currency settings page
- **THEN** the provider and its configuration are persisted
- **AND** the "Sync now" control becomes available

#### Scenario: Toggle is always enabled

- **WHEN** no provider is selected, or the selected provider has no API key
- **THEN** the automatic-updates toggle is enabled
- **AND** turning it on and saving persists automatic updates as on
- **AND** no automatic sync runs until a provider and an API key are saved

#### Scenario: Toggle off collapses the card

- **WHEN** the automatic-updates toggle is off
- **THEN** only the card header is shown
- **AND** the provider selection and the API configuration are hidden
- **AND** no chevron is shown

#### Scenario: Toggle on expands the card

- **WHEN** the administrator turns the automatic-updates toggle on
- **THEN** the card expands and shows the provider selection
- **AND** a chevron is shown that collapses and expands the card

#### Scenario: Saved values stay while hidden

- **WHEN** a provider and an API key are saved and the administrator turns the toggle
  off and saves
- **THEN** the provider and its configuration are still persisted
- **AND** turning the toggle on again shows them

#### Scenario: Card opens with the saved toggle state

- **WHEN** the administrator opens the Currency settings page
- **THEN** the card is expanded if automatic updates are saved as on
- **AND** the card is collapsed if automatic updates are saved as off

#### Scenario: Toggle is the only header control

- **WHEN** the administrator views the Automatic Updates card header
- **THEN** the automatic-updates toggle is the only control in the header, next to the
  chevron while the toggle is on
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

#### Scenario: No cache setting

- **WHEN** the administrator opens the API configuration dialog
- **THEN** no "Cache exchange rates" option is shown
- **AND** the currency settings response has no `api_config.is_cache_enabled` value

#### Scenario: Provider logo

- **WHEN** a provider is selected
- **THEN** the provider card shows that provider's logo next to its name

### Requirement: Sync status footer

When the store has more than one currency, the last row of the available-currencies
panel SHALL be a status footer with an information icon and exactly one of these
messages, chosen in this order:

1. No provider selected: rates are updated manually; the message SHALL tell the
   administrator to turn on Automatic Updates and select a provider.
2. A provider selected without a saved API key: the message SHALL name the provider,
   say it is not connected, and tell the administrator to add an API key.
3. Automatic updates on and the last automatic sync failed (`last_sync_error` set): the
   message SHALL say when the automatic sync failed, show the error, say that the rates
   are kept, and say when the next attempt runs. This message SHALL use a warning tone.
4. Automatic updates on: the message SHALL say automatic updates are on, when the last
   sync was, and when the next sync runs.
5. Automatic updates off with a configured provider: the message SHALL say the API is
   connected, that automatic updates are off, when the last sync was, and that "Sync
   now" updates rates.

Each message SHALL fit on one line at the default panel width, except when an error
text is long; a message SHALL NOT be cut off. A part of a message that depends on a
time SHALL be left out when that time is empty. Times SHALL be shown as relative times.

#### Scenario: No provider

- **WHEN** no provider is selected
- **THEN** the footer says "Rates are updated manually. Turn on Automatic Updates below
  and select a provider."

#### Scenario: Provider without API key

- **WHEN** "ExchangeRate API" is selected and no API key is saved
- **THEN** the footer says "ExchangeRate API is not connected. Add an API key below to
  sync rates automatically."

#### Scenario: Automatic updates on

- **WHEN** automatic updates are on, the last sync was 2 minutes ago, the next sync is
  in 58 minutes, and no error is recorded
- **THEN** the footer says "Automatic updates on. Last sync 2 minutes ago. Next sync in
  58 minutes."

#### Scenario: Automatic sync failed

- **WHEN** automatic updates are on, the last automatic sync failed 5 minutes ago with
  "Invalid API key.", and the next sync is in 55 minutes
- **THEN** the footer, in a warning tone, says "Automatic sync failed 5 minutes ago:
  Invalid API key. Rates kept. Retry in 55 minutes."

#### Scenario: Connected, automatic updates off

- **WHEN** a provider and API key are saved, automatic updates are off, and the last
  sync was 3 hours ago
- **THEN** the footer says "API connected, automatic updates off. Last sync 3 hours ago.
  Use Sync now to update."

#### Scenario: Never synced

- **WHEN** automatic updates are on and no sync has completed yet
- **THEN** the footer says "Automatic updates on." followed only by the next-sync part,
  if `next_sync_at` is set
