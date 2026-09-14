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
show no overflow menu.

#### Scenario: Setting the base currency

- **WHEN** the administrator chooses "Set as default" on a non-base currency and
  confirms the dialog
- **THEN** that currency becomes the base currency and the previous base is demoted
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency

- **WHEN** the administrator chooses "Delete" on a non-base currency and confirms the
  dialog
- **THEN** the currency is removed and the list refreshes
- **AND** dismissing the dialog makes no change

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
sync timestamp and, where the provider reports it, API usage.

#### Scenario: Successful sync

- **WHEN** a provider and API key are configured and the administrator triggers a sync
- **THEN** each currency's exchange rate is updated from the provider
- **AND** the last-sync timestamp is recorded
- **AND** the currency list and its "Last synced" indicator refresh

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

### Requirement: Exchange rate provider is configurable, automatic updates stay off

The administrator SHALL be able to select an exchange-rate provider and enter its API
key, update frequency and fallback behaviour, and save them with the rest of the
currency settings. The "automatic updates" toggle SHALL remain disabled and no
scheduled sync SHALL run as part of this capability.

#### Scenario: Saving provider configuration

- **WHEN** the administrator selects a provider, enters an API key, and saves the
  Currency settings page
- **THEN** the provider and its configuration are persisted
- **AND** the "Sync now" control becomes available

#### Scenario: Automatic updates unavailable

- **WHEN** the administrator views the automatic-updates section
- **THEN** the automatic-updates toggle is disabled and cannot be enabled

### Requirement: Last synced indicator

The available-currencies panel SHALL show a "Last synced" indicator whenever a
provider is configured and a last-sync timestamp exists, independent of the
automatic-updates toggle.

#### Scenario: Indicator shown after a sync

- **WHEN** a provider is configured and at least one sync has completed
- **THEN** the panel shows when rates were last synced

#### Scenario: Indicator hidden without a sync

- **WHEN** no provider is configured or no sync has ever completed
- **THEN** the panel shows no "Last synced" time
