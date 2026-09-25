## ADDED Requirements

### Requirement: Item and root subtotal figures expose both a tax-exclusive and a tax-inclusive amount

Every order item's subtotal, and the root items-subtotal and order-total figures, SHALL expose both a tax-exclusive money object and a tax-inclusive money object, for both the invoiced-currency and base-currency amounts, as flat sibling keys. It SHALL NOT expose a single subtotal money object whose tax treatment is ambiguous.

#### Scenario: Order placed under tax-exclusive pricing

- **WHEN** a merchant views an order item whose price was calculated under tax-exclusive pricing
- **THEN** the item's tax-exclusive subtotal money object equals its charged subtotal, and its tax-inclusive subtotal money object equals that amount plus the item's own tax total

#### Scenario: Order placed under tax-inclusive pricing

- **WHEN** a merchant views an order item whose price was calculated under tax-inclusive pricing
- **THEN** the item's tax-exclusive subtotal money object excludes the tax portion of the item's price, and its tax-inclusive subtotal money object includes it

#### Scenario: Root items-subtotal and order-total figures

- **WHEN** a merchant views an order's root pricing breakdown
- **THEN** the items-subtotal and order-total figures each expose both a tax-exclusive and a tax-inclusive money object, for the invoiced and base currency

### Requirement: An order item's strikethrough price expose both a tax-exclusive and a tax-inclusive amount

When an order item exposes a strikethrough price, it SHALL expose both a tax-exclusive money object and a tax-inclusive money object, for both the invoiced-currency and base-currency amounts, as flat sibling keys — matching the tax treatment of its subtotal, so the "was" price is comparable to whichever of the item's subtotal figures it is displayed alongside.

#### Scenario: Strikethrough price shown alongside either subtotal figure

- **WHEN** an order item exposes a strikethrough price
- **THEN** its tax-exclusive strikethrough money object is comparable to the item's tax-exclusive subtotal, and its tax-inclusive strikethrough money object is comparable to the item's tax-inclusive subtotal
