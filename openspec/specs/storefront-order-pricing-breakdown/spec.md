# storefront-order-pricing-breakdown Specification

## Purpose

Defines the pricing, coupon, and item breakdown the storefront order-details
page exposes for a placed order: how it mirrors the checkout cart's
breakdown shape while reading only the order's frozen invoiced amounts, and
how it supports multiple item-level and order-level coupons.

## Requirements

### Requirement: The storefront order payload exposes only invoiced amounts

The storefront order-details payload SHALL expose only `invoiced_*` money
fields. It SHALL NOT expose the store's base-currency (`base_*`) amounts,
and SHALL NOT perform a separate display-currency conversion step, since an
order's invoiced currency is already the currency the customer transacted
and views the order in.

#### Scenario: Order placed in a non-base currency

- **WHEN** a customer views the details of an order placed in a currency
  other than the store's base currency
- **THEN** every amount in the payload is that order's own invoiced amount
  in its invoiced currency, with no base-currency figure alongside it

### Requirement: The root breakdown mirrors the cart's items-subtotal/order-discount/order-total split

The storefront order payload SHALL expose a root pricing breakdown with the
sum of every item's own invoiced subtotal, the order-wide coupon discount,
and an order total equal to the items subtotal minus the order-wide
discount, computed before shipping and before tax — matching the
`cart-pricing-breakdown` capability's root breakdown shape.

#### Scenario: Order total excludes shipping and tax

- **WHEN** an order has a non-zero shipping charge and tax
- **THEN** the order's root order-total figure equals the sum of item
  subtotals minus the order-wide discount, unaffected by the shipping
  charge or tax amount

### Requirement: An order item's invoiced subtotal reflects only that item's own product-scoped coupon share

An order item's invoiced subtotal SHALL be its invoiced price total reduced
only by discount attributed to that item from an item-scoped ("product")
coupon. It SHALL NOT be reduced by an order-wide coupon's attributed share
of that item.

#### Scenario: Item discounted by both an item-scoped and an order-wide coupon

- **WHEN** an order item was discounted by both a product-targeted coupon
  and has an attributed share of an order-wide coupon's discount
- **THEN** the item's invoiced subtotal is reduced only by the
  product-targeted coupon's attributed amount, and the order-wide coupon's
  share appears only in the root-level order discount

### Requirement: The payload supports multiple coupons at both item and order scope

The storefront order payload SHALL expose every coupon recorded against the
order, at both item scope and order scope, rather than assuming a single
applied coupon.

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

The storefront order payload SHALL expose one merged list of tax lines
combining every item's recorded tax lines and the order's shipping tax
lines, grouped by the combination of tax name and rate, matching the
`cart-pricing-breakdown` capability's tax-lines behavior.

#### Scenario: Two simultaneous rates under the same tax name

- **WHEN** an order's items were taxed under the same tax name but at two
  different rates
- **THEN** the merged tax-lines breakdown shows two separate entries, one
  per rate, each with its own invoiced amount

### Requirement: The storefront order-details resource does not depend on the admin order resource's structure

The storefront order-details payload's shape SHALL be defined independently
of the admin order resource's payload shape. Changing the admin order
resource's fields or structure SHALL NOT be required to change the
storefront order-details payload, and vice versa.

#### Scenario: Admin order payload changes

- **WHEN** the admin order resource's payload structure changes
- **THEN** the storefront order-details payload is unaffected unless the
  storefront resource is separately changed

### Requirement: Orders placed before multi-coupon attribution existed degrade gracefully

An order that has no recorded order-coupon or order-item-coupon rows (a
pre-existing order, per `order-coupon-attribution`) SHALL still produce a
valid storefront payload: an empty coupon list, zero order-wide discount,
and each item's invoiced subtotal equal to its own invoiced price total.

#### Scenario: Viewing a pre-existing order with no recorded coupon attribution

- **WHEN** a customer views the details of an order placed before
  order-coupon attribution was recorded
- **THEN** the payload's coupon list is empty, the root order discount is
  zero, and every item's invoiced subtotal equals its invoiced price total
