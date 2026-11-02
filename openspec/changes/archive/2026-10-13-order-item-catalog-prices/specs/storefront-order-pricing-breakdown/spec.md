## MODIFIED Requirements

### Requirement: The root breakdown mirrors the cart's items-subtotal/order-discount/order-total split

The storefront order payload SHALL expose a root pricing breakdown with the
sum of every item's own invoiced subtotal, the order-wide coupon discount,
and an order total equal to the items subtotal minus the order-wide
discount, computed before shipping - matching the
`cart-pricing-breakdown` capability's root breakdown shape. All three
figures SHALL be in the tax mode recorded on the order, which the payload
SHALL expose as an `is_inclusive_tax` flag.

#### Scenario: Order total excludes shipping and tax

- **WHEN** an order placed under tax-exclusive pricing has a non-zero
  shipping charge and tax
- **THEN** the order's root order-total figure equals the sum of item
  subtotals minus the order-wide discount, unaffected by the shipping
  charge or tax amount

#### Scenario: Order-wide coupon under tax-inclusive pricing

- **WHEN** an order placed under tax-inclusive pricing has one item priced
  at 110.00 including 10% tax and a 50% order-wide coupon
- **THEN** the items subtotal is 110.00, the order discount is 55.00, and
  the order total is 55.00

### Requirement: An order item's invoiced subtotal reflects only that item's own product-scoped coupon share

An order item's invoiced subtotal SHALL be its invoiced catalog
product-coupon-discounted subtotal: its invoiced catalog sale price total
reduced only by discount attributed to that item from an item-scoped
("product") coupon, in the tax mode recorded on the order. It SHALL NOT be
reduced by an order-wide coupon's attributed share of that item.

#### Scenario: Item discounted by both an item-scoped and an order-wide coupon

- **WHEN** an order item was discounted by both a product-targeted coupon
  and has an attributed share of an order-wide coupon's discount
- **THEN** the item's invoiced subtotal is reduced only by the
  product-targeted coupon's attributed amount, and the order-wide coupon's
  share appears only in the root-level order discount

#### Scenario: Order-wide coupon under tax-inclusive pricing

- **WHEN** an order placed under tax-inclusive pricing has an item priced
  at 110.00 including tax and an order-wide coupon
- **THEN** the item's invoiced subtotal is 110.00, the same as without the
  coupon

### Requirement: An order item's strikethrough price shows its pre-discount baseline

A storefront order item MAY expose a strikethrough price, in the order's invoiced currency and the tax mode recorded on the order, following the same rule as a cart line item under `cart-pricing-breakdown`. When exposed, it SHALL be the price basis before whichever discount currently reduces the item's subtotal: when an item-scoped ("product") coupon reduces the item, the strikethrough price SHALL be the item's invoiced catalog sale price multiplied by its quantity; when no such coupon applies but the item was bought on sale, the strikethrough price SHALL be the invoiced catalog regular price multiplied by the item's quantity; when neither applies, no strikethrough price SHALL be exposed. An order-wide coupon SHALL NOT cause a strikethrough price.

An item SHALL count as reduced by an item-scoped coupon only when its catalog product-coupon-discounted subtotal is less than its catalog sale price multiplied by its quantity. An item SHALL count as bought on sale only when its recorded base catalog regular price is greater than its recorded base catalog sale price.

#### Scenario: Product coupon applied to the item

- **WHEN** an order item's subtotal was reduced by an item-scoped coupon
- **THEN** its strikethrough price is its invoiced catalog sale price multiplied by its quantity, which is the sale-adjusted total if the item was also bought on sale

#### Scenario: Only a sale price was active

- **WHEN** an order item was bought at a sale price lower than its regular price and no item-scoped coupon reduced it
- **THEN** its strikethrough price is the invoiced catalog regular price multiplied by its quantity

#### Scenario: Neither a coupon nor a sale price applied

- **WHEN** an order item has no item-scoped coupon and was not bought on sale
- **THEN** no strikethrough price is exposed for that item

#### Scenario: Only an order-wide coupon applied

- **WHEN** an order item's only discount is an attributed share of an order-wide coupon and it was not bought on sale
- **THEN** no strikethrough price is exposed for that item
