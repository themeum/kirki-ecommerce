## Purpose

Lets a store administrator manage the currencies customers can shop in — adding
currencies, maintaining their exchange rates against the base currency, choosing which
currency is the base, activating or removing currencies, and refreshing rates on
demand from an external provider — all from the Currency settings page.

## Requirements

### Requirement: Available currencies panel is usable

The Currency settings page SHALL present the store's currencies as an editable list
with no "coming soon" gating. Adding a currency SHALL be available at all times the
page is shown.

#### Scenario: Panel is interactive on load

- **WHEN** an administrator opens the Currency settings page
- **THEN** the "Available Currencies" list renders every currency returned by the
  currencies API
- **AND** the "Add Currency" control is enabled

#### Scenario: Adding currencies

- **WHEN** the administrator picks one or more currencies in the add flow, enters an
  exchange rate for each, and confirms
- **THEN** each selected currency is persisted with the entered rate and appears in
  the list
- **AND** when the store had no currencies, the first added currency becomes the base

### Requirement: Exchange rate is edited inline

Each non-base currency row SHALL expose its exchange rate as an inline numeric input.
The store SHALL NOT present a separate dialog for editing a single currency's rate.

#### Scenario: Committing a valid rate

- **WHEN** the administrator changes a row's rate input to a positive number and blurs
  or presses Enter
- **THEN** the new rate is persisted for that currency and reflected in the list

#### Scenario: Rejecting an invalid rate

- **WHEN** the administrator enters a blank, zero, or negative value and commits
- **THEN** the input reverts to the last persisted rate and no update request is sent

#### Scenario: Base currency rate is fixed

- **WHEN** the administrator views the base currency row
- **THEN** its rate is shown as 1 and cannot be edited

### Requirement: Changing the base currency recalculates exchange rates

Every stored exchange rate SHALL mean "units of this currency per 1 unit of the base
currency". When a currency that is not the base becomes the base, the store SHALL, in
one atomic operation:

- set the new base currency's exchange rate to 1;
- set every other stored currency's exchange rate to its previous rate divided by the
  previous rate of the new base, rounded to 6 decimal places.

This SHALL apply whatever way the base changes: a currency update, or a currency
created as the base while another base exists. When the new base had no stored rate
against the previous base, or that rate was not a positive number, the other rates
SHALL stay unchanged and only the new base's rate SHALL be set to 1.

#### Scenario: Setting a non-base currency as the base

- **WHEN** USD is the base at rate 1, EUR has rate 0.5 and GBP has rate 0.25, and the
  administrator sets EUR as the base
- **THEN** EUR has rate 1 and is the only base
- **AND** USD has rate 2
- **AND** GBP has rate 0.5

#### Scenario: Rates sent in the same request after the base changes

- **WHEN** a single `PUT /currencies` request first makes a currency the base and then
  sends a later item for another currency with an explicit rate
- **THEN** the later item's rate is stored as sent, because items are applied in
  request order

#### Scenario: Creating a currency as the base

- **WHEN** USD is the base at rate 1 and EUR has rate 0.5, and a `POST /currencies`
  request creates GBP as the base with rate 0.25
- **THEN** GBP has rate 1 and is the only base
- **AND** USD has rate 4
- **AND** EUR has rate 2

#### Scenario: Creating the first currency as the base

- **WHEN** the store has no base currency and a currency is created as the base with
  any positive rate
- **THEN** that currency has rate 1

#### Scenario: Recalculation fails

- **WHEN** the base change fails part of the way through
- **THEN** no currency's base flag or exchange rate is changed

### Requirement: The base currency rate is always 1

The base currency's stored exchange rate SHALL be 1. A request that updates the
current base with a different rate SHALL still store 1 for it.

#### Scenario: Updating the base with another rate

- **WHEN** a `PUT /currencies` request updates the current base currency with rate 3
- **THEN** the response and the stored currency show rate 1
- **AND** the other currencies' rates do not change

### Requirement: Currency activation toggle

