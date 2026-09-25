# admin-order-calculation-breakdown Specification

## Purpose

Defines the pricing, coupon, and item breakdown the manual order creation
calculation preview exposes to the admin/merchant portal: how it mirrors
the cart pricing breakdown's multi-coupon and merged-tax-line shape, with
both the store's base-currency amounts and the target order currency's
display amounts.

## Requirements

### Requirement: The calculation payload exposes only base-currency amounts

The manual order calculation payload SHALL expose every monetary figure only as the store's base-currency amount, as a money object. It SHALL NOT expose a display-currency conversion, since this payload is used only in the admin order create/recalculate screen, which prices in the store's base currency. It SHALL NOT expose a bare scalar amount key alongside a money object for the same figure.

#### Scenario: Manual order priced by an admin

- **WHEN** an admin prices a manual order
- **THEN** every monetary figure in the payload carries only its base-currency money object, with no display-currency figure alongside it

#### Scenario: A monetary figure never exposes a bare scalar

- **WHEN** any monetary figure is rendered in the payload
- **THEN** it appears only as a money object, with no separate bare numeric key duplicating that same amount

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

### Requirement: The root breakdown separates items subtotal, order discount, and order total

The calculation payload SHALL expose the sum of every item's own subtotal
net of its product-scoped coupon share, the order-wide coupon discount, and
an order total equal to the items subtotal minus the order-wide discount,
computed before shipping and before tax, matching the
`cart-pricing-breakdown` capability's root breakdown shape.

#### Scenario: Order total excludes shipping and tax

- **WHEN** a manual order calculation has a non-zero shipping charge and
  tax
- **THEN** the order total equals the sum of item subtotals minus the
  order-wide discount, unaffected by the shipping charge or tax amount

### Requirement: A line item's subtotal reflects only that item's own product-scoped coupon share

A calculated line item's subtotal SHALL be its price total reduced only by
discount attributed to that item from an item-scoped ("product") coupon. It
SHALL NOT be reduced by an order-wide coupon's allocation to that item.

#### Scenario: Item discounted by both an item-scoped and an order-wide coupon

- **WHEN** a calculated line item has both a product-targeted coupon and an
  order-wide coupon applied to the order
- **THEN** the item's subtotal is reduced only by the product-targeted
  coupon's amount, and the order-wide coupon's share appears only in the
  root-level order discount

### Requirement: The payload supports multiple coupons at both item and order scope

The calculation payload SHALL expose every coupon applied to the
calculation, at both item scope and order scope, rather than assuming a
single applied coupon. Each fixed-amount coupon's configured discount
SHALL be exposed as a money object, not a bare scalar.

#### Scenario: A calculation with more than one coupon

- **WHEN** a manual order calculation has more than one coupon applied, at
  either scope
- **THEN** the payload's coupon list contains one entry per applied coupon,
  each with its own discount amount and target scope, and a money object
  for any fixed-amount discount configuration

#### Scenario: An item discounted by more than one item-scoped coupon

- **WHEN** a calculated line item is discounted by more than one
  item-scoped coupon
- **THEN** that item's list of applied coupons contains one entry per
  coupon that discounted it, each with its own attributed amount

### Requirement: Every applicable tax rate is shown as its own merged breakdown line

The calculation payload SHALL expose one merged list of tax lines combining
every item's tax lines and the shipping charge's tax lines, grouped by the
combination of tax name and rate, matching the `cart-pricing-breakdown`
capability's tax-lines behavior. It SHALL NOT expose a separate,
unaggregated shipping tax-lines list alongside the merged breakdown.

#### Scenario: Two simultaneous rates under the same tax name

- **WHEN** a manual order calculation's items are taxed under the same tax
  name but at two different rates
- **THEN** the merged tax-lines breakdown shows two separate entries, one
  per rate, each with its own amount

### Requirement: Available shipping methods expose only a base-currency money object for their cost

Each available shipping method in the calculation payload SHALL expose its cost as a base-currency money object only, with no bare scalar cost key and no display-currency figure.

#### Scenario: Shipping method cost rendered

- **WHEN** the calculation payload lists an available shipping method
- **THEN** that method's cost appears only as its base-currency money object, with no separate bare numeric cost key and no display-currency figure
