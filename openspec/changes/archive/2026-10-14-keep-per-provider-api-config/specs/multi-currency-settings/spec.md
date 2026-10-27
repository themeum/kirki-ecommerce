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

The currency settings SHALL store the API configuration (API key and update frequency)
of each provider separately, keyed by provider, and SHALL NOT store a separate
configuration for the selected provider. The configuration of the selected provider
SHALL be the one that automatic syncs and "Sync now" use. A save SHALL store each
provider configuration that it sends and SHALL keep the stored configurations of the
providers that it does not send. The settings response SHALL return the configuration
of each provider. The currency settings SHALL NOT store, accept or return a fallback
behaviour.

When the administrator changes the selected provider, the page SHALL show the
configuration of the newly selected provider, or an empty configuration when that
provider has none. The page SHALL show a provider as configured only when that provider
has an API key. Configuration values entered for a provider SHALL stay on the page until
the administrator saves or discards the changes; saving SHALL store them and discarding
SHALL restore the stored configurations. Clearing the provider and saving SHALL keep the
stored configurations of all providers.

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

#### Scenario: Changing to a provider with no saved configuration

- **WHEN** provider A is saved with an API key and the administrator selects provider B,
  which has no saved configuration
- **THEN** provider B is not shown as configured
- **AND** the API configuration dialog for provider B opens with empty values

#### Scenario: Each provider keeps its saved configuration

- **WHEN** provider A is saved with API key "A", then provider B is selected and saved
  with API key "B"
- **AND** the administrator selects provider A again
- **THEN** provider A is shown as configured with API key "A"
- **AND** saving the page keeps API key "B" saved for provider B

#### Scenario: Unsaved values stay until save or discard

- **WHEN** the administrator enters an API key for provider B and, without saving the
  page, selects provider A and then provider B again
- **THEN** provider B shows the entered API key
- **AND** saving the page stores that API key for provider B
- **AND** discarding the changes restores the stored configurations

#### Scenario: A save keeps providers it does not send

- **WHEN** provider A and provider B have stored configurations and a save sends only
  the configuration of provider B
- **THEN** the stored configuration of provider A does not change

#### Scenario: No fallback behaviour is stored

- **WHEN** a client sends a fallback behaviour in a provider configuration
- **THEN** it is not stored
- **AND** the settings response returns no fallback behaviour

#### Scenario: A failed sync keeps the rates

- **WHEN** an automatic sync or "Sync now" fails
- **THEN** the exchange rates of all currencies do not change

#### Scenario: Clearing the provider keeps saved configurations

- **WHEN** the administrator clears the selected provider and saves
- **THEN** no provider is selected
- **AND** selecting a provider that has a saved configuration shows it as configured