Each non-base currency row SHALL provide a toggle that activates or deactivates the
currency for storefront use. The base currency SHALL NOT be deactivatable.

#### Scenario: Toggling a currency

- **WHEN** the administrator flips a non-base currency's toggle
- **THEN** the currency's active state is persisted and the row reflects the new state

### Requirement: Row actions live in a three-dot menu behind confirmation

Each non-base currency row SHALL offer a three-dot (overflow) menu containing exactly
"Set as default" and "Delete". Selecting either SHALL open a confirmation dialog, and
the action SHALL run only when the administrator confirms. The base currency row SHALL
show no overflow menu. Deleting a currency SHALL NOT be blocked by products that exist
in the store, including products created while that currency was the base.

#### Scenario: Setting the base currency

- **WHEN** the administrator chooses "Set as default" on a non-base currency and
  confirms the dialog
- **THEN** that currency becomes the base currency and the previous base is demoted
- **AND** the list shows the new base at rate 1 and every other currency at its
  recalculated rate
- **AND** the update request contains only the row of the new base currency
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency

- **WHEN** the administrator chooses "Delete" on a non-base currency and confirms the
  dialog
- **THEN** the currency is removed and the list refreshes
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency that was previously the base

- **WHEN** the administrator switches the store's base currency, and then chooses
  "Delete" on the currency that was previously the base and confirms the dialog
- **THEN** that currency is removed even though products were created while it was the
  base
- **AND** those products keep their stored amounts, which are read in the store's
  current base currency

### Requirement: Currency write requests carry only currency fields

Requests that create or update currencies SHALL send only currency data fields
(identifier, name, code, symbol, exchange rate, base flag, active flag) and SHALL NOT
include presentation-only values derived for the list view.

#### Scenario: Update payload is clean

- **WHEN** any row action or inline edit triggers a currency update
- **THEN** the request body contains only currency data fields for the affected
  currency

### Requirement: Currency update reports total failure

When a bulk currency update is requested and every item fails, the API SHALL respond
with an error status (not a success status) and include the per-item error messages.
A partially successful update SHALL still succeed but SHALL include the error messages
for the failed items.

#### Scenario: All items fail

- **WHEN** a `PUT /currencies` request is made where no item can be updated
- **THEN** the response status is `422`
- **AND** the response body lists the failure reasons

#### Scenario: Some items fail

- **WHEN** a `PUT /currencies` request is made where some items update and others fail
- **THEN** the response is successful
- **AND** the response body includes the failure reasons for the failed items

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

### Requirement: Exactly one base currency exists

The store SHALL keep exactly one currency flagged as the base currency. Saving a currency as the base SHALL demote every other currency, whether or not the request names them and in whatever order rows arrive. A request that clears the flag on the current base without making another currency the base SHALL NOT leave the store without a base currency. A create request that flags more than one currency as base SHALL be rejected as invalid, and none of its currencies SHALL be inserted.

#### Scenario: Setting a new base with a single-row request

- **WHEN** a request sets one currency as base and does not mention the previous base
- **THEN** that currency is the base
- **AND** the previous base is no longer flagged as base

#### Scenario: Whole-list request, old base first

- **WHEN** the administrator sets a new default in the currency list and the request sends the previous base before the new base
- **THEN** exactly one currency is flagged as base afterwards, the new one

#### Scenario: Whole-list request, new base first

- **WHEN** the same request sends the new base before the previous base
- **THEN** exactly one currency is flagged as base afterwards, the new one

#### Scenario: Clearing the only base

- **WHEN** a request clears the base flag on the current base and no other currency in the request becomes the base
- **THEN** the current base remains the base

#### Scenario: Creating a currency as base

- **WHEN** a currency is created with the base flag while another currency is the base
- **THEN** the new currency is the only base

#### Scenario: Creating two base currencies in one request

- **WHEN** a create request flags two or more of its currencies as base
- **THEN** the request is rejected with a validation error
- **AND** none of its currencies is inserted and the existing base is unchanged
