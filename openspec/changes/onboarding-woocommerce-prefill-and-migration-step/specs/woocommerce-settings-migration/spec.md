## ADDED Requirements

### Requirement: Settings group scope
The WooCommerce Settings group SHALL migrate tax rates, shipping zones, weight and dimension units, checkout and account options, and inventory options that have a Kirki setting. It SHALL NOT change currency, store address or the tax switches.

#### Scenario: Store facts untouched
- **WHEN** the Settings group runs
- **THEN** currency, store address, tax collection and price mode are not read or written by it

#### Scenario: Units
- **WHEN** WooCommerce uses "lbs" and "in"
- **THEN** the Kirki weight and dimension units are set to the matching values, or a note reports that no match exists

#### Scenario: WooCommerce value replaces
- **WHEN** WooCommerce has a value for a setting and Kirki has a different value, preconfigured or chosen by the merchant
- **THEN** the Kirki setting is set to the WooCommerce value

#### Scenario: No WooCommerce value
- **WHEN** WooCommerce has no value for a setting
- **THEN** the Kirki preconfigured value stays

#### Scenario: Tax rates and shipping zones replace the list
- **WHEN** WooCommerce has tax rates or shipping zones
- **THEN** the Kirki list of that kind is cleared once and only the WooCommerce items remain
- **AND** if WooCommerce has none of that kind, the Kirki list stays

### Requirement: Shipping zone states
A shipping zone region that has a country and no state SHALL be saved with every state of that country selected. A country with no states SHALL keep an empty state list.

#### Scenario: WooCommerce zone with a country only
- **WHEN** a WooCommerce zone lists only the country "US"
- **THEN** the Kirki zone region for "US" holds all the US state ids

#### Scenario: Country without states
- **WHEN** a zone lists a country that has no states in Kirki
- **THEN** the region keeps an empty state list

### Requirement: Extra settings coverage
The Settings group SHALL also migrate the store email, selling countries, checkout phone and company requirement, the tax display setting, the price position and separators, the enabled state of the matching emails and stock alerts, and the email footer and colors, as listed in `design.md`. A value that Kirki cannot hold SHALL keep the Kirki value and add a note. Payment gateways, legal consents and email subjects SHALL NOT be migrated.

#### Scenario: Matching options
- **WHEN** WooCommerce has a sender address, "specific" allowed countries and "right_space" price position
- **THEN** Kirki gets that store email, the selling location type "selected-countries" with those countries, and the position "after"

#### Scenario: Hidden field
- **WHEN** the WooCommerce phone field is "hidden"
- **THEN** the Kirki value stays and a note reports it

### Requirement: Order number format
A migrated order SHALL get the order number prefix and suffix of the general settings. Its number SHALL be the WooCommerce order id, padded with zeros to 6 digits, between the prefix and the suffix. Migrated orders SHALL NOT get an invoice number.

#### Scenario: Prefix and suffix
- **WHEN** the general settings have prefix "KE-" and suffix "-W" and WooCommerce order 123 is migrated
- **THEN** the Kirki order number is "KE-000123-W"

#### Scenario: No prefix or suffix
- **WHEN** the general settings have no prefix and no suffix and WooCommerce order 123 is migrated
- **THEN** the Kirki order number is "000123"

### Requirement: Revert of settings
A revert SHALL restore the previous value of each setting the group changed.

#### Scenario: Revert
- **WHEN** a run is reverted
- **THEN** units, checkout options, general, currency, tax and email values, tax regions and shipping zones return to their old values
