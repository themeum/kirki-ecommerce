## MODIFIED Requirements

### Requirement: The calculation payload exposes only base-currency amounts

The manual order calculation payload SHALL expose every monetary figure only as the store's base-currency amount, as a money object. It SHALL NOT expose a display-currency conversion, since this payload is used only in the admin order create/recalculate screen, which prices in the store's base currency. It SHALL NOT expose a bare scalar amount key alongside a money object for the same figure.

#### Scenario: Manual order priced by an admin

- **WHEN** an admin prices a manual order
- **THEN** every monetary figure in the payload carries only its base-currency money object, with no display-currency figure alongside it

#### Scenario: A monetary figure never exposes a bare scalar

- **WHEN** any monetary figure is rendered in the payload
- **THEN** it appears only as a money object, with no separate bare numeric key duplicating that same amount

### Requirement: Available shipping methods expose only a base-currency money object for their cost

Each available shipping method in the calculation payload SHALL expose its cost as a base-currency money object only, with no bare scalar cost key and no display-currency figure.

#### Scenario: Shipping method cost rendered

- **WHEN** the calculation payload lists an available shipping method
- **THEN** that method's cost appears only as its base-currency money object, with no separate bare numeric cost key and no display-currency figure

## ADDED Requirements

### Requirement: Item and root subtotal figures expose both a tax-exclusive and a tax-inclusive amount

Every calculated line item's subtotal, and the root items-subtotal and order-total figures, SHALL expose both a tax-exclusive money object and a tax-inclusive money object, in the base currency, as flat sibling keys. It SHALL NOT expose a single subtotal money object whose tax treatment is ambiguous.

#### Scenario: Calculation priced under tax-exclusive pricing

- **WHEN** an admin prices a manual order under tax-exclusive pricing
- **THEN** each line item's tax-exclusive subtotal money object equals its charged subtotal, and its tax-inclusive subtotal money object equals that amount plus the item's own tax total

#### Scenario: Calculation priced under tax-inclusive pricing

- **WHEN** an admin prices a manual order under tax-inclusive pricing
- **THEN** each line item's tax-exclusive subtotal money object excludes the tax portion of the item's price, and its tax-inclusive subtotal money object includes it

#### Scenario: Root items-subtotal and order-total figures

- **WHEN** an admin views the calculation's root pricing breakdown
- **THEN** the items-subtotal and order-total figures each expose both a tax-exclusive and a tax-inclusive money object

### Requirement: A calculated line item's strikethrough price expose both a tax-exclusive and a tax-inclusive amount

When a calculated line item exposes a strikethrough price, it SHALL expose both a tax-exclusive money object and a tax-inclusive money object, in the base currency, as flat sibling keys — matching the tax treatment of its subtotal, so the "was" price is comparable to whichever of the item's subtotal figures it is displayed alongside.

#### Scenario: Strikethrough price shown alongside either subtotal figure

- **WHEN** a calculated line item exposes a strikethrough price
- **THEN** its tax-exclusive strikethrough money object is comparable to the item's tax-exclusive subtotal, and its tax-inclusive strikethrough money object is comparable to the item's tax-inclusive subtotal
