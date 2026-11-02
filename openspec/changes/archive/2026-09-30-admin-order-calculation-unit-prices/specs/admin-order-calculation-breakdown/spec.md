## ADDED Requirements

### Requirement: A calculated line item exposes a per-unit price derived from its line subtotal

Every calculated line item in the manual order calculation payload SHALL expose a per-unit price as a tax-exclusive money object and a tax-inclusive money object, in the base currency, as flat sibling keys. Each per-unit figure SHALL equal the matching line-subtotal figure the item exposes divided by the item's quantity, rounded up to the currency's minor unit. So, like the line subtotal, the per-unit price SHALL be net of only that item's own product-scoped coupon share.

#### Scenario: Line subtotal divides evenly

- **WHEN** a calculated line item has quantity 2, a tax-exclusive line subtotal of 70.00 and a tax-inclusive line subtotal of 77.00
- **THEN** its tax-exclusive unit price is 35.00 and its tax-inclusive unit price is 38.50

#### Scenario: Line subtotal does not divide evenly

- **WHEN** a calculated line item has quantity 3 and a tax-exclusive line subtotal of 10.00
- **THEN** its tax-exclusive unit price is 3.34, rounded up, and its line subtotal is still 10.00

#### Scenario: Item discounted by a product-scoped coupon

- **WHEN** a calculated line item with quantity 2 and a pre-coupon line subtotal of 80.00 is discounted 10.00 by a product-targeted coupon
- **THEN** its tax-exclusive unit price is 35.00, reflecting the coupon discount

#### Scenario: Item discounted only by an order-wide coupon

- **WHEN** a calculated line item is discounted only by an order-wide coupon's allocation
- **THEN** its unit price is unaffected by that allocation, the same as its line subtotal

### Requirement: A calculated line item exposes a per-unit strikethrough price derived from its line strikethrough price

Every calculated line item in the manual order calculation payload SHALL expose a per-unit strikethrough price as a tax-exclusive money object and a tax-inclusive money object, in the base currency, as flat sibling keys. Each per-unit strikethrough figure SHALL equal the matching line strikethrough figure divided by the item's quantity, rounded up to the currency's minor unit. A per-unit strikethrough figure SHALL be null exactly when the matching line strikethrough figure is null.

#### Scenario: Item on sale with no product-scoped coupon

- **WHEN** a calculated line item with quantity 2 is on sale, with a tax-exclusive line strikethrough price of 100.00 (its regular-price total)
- **THEN** its tax-exclusive unit strikethrough price is 50.00

#### Scenario: Item with nothing struck through

- **WHEN** a calculated line item is neither on sale nor discounted by a product-scoped coupon, so its line strikethrough figures are null
- **THEN** both of its unit strikethrough figures are null

#### Scenario: Unit strikethrough is comparable to unit price

- **WHEN** a calculated line item exposes a unit strikethrough price
- **THEN** its tax-exclusive unit strikethrough figure is comparable to its tax-exclusive unit price, and its tax-inclusive unit strikethrough figure to its tax-inclusive unit price
