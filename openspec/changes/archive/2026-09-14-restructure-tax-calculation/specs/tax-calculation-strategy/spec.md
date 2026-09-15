## Purpose

Defines the contract every country's tax calculation must satisfy: given a
cart's items, shipping charge, and addresses, produce every tax line that
applies — for each item and for shipping — in one pass, so a country's
entire tax behavior (how many lines apply, how shipping tax relates to item
tax) is fully decided by that country's own logic and adding a new country
never requires changing an existing one.

## ADDED Requirements

### Requirement: One calculation produces every tax line for the whole cart

Calculating tax for a cart SHALL be one operation, given the cart's taxable
items (amount, quantity-independent taxable base, category/profile
identifiers), its shipping charge, and its shipping and billing addresses,
and SHALL return the tax lines for every item and for the shipping charge
together. No part of the system SHALL calculate an item's tax without also
having access to the rest of the cart and the shipping charge in the same
operation.

#### Scenario: Calculating tax for a cart

- **WHEN** tax is calculated for a cart containing multiple items and a
  shipping charge
- **THEN** the result contains the tax lines for every item and the tax
  lines for the shipping charge, produced by one calculation

#### Scenario: A country strategy needs the item mix to tax shipping

- **WHEN** the country resolved for the cart's address ties shipping tax to
  the tax rates present among the cart's items
- **THEN** that determination is possible because the calculation already
  has every item's tax outcome available when it produces the shipping tax
  lines

### Requirement: A country's tax logic decides its own line count, independent of other countries

The number and composition of tax lines produced for an item or for
shipping SHALL be decided entirely by the tax logic resolved for the
cart's address. Adding or changing a country's tax behavior (including how
many simultaneous lines it applies to an item, or how it derives shipping
tax from the item mix) SHALL NOT require changing the tax logic of any
other country.

#### Scenario: One country applies a single rate

- **WHEN** the resolved country's tax applies one rate per item and one flat
  rate to shipping
- **THEN** each item and the shipping charge each produce exactly one tax
  line

#### Scenario: Another country applies multiple simultaneous rates

- **WHEN** the resolved country's tax applies more than one rate to an item
  at once
- **THEN** that item produces one tax line per applicable rate, without any
  other country's tax logic being affected

#### Scenario: A country splits shipping tax across the item tax mix

- **WHEN** the resolved country's tax derives shipping tax from the
  distribution of tax rates among the cart's items rather than a single
  configured shipping rate
- **THEN** the shipping charge produces one tax line per item, each
  proportioned to that item's share of the cart's taxable value and taxed at
  that item's own rate, so two items sharing a rate still produce two lines
  rather than one merged line

### Requirement: Tax-inclusive and tax-exclusive pricing are both supported per line

Every tax line SHALL be computable either as an amount added on top of a
taxable base (tax-exclusive) or as an amount extracted from a
tax-inclusive base, according to the store's pricing setting, and this
SHALL apply uniformly to item lines and shipping lines.

#### Scenario: Tax-exclusive pricing

- **WHEN** the store prices items exclusive of tax
- **THEN** each tax line's amount is computed as additional to the item's or
  shipping's base amount

#### Scenario: Tax-inclusive pricing

- **WHEN** the store prices items inclusive of tax
- **THEN** each tax line's amount is computed as extracted from the item's
  or shipping's base amount, not added on top of it
