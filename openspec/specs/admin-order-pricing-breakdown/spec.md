# admin-order-pricing-breakdown Specification

## Purpose

Defines the pricing, coupon, and item breakdown the admin/merchant
order-detail payload exposes for a placed order: how it mirrors the
storefront order breakdown's multi-coupon and merged-tax-line shape while
also carrying the store's base-currency figures the merchant needs
alongside the invoiced ones.

## Requirements

### Requirement: The admin order payload exposes both invoiced and base-currency amounts

The admin order payload SHALL expose, for every monetary figure, both the
order's own invoiced-currency amount and the store's base-currency amount,
each as a money object. It SHALL NOT expose a bare scalar amount key
alongside a money object for the same figure.

#### Scenario: Order placed in a non-base currency

- **WHEN** a merchant views the details of an order placed in a currency
  other than the store's base currency
- **THEN** every monetary figure in the payload carries both its invoiced
  money object and its base-currency money object

#### Scenario: A monetary figure never exposes a bare scalar

- **WHEN** any monetary figure is rendered in the payload
- **THEN** it appears only as a money object, with no separate bare numeric
  key duplicating that same amount

### Requirement: An order item exposes a per-unit price derived from its line subtotal

Every order item in the admin order payload SHALL expose a per-unit price as a single money object for both the invoiced-currency and base-currency amounts, in the order's tax mode. Each per-unit figure SHALL equal the matching line-subtotal figure the item exposes divided by the item's quantity, rounded up to the currency's minor unit. So, like the line subtotal, the per-unit price SHALL be net of only that item's own product-scoped coupon share.

#### Scenario: Line subtotal divides evenly

- **WHEN** an order item has quantity 2 and a line subtotal of 77.00
- **THEN** its unit price is 38.50

#### Scenario: Line subtotal does not divide evenly

- **WHEN** an order item has quantity 3 and a line subtotal of 10.00
- **THEN** its unit price is 3.34, rounded up, and its line subtotal is still 10.00

#### Scenario: Item discounted by a product-scoped coupon

- **WHEN** an order item with quantity 2 and a catalog sale price of 40.00 was discounted 10.00 by a product-targeted coupon
- **THEN** its unit price is 35.00, reflecting the coupon discount

#### Scenario: Order placed in a non-base currency

- **WHEN** a merchant views an item of an order placed in a currency other than the store's base currency
- **THEN** the invoiced unit price is derived from the item's invoiced line subtotal, and the base unit price from its base line subtotal

### Requirement: An order item exposes a per-unit strikethrough price derived from its line strikethrough price

Every order item in the admin order payload SHALL expose a per-unit strikethrough price as a single money object for both the invoiced-currency and base-currency amounts, in the order's tax mode. Each per-unit strikethrough figure SHALL equal the matching line strikethrough figure divided by the item's quantity, rounded up to the currency's minor unit. A per-unit strikethrough figure SHALL be null exactly when the matching line strikethrough figure is null.

#### Scenario: Item on sale with no product-scoped coupon

- **WHEN** an order item with quantity 2 was bought on sale, with a line strikethrough price of 100.00 (its catalog regular price total)
- **THEN** its unit strikethrough price is 50.00

#### Scenario: Item with nothing struck through

- **WHEN** an order item was neither on sale nor discounted by a product-scoped coupon, so its line strikethrough figures are null
- **THEN** both of its unit strikethrough figures are null

#### Scenario: Unit strikethrough is comparable to unit price

- **WHEN** an order item exposes a unit strikethrough price
- **THEN** it is in the same tax mode as the item's unit price, so the two are directly comparable

### Requirement: The root breakdown mirrors the storefront's items-subtotal/order-discount/order-total split

The admin order payload SHALL expose a root pricing breakdown with the sum of every item's own subtotal, the order-wide coupon discount, and an order total equal to the items subtotal minus the order-wide discount, computed before shipping, matching the `storefront-order-pricing-breakdown` capability's root breakdown shape. All three figures SHALL be in the order's tax mode, so the order total is the amount the items are charged after all coupons: it includes item tax under tax-inclusive pricing and excludes it under tax-exclusive pricing.

#### Scenario: Order total excludes shipping and tax

- **WHEN** an order placed under tax-exclusive pricing has a non-zero shipping charge and tax
- **THEN** the order's root order-total figure equals the sum of item subtotals minus the order-wide discount, unaffected by the shipping charge or tax amount

#### Scenario: Order-wide coupon under tax-inclusive pricing

- **WHEN** an order placed under tax-inclusive pricing has one item priced at 110.00 including 10% tax and a 50% order-wide coupon
- **THEN** the items subtotal is 110.00, the order discount is 55.00, and the order total is 55.00

### Requirement: An order item's subtotal reflects only that item's own product-scoped coupon share

An order item's subtotal SHALL be its catalog product-coupon-discounted subtotal: its catalog sale price total reduced only by discount attributed to that item from an item-scoped ("product") coupon, in the order's tax mode. It SHALL NOT be reduced by an order-wide coupon's attributed share of that item.

#### Scenario: Item discounted by both an item-scoped and an order-wide coupon

