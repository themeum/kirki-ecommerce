## Purpose

Defines how a merchant sets up sales tax: the regions where tax is collected, the
product and shipping tax rates and conditional rules that apply within each
region, what each region form requires before it can be saved, what is persisted,
and how a shopper's checkout address is matched to a region, a rate, and a rule
set.

## ADDED Requirements

### Requirement: A tax region is added by choosing a country

The merchant SHALL add a tax region by selecting one country (or the European
Union as a single region). The add flow SHALL NOT ask the merchant to pick
states or provinces. A country that already has a tax region SHALL NOT be
offered again.

#### Scenario: Adding a country

- **WHEN** the merchant opens the add-region control and selects a country
- **THEN** a tax region for that country is created, enabled, and configured to
  collect one rate for the entire country
- **AND** the merchant is not asked to choose states during the add flow

#### Scenario: Country already added

- **WHEN** a country already has a tax region
- **THEN** that country is not offered in the add-region control

#### Scenario: Adding the European Union

- **WHEN** the merchant selects the European Union in the add-region control
- **THEN** a single EU tax region is created that collects VAT per member country

### Requirement: A general region collects either one country-wide rate or per-state rates

A general (non-EU) tax region SHALL be in exactly one of two modes: a single rate
applied to the whole country, or a distinct rate per state. The merchant SHALL
switch between modes with a single "apply one rate for the entire country"
control. Switching to country-wide mode SHALL discard any per-state
configuration; switching to per-state mode SHALL start with no states.

#### Scenario: Newly added region

- **WHEN** a general region has just been added
- **THEN** it is in country-wide mode with an empty product rate and an empty
  shipping rate

#### Scenario: Switching to per-state mode

- **WHEN** the merchant turns off "apply one rate for the entire country"
- **THEN** the region has no states and the merchant is prompted to add at least
  one before the region can be saved

#### Scenario: Switching back to country-wide mode

- **WHEN** the merchant turns "apply one rate for the entire country" back on
- **THEN** any per-state states and rates that were configured are discarded

### Requirement: Country-wide mode requires a product rate and a shipping rate

When a general region collects one rate for the whole country, the region form
SHALL block the save unless both a product tax rate and a shipping tax rate are
supplied as numbers. Each failure MUST be reported on the offending field. This
is a form-level check; see "The settings API validates field types, not region
completeness".

#### Scenario: Saving with a missing country-wide rate

- **WHEN** the merchant saves a country-wide region with the product rate or the
  shipping rate left blank
- **THEN** the save is blocked and the blank rate field displays its required
  message

#### Scenario: Saving with both country-wide rates

- **WHEN** the merchant saves a country-wide region with a numeric product rate
  and a numeric shipping rate
- **THEN** the region is persisted and the form is no longer reported as having
  unsaved changes

### Requirement: Per-state mode requires at least one state, each with both rates

When a general region collects rates per state, the region form SHALL block the
save while the region has zero states, and while any state is missing its product
tax rate or its shipping tax rate. Rates are entered as numbers. This is a
form-level check; see "The settings API validates field types, not region
completeness".

#### Scenario: Saving per-state mode with no states

- **WHEN** the merchant saves a per-state region that has no states
- **THEN** the save is blocked and the states area displays its required message

#### Scenario: Saving with a state missing a rate

- **WHEN** the merchant saves a per-state region where a state has a product rate
  but no shipping rate
- **THEN** the save is blocked and that state's blank rate field displays its
  required message

#### Scenario: Saving with every state fully rated

- **WHEN** every state in the region has a numeric product rate and a numeric
  shipping rate
- **THEN** the region is persisted

### Requirement: Each state is configured on its own page

In per-state mode the region SHALL present one row per state showing the state's
name and its current product and shipping rates. Opening a row SHALL navigate to
a page dedicated to that state, which SHALL expose a Product tax rate field, a
Shipping tax rate field, and that state's tax rules. Leaving that page SHALL
return to the region. The state SHALL be shown by name but is not identified by
name internally.

#### Scenario: Opening a state row

- **WHEN** the merchant clicks a state row in the region's per-state list
- **THEN** the merchant is taken to that state's page, showing its Product tax
  rate field, its Shipping tax rate field, and its tax rules section

#### Scenario: Row summary in the region list

- **WHEN** the region is in per-state mode
- **THEN** each state row shows the state's name and its current product and
  shipping rates

#### Scenario: Returning to the region

- **WHEN** the merchant leaves a state's page
- **THEN** the region page is shown with every configured state listed

### Requirement: Tax rules are configured country-wide or per state

A general region SHALL configure conditional tax rules in exactly one place,
matching its rate mode. In country-wide mode the region SHALL present a single
region-level tax rules section. In per-state mode that region-level section SHALL
NOT be shown; each state's rules SHALL be configured on that state's page.
Switching from per-state mode to country-wide mode SHALL NOT discard the
region-level rules, so the switch is reversible.

#### Scenario: Country-wide region shows one rules section

- **WHEN** a general region is in country-wide mode
- **THEN** the region page shows one tax rules section that applies to the whole
  country

#### Scenario: Per-state region hides the region-level rules section

