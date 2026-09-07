## MODIFIED Requirements

### Requirement: The EU region collects VAT per member country

The EU region SHALL persist a single VAT rate for each member country it collects
VAT in, identified by the member country's code. That one rate SHALL apply to
both product tax and shipping tax for that country. The rate is entered as a
number. The EU region form SHALL block the save with no member country
configured, and while a configured member country is missing its rate — a
form-level check; see "The settings API validates field types, not region
completeness".

#### Scenario: Configuring a member country

- **WHEN** the merchant adds a member country to the EU region with a numeric VAT
  rate
- **THEN** that rate is persisted against the member country's code and is used
  for both product tax and shipping tax in that country

#### Scenario: Saving the EU region with a member country missing its rate

- **WHEN** the merchant saves an EU region where a configured member country has a
  blank VAT rate
- **THEN** the save is blocked and the blank rate field displays its required
  message

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
- **THEN** each stored member country carries its country code and a single
  numeric VAT rate

### Requirement: Checkout matches a shopper to a region, rate, and rule set by address

At checkout the system SHALL match the shopper's shipping address to an enabled
tax region by country (EU member countries resolving to the EU region). Within a
matched general region: in country-wide mode the country-wide rates and the
region-level rules apply; in per-state mode the state whose stored id equals the
address's state supplies the rates and the rules, a state with no configured rate
is taxed at zero, and the region-level rules do NOT apply. Within the matched EU
region the member country whose code equals the address's country supplies a
single VAT rate that is applied to both product tax and shipping tax, and the
region-level rules apply. A disabled region SHALL NOT match.

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
- **THEN** that member country's single VAT rate is applied to both product tax
  and shipping tax, and the EU region-level rules are evaluated

#### Scenario: Region disabled

- **WHEN** the region matching a shopper's country is disabled
- **THEN** no region tax applies to that shopper