- **WHEN** an order item was discounted by both a product-targeted coupon and has an attributed share of an order-wide coupon's discount
- **THEN** the item's subtotal is reduced only by the product-targeted coupon's attributed amount, and the order-wide coupon's share appears only in the root-level order discount

#### Scenario: Order-wide coupon under tax-inclusive pricing

- **WHEN** an order placed under tax-inclusive pricing has an item priced at 110.00 including tax and an order-wide coupon
- **THEN** the item's subtotal is 110.00, the same as without the coupon

### Requirement: The payload supports multiple coupons at both item and order scope

The admin order payload SHALL expose every coupon recorded against the
order, at both item scope and order scope, rather than assuming a single
applied coupon. Each order item SHALL expose the list of item-scoped
coupons that discounted it.

#### Scenario: An order placed with more than one coupon

- **WHEN** an order was placed with more than one coupon applied, at either
  scope
- **THEN** the payload's coupon list contains one entry per applied coupon,
  each with its own discount amount and target scope

#### Scenario: An item discounted by more than one item-scoped coupon

- **WHEN** an order item was discounted by more than one item-scoped coupon
- **THEN** that item's list of applied coupons contains one entry per
  coupon that discounted it, each with its own attributed amount

### Requirement: Every applicable tax rate is shown as its own merged breakdown line

The admin order payload SHALL expose one merged list of tax lines combining
every item's recorded tax lines and the order's shipping tax lines, grouped
by the combination of tax name and rate, matching the
`storefront-order-pricing-breakdown` capability's tax-lines behavior. Each
merged line SHALL carry both its invoiced and base-currency amount.

#### Scenario: Two simultaneous rates under the same tax name

- **WHEN** an order's items were taxed under the same tax name but at two
  different rates
- **THEN** the merged tax-lines breakdown shows two separate entries, one
  per rate, each with its own invoiced and base-currency amount

### Requirement: The admin order resource does not depend on the storefront order resource's structure

The admin order payload's shape SHALL be defined independently of the
storefront order-details payload's shape. Changing the storefront payload's
fields or structure SHALL NOT be required to change the admin order
payload, and vice versa.

#### Scenario: Storefront order payload changes

- **WHEN** the storefront order-details payload's structure changes
- **THEN** the admin order payload is unaffected unless this specification
  is separately updated

### Requirement: Every pricing figure is exposed once, in the order's tax mode

The admin order payload and the admin order-calculation payload SHALL expose each item, strikethrough, per-unit and root pricing figure as a single money object per currency, in the tax mode it was priced under. That mode SHALL be the tax mode recorded on the order for a placed order, and the store's current tax setting for a live calculation. Each payload SHALL expose that mode as an `is_tax_inclusive` flag. Neither payload SHALL expose a tax-exclusive and a tax-inclusive variant of the same figure.

#### Scenario: Order placed under tax-inclusive pricing

- **WHEN** a merchant views an order that was placed under tax-inclusive pricing
- **THEN** the payload's `is_tax_inclusive` flag is true and every item and root pricing figure includes tax

#### Scenario: Order placed under tax-exclusive pricing

- **WHEN** a merchant views an order that was placed under tax-exclusive pricing
- **THEN** the payload's `is_tax_inclusive` flag is false and every item and root pricing figure excludes tax

#### Scenario: Store tax setting changed after the order was placed

- **WHEN** the store switches its tax-inclusive-pricing setting after an order was placed
- **THEN** that order's payload still shows its figures in the tax mode recorded on the order

#### Scenario: Live order calculation

- **WHEN** a merchant calculates an order in the admin order screen
- **THEN** the payload's figures are in the store's current tax mode and its `is_tax_inclusive` flag reflects that setting

### Requirement: An order item's strikethrough price shows its pre-discount catalog baseline

An order item in the admin order payload or the admin order-calculation payload SHALL expose a strikethrough price, per currency, read from the item's catalog figures:

- when an item-scoped coupon reduced the item (its catalog product-coupon-discounted subtotal is less than its catalog sale price multiplied by its quantity), the strikethrough price SHALL be the catalog sale price multiplied by the quantity;
- otherwise, when the item was bought on sale (its catalog regular price is greater than its catalog sale price), the strikethrough price SHALL be the catalog regular price multiplied by the quantity;
- otherwise, the strikethrough price SHALL be null.

An order-wide coupon SHALL NOT cause a strikethrough price.

#### Scenario: Item on sale and discounted by a product-scoped coupon

- **WHEN** an order item with quantity 2, catalog regular price 60.00 and catalog sale price 50.00 is discounted 10.00 by a product-scoped coupon
- **THEN** its strikethrough price is 100.00 and its subtotal is 90.00

#### Scenario: Item on sale with no product-scoped coupon

- **WHEN** an order item with quantity 2, catalog regular price 60.00 and catalog sale price 50.00 has no product-scoped coupon
- **THEN** its strikethrough price is 120.00 and its subtotal is 100.00

#### Scenario: Only an order-wide coupon applied

- **WHEN** an order item was not on sale and its only discount is a share of an order-wide coupon
- **THEN** its strikethrough price is null
