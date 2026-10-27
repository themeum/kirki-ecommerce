## Purpose

Gives storefront checkout surfaces enough per-item and cart-level pricing detail — sale/coupon-driven strikethrough prices, which coupons discounted which items, a pre-shipping total, and named tax breakdowns — to render an accurate summary without recomputing discount math client-side.

## ADDED Requirements

### Requirement: Line item shown/strikethrough price reflects only sale price and item-scoped coupons
The system SHALL compute each cart/order line item's display price and an optional strikethrough price using only that item's sale price and item-scoped ("product") coupon discounts. A cart-wide ("order") coupon SHALL NOT change a line item's display price or strikethrough price.

#### Scenario: No sale, no coupon
- **WHEN** a line item has no sale price and no item-scoped coupon discount
- **THEN** the item exposes a shown price equal to its regular price and no strikethrough price

#### Scenario: Sale price only
- **WHEN** a line item has an active sale price and no item-scoped coupon discount
- **THEN** the item exposes a strikethrough price equal to its regular price and a shown price equal to its sale price

#### Scenario: Sale price and item-scoped coupon combined
- **WHEN** a line item has an active sale price and is also discounted by an item-scoped coupon
- **THEN** the item exposes a strikethrough price equal to its sale-adjusted price (not its regular price) and a shown price equal to the sale-adjusted price minus the item-scoped coupon discount

#### Scenario: Item-scoped coupon without a sale price
- **WHEN** a line item has no sale price but is discounted by an item-scoped coupon
- **THEN** the item exposes a strikethrough price equal to its regular price and a shown price equal to the regular price minus the item-scoped coupon discount

#### Scenario: Only a cart-wide coupon applies
- **WHEN** a line item has no sale price and is only affected by a cart-wide (order-scoped) coupon, with no item-scoped coupon discounting it
- **THEN** the item exposes no strikethrough price and a shown price equal to its regular price, unaffected by the cart-wide coupon

#### Scenario: Multiple item-scoped coupons stack on the same item
- **WHEN** more than one item-scoped coupon discounts the same line item
- **THEN** the system sums their discounts into a single combined amount and exposes exactly one shown price and one strikethrough price for that item, not one tier per coupon

### Requirement: Line items list the item-scoped coupons that discounted them
The system SHALL expose, per line item, the set of item-scoped coupons that contributed a discount to that specific item, each with its discount amount. Cart-wide (order-scoped) coupons SHALL NOT appear in a line item's coupon list.

#### Scenario: Item-scoped coupon discounts an item
- **WHEN** an item-scoped coupon's discount applies to a line item
- **THEN** that coupon's code, title, and discount amount for that item appear in the item's applied-coupons list

#### Scenario: Cart-wide coupon does not appear on items
- **WHEN** a cart-wide (order-scoped) coupon is applied to the cart
- **THEN** it does not appear in any line item's applied-coupons list, regardless of which items its discount was allocated across

### Requirement: Cart exposes a pre-shipping total distinct from the grand total
The system SHALL expose a total representing the subtotal after product and cart-wide coupon discounts but before shipping cost, shipping discount, and tax are applied, separate from the final grand total.

#### Scenario: No free-shipping coupon applied
- **WHEN** a cart has product and/or cart-wide coupons applied but no free-shipping coupon
- **THEN** the pre-shipping total equals the subtotal minus those coupons' discounts, and the grand total equals the pre-shipping total plus shipping and tax

#### Scenario: Free-shipping coupon applied alongside an amount-off coupon
- **WHEN** a cart has a free-shipping coupon applied together with a product or cart-wide amount-off coupon
- **THEN** the pre-shipping total reflects only the amount-off coupon's discount, not the shipping waiver, so it remains consistent with the grand total once shipping is added

### Requirement: Tax amounts are broken down by name and split between product and shipping
The system SHALL expose the cart's tax as two separate collections of named amounts — one for product tax, one for shipping tax — each entry carrying a tax name and its amount, rather than a single combined total.

#### Scenario: Single product tax rate applied
- **WHEN** a cart's items are taxed under one named tax rate
- **THEN** the product tax breakdown contains one entry with that tax's name and the total amount charged across all items

#### Scenario: Shipping tax is not merged into product tax
- **WHEN** a cart has both a taxable shipping cost and taxable items
- **THEN** the shipping tax breakdown is exposed separately from the product tax breakdown, and neither collection's amounts include the other's
