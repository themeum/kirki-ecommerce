## MODIFIED Requirements

### Requirement: Shipping zones follow the store's country

The system SHALL create shipping zones in this order, each enabled:

1. The home-country zones. By default, this is one Domestic zone whose only
   destination is the store's country. When the country entry in the preset
   data defines domestic zones, the system SHALL create one zone for each of
   them, in the order of the preset data, in place of the Domestic zone. Each
   such zone SHALL have the title from the preset data. Its destination SHALL
   be the store's country with either only the listed states, or every state
   of the country except the listed states.
2. A Regional zone, only when the country belongs to a trade bloc in the preset
   data. Its destinations SHALL be the other members of that bloc.

No zone SHALL be created for the rest of the world. Every zone SHALL have a
title and at least one destination, so that the merchant can open and save it
without changes.

Industry shipping rules that target the domestic zone kind SHALL apply to every
home-country zone.

#### Scenario: Country in a trade bloc

- **WHEN** presets are applied with country "DE"
- **THEN** two zones exist in order: Domestic with destination "DE", and Regional with the other 26 EU member countries

#### Scenario: Country with no trade bloc

- **WHEN** presets are applied with a country that belongs to no trade bloc and defines no domestic zones, or that has no entry
- **THEN** only the Domestic zone exists

#### Scenario: Bangladesh is split at Dhaka

- **WHEN** presets are applied with country "BD"
- **THEN** two zones exist in order: "Inside Dhaka" with destination "BD" and only the state Dhaka, and "Outside Dhaka" with destination "BD" and every other Bangladesh state

#### Scenario: Shopper in Dhaka

- **WHEN** presets were applied with country "BD" and a shopper with a shipping address in the state Dhaka reaches checkout
- **THEN** the "Inside Dhaka" zone's methods are offered

#### Scenario: Shopper outside Dhaka

- **WHEN** presets were applied with country "BD" and a shopper with a shipping address in another Bangladesh state reaches checkout
- **THEN** the "Outside Dhaka" zone's methods are offered

#### Scenario: Domestic rule applies to every home-country zone

- **WHEN** presets are applied with country "BD" and an industry whose entry has a rule for the domestic zone kind
- **THEN** that rule is on the matching methods of both "Inside Dhaka" and "Outside Dhaka"

#### Scenario: Shopper in the home country

- **WHEN** a shopper with a shipping address in the store's country reaches checkout
- **THEN** the methods of the home-country zone that holds the address are offered

### Requirement: Shipping method amounts apply only in the matching currency

Each preset zone SHALL receive the shipping methods its country entry defines
for that zone, or the generic method set when the country has no method data.
A method amount is in the country's local currency. When the store's base
currency is that currency, the methods SHALL be created enabled with those
amounts. When the store's base currency is different, or the country has no
method data, the methods SHALL be created disabled with a rate of zero, so that
no wrong amount is charged.

#### Scenario: Base currency matches the country's currency

- **WHEN** presets are applied with country "GB" and currency "GBP"
- **THEN** the Domestic zone's methods are enabled with the amounts from the "GB" entry

#### Scenario: Base currency differs from the country's currency

- **WHEN** presets are applied with country "GB" and currency "USD"
- **THEN** the Domestic zone has the same methods as the "GB" entry, each disabled with a rate of zero

#### Scenario: Bangladesh zones in taka

- **WHEN** presets are applied with country "BD" and currency "BDT"
- **THEN** "Inside Dhaka" has one method, "Inside Dhaka" ৳120, enabled; and "Outside Dhaka" has one method, "Outside Dhaka" ৳180, enabled

#### Scenario: Bangladesh zones in another currency

- **WHEN** presets are applied with country "BD" and currency "USD"
- **THEN** both Bangladesh zones have their methods from the "BD" entry, each disabled, and each flat-rate method has a rate of zero

#### Scenario: Home setup checklist

- **WHEN** the presets created at least one enabled method in an enabled zone
- **THEN** the Home shipping step shows as preconfigured and waits for the merchant to confirm it
