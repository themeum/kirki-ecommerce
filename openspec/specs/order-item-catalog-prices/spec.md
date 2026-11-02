# order-item-catalog-prices Specification

## Purpose

Defines the catalog prices an order item records at placement - the regular price, the price it sold at, its total after product-scoped coupons, and the tax removed by discounts - exactly as the catalog had them, so every pricing figure can be shown in the order's own tax mode without converting between tax-inclusive and tax-exclusive amounts at runtime.

## Requirements

### Requirement: An order item records its catalog prices exactly as the catalog had them

When an order item is created, the system SHALL record, in both the store's base currency and the order's invoiced currency:

- the **catalog regular price**: the variant's regular unit price, exactly as set on the variant;
- the **catalog sale price**: the unit price the item was sold at, which is the variant's sale price when a sale was active and its regular price otherwise, exactly as set on the variant;
- the **catalog product-coupon-discounted subtotal**: the catalog sale price multiplied by the quantity, reduced only by the discount from item-scoped ("product") coupons, and not reduced by any order-wide coupon.

No tax SHALL be added to or removed from these figures. They SHALL include tax exactly when the order records that the store priced items inclusive of tax.

The invoiced figures SHALL be converted from the base figures using the same exchange rate as the order's other invoiced amounts.

#### Scenario: Item bought on sale under tax-inclusive pricing

- **WHEN** an order is placed under tax-inclusive pricing for 2 units of a variant whose regular price is 110.00 and sale price is 99.00, with no coupon
- **THEN** the order item's catalog regular price is 110.00, its catalog sale price is 99.00, and its catalog product-coupon-discounted subtotal is 198.00

#### Scenario: Item bought with no sale price

- **WHEN** an order is placed for a variant that has no sale price
- **THEN** the order item's catalog sale price equals its catalog regular price

#### Scenario: Item discounted by a product-scoped coupon and an order-wide coupon

- **WHEN** an order item with a catalog sale price of 50.00 and quantity 2 is discounted 10.00 by a product-scoped coupon and also receives a share of an order-wide coupon
- **THEN** its catalog product-coupon-discounted subtotal is 90.00, unaffected by the order-wide coupon's share

#### Scenario: Item under tax-exclusive pricing

- **WHEN** an order is placed under tax-exclusive pricing
- **THEN** the order item's catalog figures exclude tax, because the catalog prices exclude tax

#### Scenario: Order placed in a non-base currency

- **WHEN** an order is placed in a currency other than the store's base currency
- **THEN** each invoiced catalog figure is its base catalog figure converted at the order's exchange rate

### Requirement: An order item records the tax removed by discounts

When an order item is created, the system SHALL record, in both the store's base currency and the order's invoiced currency, the **discount tax total**: the item's tax calculated before any discount, minus the item's tax after all discounts (item-scoped and order-wide). It SHALL be zero when the item received no discount or is not taxed.

#### Scenario: Item discounted under tax-inclusive pricing

- **WHEN** an item priced at 110.00 including 10% tax receives a 50% order-wide coupon
- **THEN** its tax before discount is 10.00, its recorded tax total is 5.00, and its discount tax total is 5.00

#### Scenario: Item discounted to zero

- **WHEN** an item priced at 110.00 including 10% tax is discounted by 100%
- **THEN** its recorded tax total is 0.00 and its discount tax total is 10.00

#### Scenario: Item with no discount

- **WHEN** an item receives no discount
- **THEN** its discount tax total is 0.00

### Requirement: Catalog figures change only when the order is recalculated

An order item's four catalog figures SHALL NOT change when the variant's prices are edited after the order is placed. When an order edit recalculates the order, every item's four catalog figures SHALL be refreshed from that same recalculation, together with the item's other totals, so an item's subtotal, strikethrough price and the order's tax mode always come from one calculation.

#### Scenario: Variant price changes after the order is placed

- **WHEN** a variant's regular or sale price is changed after an order containing it was placed, and the order is not edited
- **THEN** that order item's catalog figures are unchanged

#### Scenario: Order edit recalculates the order

- **WHEN** an order edit changes the quantity of an item from 2 to 3
- **THEN** the item's four catalog figures are the ones produced by the recalculation for quantity 3, in the tax mode the order records after the edit

#### Scenario: Item added to an existing order

- **WHEN** an order edit adds a variant that was not previously on the order
- **THEN** the new item records the variant's catalog figures as of that edit

### Requirement: A live calculation exposes the same catalog figures

Every line item produced by a cart or order calculation SHALL carry the same four figures - catalog regular price, catalog sale price, catalog product-coupon-discounted subtotal and discount tax total - in the store's base currency, calculated under the store's current tax setting, so a cart preview and the order later placed from it show the same figures.

#### Scenario: Cart preview matches the placed order

- **WHEN** a cart is previewed and then placed as an order with no change to its contents, coupons, prices or tax setting
- **THEN** each line item's four figures in the preview equal the base figures recorded on the matching order item
