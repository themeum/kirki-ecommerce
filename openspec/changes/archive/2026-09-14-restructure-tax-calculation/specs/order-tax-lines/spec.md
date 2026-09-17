## Purpose

Defines how tax is recorded on an order: one row per tax line, scoped to
either a specific order item or the order's shipping charge, so an order can
carry more than one simultaneous tax rate on a line and the shipping charge's
tax is preserved instead of being merged away into a single total.

## ADDED Requirements

### Requirement: Every tax line is its own record, scoped to an item, to an item's share of shipping, or to shipping as a whole

The system SHALL persist each tax line an order accrues as its own record,
scoped by an item reference. A line taxing an order item is scoped to that
item. A line taxing the order's shipping charge is scoped to the item whose
share of the shipping charge it represents, when the shipping tax was split
proportionally across the cart's items; it carries no item reference when the
shipping tax applies to the order's shipping as a whole rather than being
split. An order item MAY carry more than one tax line. The order's shipping
charge MAY carry more than one tax line, whether split per item or not.

#### Scenario: An item taxed at a single rate

- **WHEN** an order item is taxed by one applicable rate
- **THEN** exactly one tax line is recorded for that item, carrying the rate
  and the computed amount

#### Scenario: An item taxed by more than one simultaneous rate

- **WHEN** an order item is subject to more than one tax at once (e.g. two
  components of a combined rate)
- **THEN** one tax line is recorded per component, each scoped to that item

#### Scenario: Shipping tax split proportionally across items

- **WHEN** the order's shipping charge is taxed by splitting it proportionally
  across the cart's items (e.g. EU shipping tax following the goods' VAT
  rates)
- **THEN** one tax line is recorded per item that received a share of the
  shipping charge, each scoped to that item, even when two such lines carry
  the same rate

#### Scenario: Shipping taxed by a single flat rate, not split

- **WHEN** the order's shipping charge is taxed by one rate applied to the
  whole shipping charge, not split across items
- **THEN** exactly one tax line is recorded for the order's shipping, scoped
  to no item

#### Scenario: Untaxed item or shipping

- **WHEN** an order item or the order's shipping charge is not taxed
- **THEN** no tax line is recorded for it

### Requirement: Cached tax totals stay in sync with recorded tax lines

An order item's cached tax total SHALL equal the sum of that item's tax
lines. The order's cached shipping tax total SHALL equal the sum of the
order's shipping-scoped tax lines. The order's cached overall tax total
SHALL equal the sum of every tax line on the order — items and shipping
combined.

#### Scenario: Item's cached total matches its lines

- **WHEN** an order item has two tax lines of 500 and 300 minor units
- **THEN** that item's cached tax total is 800 minor units

#### Scenario: Order's cached shipping tax total matches shipping lines

- **WHEN** an order's shipping charge has tax lines totaling 250 minor units
- **THEN** the order's cached shipping tax total is 250 minor units

#### Scenario: Order's cached overall tax total combines items and shipping

- **WHEN** an order's items carry 800 minor units of tax in total and its
  shipping carries 250
- **THEN** the order's cached overall tax total is 1050 minor units

### Requirement: An order item no longer carries a merged rate or an embedded tax breakdown

An order item SHALL NOT store a single merged tax rate or an embedded
breakdown of its tax composition. Any breakdown of an item's tax, or of the
order's shipping tax, SHALL be read from that item's or that order's
recorded tax lines.

#### Scenario: Reading an item's tax breakdown

- **WHEN** an order item's tax composition is requested
- **THEN** it is read from that item's recorded tax lines, not from a single
  stored rate or an embedded breakdown on the order item

### Requirement: Orders created before this change keep their cached totals but lose their itemized breakdown

An order created before this change SHALL have no recorded tax lines — this
change does not convert historical orders. That order's cached tax totals
(item-level and order-level) SHALL remain readable and correct, since those
totals are not derived from tax lines for a pre-existing order. The per-line
rate/breakdown detail such an order previously exposed is not preserved.

#### Scenario: Reading a pre-existing order

- **WHEN** an order created before this change is read
- **THEN** its cached tax totals (item-level and order-level) are still
  present and correct
- **AND** no tax lines exist for that order
- **AND** no per-line rate or breakdown detail is available for it
