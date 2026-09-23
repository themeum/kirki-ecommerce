## ADDED Requirements

### Requirement: An order item's strikethrough price shows its pre-discount baseline

A storefront order item MAY expose a strikethrough price, in the order's invoiced currency, following the same rule as a cart line item under `cart-pricing-breakdown`. When exposed, it SHALL be the price basis before whichever discount currently reduces the item's subtotal: when an item-scoped ("product") coupon reduces the item, the strikethrough price SHALL be the item's invoiced total before that coupon; when no such coupon applies but the item was bought on sale, the strikethrough price SHALL be the regular unit price multiplied by the item's quantity; when neither applies, no strikethrough price SHALL be exposed. An order-wide coupon SHALL NOT cause a strikethrough price.

An item SHALL count as bought on sale only when its recorded base regular unit price is greater than its recorded base charged unit price.

#### Scenario: Product coupon applied to the item

- **WHEN** an order item's subtotal was reduced by an item-scoped coupon
- **THEN** its strikethrough price is its invoiced total before that coupon's discount, which is the sale-adjusted total if the item was also bought on sale

#### Scenario: Only a sale price was active

- **WHEN** an order item was bought at a sale price lower than its regular price and no item-scoped coupon reduced it
- **THEN** its strikethrough price is the regular unit price multiplied by its quantity

#### Scenario: Neither a coupon nor a sale price applied

- **WHEN** an order item has no item-scoped coupon and was not bought on sale
- **THEN** no strikethrough price is exposed for that item

#### Scenario: Only an order-wide coupon applied

- **WHEN** an order item's only discount is an attributed share of an order-wide coupon and it was not bought on sale
- **THEN** no strikethrough price is exposed for that item

#### Scenario: Pre-existing order with no recorded regular price

- **WHEN** a customer views an order whose items have no recorded regular price
- **THEN** none of its items expose a sale-based strikethrough price
- **AND** an item reduced by an item-scoped coupon still exposes its coupon-based strikethrough price
