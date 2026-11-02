## MODIFIED Requirements

### Requirement: A line item's subtotal reflects only that item's own product-scoped discount

A cart line item's subtotal SHALL be its
sale-or-regular price total reduced only by discounts scoped to that
specific item (a product-targeted coupon). It SHALL NOT be reduced by an
order-wide coupon's allocation to that item. The subtotal SHALL be in the
store's tax mode: it includes tax exactly when the store prices items
inclusive of tax, taken directly from the catalog prices.

#### Scenario: Item with its own coupon

- **WHEN** a line item has a product-targeted coupon applied to it
- **THEN** its subtotal is the sale-or-regular price total minus that
  coupon's discount on that item

#### Scenario: Item with only a sale price, no coupon

- **WHEN** a line item has a sale price but no product-targeted coupon
- **THEN** its subtotal is the sale price total

#### Scenario: Item unaffected by an order-wide coupon

- **WHEN** an order-wide coupon is applied to the cart and also allocates a
  discount to a line item for tax purposes
- **THEN** that line item's subtotal does not reflect the order-wide
  coupon's allocation

#### Scenario: Item unaffected by an order-wide coupon under tax-inclusive pricing

- **WHEN** the store prices items inclusive of 10% tax, a line item is
  priced at 110.00, and a 50% order-wide coupon is applied
- **THEN** that line item's subtotal is 110.00, the same as before the
  coupon was applied

### Requirement: A line item's strikethrough price shows its pre-discount baseline

A cart line item MAY expose a strikethrough price. When exposed, it SHALL
be the price basis before whichever discount currently reduces the item's
subtotal: when a product-targeted coupon reduces the item, the
strikethrough price SHALL be the sale-or-regular total before that coupon;
when no coupon applies but a sale price is active, the strikethrough price
SHALL be the regular price total; when neither applies, no strikethrough
price SHALL be exposed. The strikethrough price SHALL be in the same tax
mode as the item's subtotal, taken directly from the catalog prices.

#### Scenario: Coupon applied to the item

- **WHEN** a line item's subtotal is reduced by a product-targeted coupon
- **THEN** its strikethrough price is the sale-or-regular total before that
  coupon's discount

#### Scenario: Only a sale price is active

- **WHEN** a line item has a sale price lower than its regular price and no
  product-targeted coupon
- **THEN** its strikethrough price is the regular price total

#### Scenario: Neither a coupon nor a sale price applies

- **WHEN** a line item has no product-targeted coupon and no active sale
  price
- **THEN** no strikethrough price is exposed for that item

#### Scenario: Sale price under tax-inclusive pricing

- **WHEN** the store prices items inclusive of tax and a line item of
  quantity 2 has a catalog regular price of 120.00 and a catalog sale price
  of 99.00
- **THEN** its strikethrough price is 240.00 and its subtotal is 198.00

### Requirement: The root breakdown separates items subtotal, order discount, and order total

The pricing breakdown SHALL expose the sum of every item's own subtotal, the
order-wide discount, and an order total equal to the items subtotal minus
the order-wide discount - computed before shipping. All three figures SHALL
be in the store's tax mode, so under tax-inclusive pricing the order total
includes the items' tax and under tax-exclusive pricing it excludes it. The
cart payload SHALL expose the tax mode as an `is_tax_inclusive` flag.

#### Scenario: Order total excludes shipping and tax

- **WHEN** the store prices items exclusive of tax and a cart has a
  non-zero shipping charge and applicable tax
- **THEN** the order total equals the sum of item subtotals minus the
  order-wide discount, unaffected by the shipping charge or tax amount

#### Scenario: Order-wide coupon under tax-inclusive pricing

- **WHEN** the store prices items inclusive of 10% tax, the cart has one
  item priced at 110.00, and a 50% order-wide coupon is applied
- **THEN** the items subtotal is 110.00, the order discount is 55.00, and
  the order total is 55.00
