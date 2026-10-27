## RENAMED Requirements

- FROM: `### Requirement: Item and root subtotal figures expose both a tax-exclusive and a tax-inclusive amount`
- TO: `### Requirement: Item and root subtotal figures are exposed once, in the store's tax mode`
- FROM: `### Requirement: A calculated line item's strikethrough price expose both a tax-exclusive and a tax-inclusive amount`
- TO: `### Requirement: A calculated line item's strikethrough price is exposed once, in the store's tax mode`

## MODIFIED Requirements

### Requirement: Item and root subtotal figures are exposed once, in the store's tax mode

Every calculated line item's subtotal, and the root items-subtotal and order-total figures, SHALL be exposed as a single money object in the base currency, in the store's current tax mode. The payload SHALL expose that mode as an `is_tax_inclusive` flag. It SHALL NOT expose a tax-exclusive and a tax-inclusive variant of the same figure.

#### Scenario: Calculation priced under tax-exclusive pricing

- **WHEN** an admin prices a manual order under tax-exclusive pricing
- **THEN** `is_tax_inclusive` is false and each line item's subtotal money object excludes tax

#### Scenario: Calculation priced under tax-inclusive pricing

- **WHEN** an admin prices a manual order under tax-inclusive pricing
- **THEN** `is_tax_inclusive` is true and each line item's subtotal money object includes the tax portion of the item's price

#### Scenario: Root items-subtotal and order-total figures

- **WHEN** an admin views the calculation's root pricing breakdown
- **THEN** the items-subtotal and order-total figures are each one money object, in the same tax mode as the line item subtotals

### Requirement: A calculated line item's strikethrough price is exposed once, in the store's tax mode

When a calculated line item exposes a strikethrough price, it SHALL expose it as a single money object in the base currency, in the same tax mode as the item's subtotal, so the "was" price is directly comparable to the subtotal it is displayed alongside. It SHALL NOT expose a tax-exclusive and a tax-inclusive variant of the same figure.

#### Scenario: Strikethrough price shown alongside either subtotal figure

- **WHEN** a calculated line item exposes a strikethrough price
- **THEN** its strikethrough money object is in the same tax mode as the item's subtotal money object

### Requirement: The root breakdown separates items subtotal, order discount, and order total

The calculation payload SHALL expose the sum of every item's own subtotal
net of its product-scoped coupon share, the order-wide coupon discount, and
an order total equal to the items subtotal minus the order-wide discount,
computed before shipping and before any tax is added on top, matching the
`cart-pricing-breakdown` capability's root breakdown shape. All three
figures SHALL be in the store's current tax mode.

#### Scenario: Order total excludes shipping and tax

- **WHEN** a manual order calculation has a non-zero shipping charge and
  tax
- **THEN** the order total equals the sum of item subtotals minus the
  order-wide discount, unaffected by the shipping charge or tax amount

### Requirement: A calculated line item exposes a per-unit price derived from its line subtotal

Every calculated line item in the manual order calculation payload SHALL expose a per-unit price as a single money object in the base currency, in the store's current tax mode. The per-unit figure SHALL equal the line-subtotal figure the item exposes divided by the item's quantity, rounded up to the currency's minor unit. So, like the line subtotal, the per-unit price SHALL be net of only that item's own product-scoped coupon share.

#### Scenario: Line subtotal divides evenly

- **WHEN** a calculated line item has quantity 2 and a line subtotal of 70.00
- **THEN** its unit price is 35.00

#### Scenario: Line subtotal does not divide evenly

- **WHEN** a calculated line item has quantity 3 and a line subtotal of 10.00
- **THEN** its unit price is 3.34, rounded up, and its line subtotal is still 10.00

#### Scenario: Item discounted by a product-scoped coupon

- **WHEN** a calculated line item with quantity 2 and a pre-coupon line subtotal of 80.00 is discounted 10.00 by a product-targeted coupon
- **THEN** its unit price is 35.00, reflecting the coupon discount

#### Scenario: Item discounted only by an order-wide coupon

- **WHEN** a calculated line item is discounted only by an order-wide coupon's allocation
- **THEN** its unit price is unaffected by that allocation, the same as its line subtotal

### Requirement: A calculated line item exposes a per-unit strikethrough price derived from its line strikethrough price

Every calculated line item in the manual order calculation payload SHALL expose a per-unit strikethrough price as a single money object in the base currency, in the store's current tax mode. The per-unit strikethrough figure SHALL equal the line strikethrough figure divided by the item's quantity, rounded up to the currency's minor unit. A per-unit strikethrough figure SHALL be null exactly when the line strikethrough figure is null.

#### Scenario: Item on sale with no product-scoped coupon

- **WHEN** a calculated line item with quantity 2 is on sale, with a line strikethrough price of 100.00 (its regular-price total)
- **THEN** its unit strikethrough price is 50.00

#### Scenario: Item with nothing struck through

- **WHEN** a calculated line item is neither on sale nor discounted by a product-scoped coupon, so its line strikethrough figure is null
- **THEN** its unit strikethrough figure is null

#### Scenario: Unit strikethrough is comparable to unit price

- **WHEN** a calculated line item exposes a unit strikethrough price
- **THEN** it is in the same tax mode as the item's unit price, so the two are directly comparable