- **WHEN** a general region is in per-state mode
- **THEN** the region page shows no region-level tax rules section
- **AND** each state's rules are configured on that state's page

#### Scenario: Toggling modes preserves the region-level rules

- **WHEN** the merchant switches a region to per-state mode and later back to
  country-wide mode
- **THEN** the region-level tax rules that were configured before are still there

### Requirement: Adding states seeds zero rates and opens the first new state

Adding one or more states to a per-state region SHALL create a rate row for each,
with a product rate and a shipping rate of zero, and SHALL then take the merchant
to the first newly added state's page. A state that already has a row SHALL be
shown in the add-states control as disabled ("already in use"), not hidden.
Removing a state SHALL remove its product rate, its shipping rate, and its rules.

#### Scenario: Adding states

- **WHEN** the merchant picks two states from the add-states control
- **THEN** each is added with a zero product rate and a zero shipping rate
- **AND** the merchant is taken to the first of the two states' pages

#### Scenario: Add-states control disables states already added

- **WHEN** the merchant opens the add-states control
- **THEN** states that already have a row are shown disabled and cannot be picked

#### Scenario: Removing a state

- **WHEN** the merchant removes a state row
- **THEN** that state's product rate, shipping rate, and rules are gone and the
  state can be added again

### Requirement: The EU region collects VAT per member country

The EU region SHALL persist a product tax rate and a shipping tax rate for each
member country it collects VAT in, identified by the member country's code. The
EU region form SHALL block the save with no member country configured, and while
a configured country is missing either rate — a form-level check; see "The
settings API validates field types, not region completeness".

#### Scenario: Configuring a member country

- **WHEN** the merchant adds a member country to the EU region with a numeric
  product rate and a numeric shipping rate
- **THEN** that country's rates are persisted against its country code

#### Scenario: Saving the EU region with no member country

- **WHEN** the merchant saves an EU region that has no member country configured
- **THEN** the save is blocked

### Requirement: Regions and rates are persisted by code and id, with display names kept alongside

A tax region SHALL be persisted identified by its country code (or the literal
`EU`), and a per-state rate by the state's id, an EU per-country VAT rate by the
member country's code — never by name. The region's display name and flag, and
each state's or member country's display name and flag, MAY also be persisted as
convenience copies; they SHALL NOT be used to match a shopper to a region, a
rate, or a rule — the code or id is authoritative and the display copy is
refreshed from the country dataset whenever the code is known.

#### Scenario: Persisted general region

- **WHEN** a general region with per-state rates is saved
- **THEN** the stored region carries the country code, and each stored state
  carries its id, a numeric product rate, a numeric shipping rate, and its rules
- **AND** any stored display name or flag is treated as a refreshable copy, never
  a match key

#### Scenario: Persisted country-wide region

- **WHEN** a country-wide region is saved
- **THEN** the stored region carries the country-wide product and shipping rates
  and no per-state states

#### Scenario: Persisted EU region

- **WHEN** the EU region is saved
- **THEN** each stored member country carries its country code and both numeric
  rates

### Requirement: Checkout matches a shopper to a region, rate, and rule set by address

At checkout the system SHALL match the shopper's shipping address to an enabled
tax region by country (EU member countries resolving to the EU region). Within a
matched general region: in country-wide mode the country-wide rates and the
region-level rules apply; in per-state mode the state whose stored id equals the
address's state supplies the rates and the rules, a state with no configured rate
is taxed at zero, and the region-level rules do NOT apply. Within the matched EU
region the member country whose code equals the address's country supplies the
rates, and the region-level rules apply. A disabled region SHALL NOT match.

#### Scenario: Per-state match

- **WHEN** a shopper's address country has an enabled per-state region and the
  address's state matches a configured state
- **THEN** that state's product and shipping rates are used, and that state's
  rules are evaluated

#### Scenario: Per-state address with no configured rate

- **WHEN** a shopper's address state has no configured rate in the matched region
- **THEN** product and shipping tax for that shopper are zero

#### Scenario: Country-wide match

- **WHEN** a shopper's address country has an enabled country-wide region
- **THEN** the region's country-wide product and shipping rates are used and the
  region-level rules are evaluated, regardless of the address's state

#### Scenario: EU member country match

- **WHEN** a shopper's address country is an EU member with a configured rate in
  the EU region
- **THEN** that member country's product and shipping rates are used and the EU
  region-level rules are evaluated

#### Scenario: Region disabled

- **WHEN** the region matching a shopper's country is disabled
- **THEN** no region tax applies to that shopper

### Requirement: A region can be enabled or disabled without losing its configuration

The merchant SHALL be able to toggle a tax region between enabled and disabled
from the region list. Disabling SHALL preserve the region's configured rates and
rules for when it is re-enabled.

#### Scenario: Disabling a region

- **WHEN** the merchant disables a region from the list
- **THEN** the region stops applying at checkout and is shown as inactive, with
  its rates and rules retained

#### Scenario: Re-enabling a region

- **WHEN** the merchant re-enables a previously disabled region
- **THEN** its previously configured rates and rules apply again with no re-entry
