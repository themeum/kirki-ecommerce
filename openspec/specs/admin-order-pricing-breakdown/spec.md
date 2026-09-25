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

### Requirement: Item and root subtotal figures expose both a tax-exclusive and a tax-inclusive amount

Every order item's subtotal, and the root items-subtotal and order-total figures, SHALL expose both a tax-exclusive money object and a tax-inclusive money object, for both the invoiced-currency and base-currency amounts, as flat sibling keys. It SHALL NOT expose a single subtotal money object whose tax treatment is ambiguous.

#### Scenario: Order placed under tax-exclusive pricing

- **WHEN** a merchant views an order item whose price was calculated under tax-exclusive pricing
- **THEN** the item's tax-exclusive subtotal money object equals its charged subtotal, and its tax-inclusive subtotal money object equals that amount plus the item's own tax total

#### Scenario: Order placed under tax-inclusive pricing

- **WHEN** a merchant views an order item whose price was calculated under tax-inclusive pricing
- **THEN** the item's tax-exclusive subtotal money object excludes the tax portion of the item's price, and its tax-inclusive subtotal money object includes it

#### Scenario: Root items-subtotal and order-total figures

- **WHEN** a merchant views an order's root pricing breakdown
- **THEN** the items-subtotal and order-total figures each expose both a tax-exclusive and a tax-inclusive money object, for the invoiced and base currency

### Requirement: An order item's strikethrough price expose both a tax-exclusive and a tax-inclusive amount

When an order item exposes a strikethrough price, it SHALL expose both a tax-exclusive money object and a tax-inclusive money object, for both the invoiced-currency and base-currency amounts, as flat sibling keys — matching the tax treatment of its subtotal, so the "was" price is comparable to whichever of the item's subtotal figures it is displayed alongside.

#### Scenario: Strikethrough price shown alongside either subtotal figure

- **WHEN** an order item exposes a strikethrough price
- **THEN** its tax-exclusive strikethrough money object is comparable to the item's tax-exclusive subtotal, and its tax-inclusive strikethrough money object is comparable to the item's tax-inclusive subtotal

### Requirement: The root breakdown mirrors the storefront's items-subtotal/order-discount/order-total split

The admin order payload SHALL expose a root pricing breakdown with the sum
of every item's own invoiced subtotal, the order-wide coupon discount, and
an order total equal to the items subtotal minus the order-wide discount,
computed before shipping and before tax, matching the
`storefront-order-pricing-breakdown` capability's root breakdown shape.

#### Scenario: Order total excludes shipping and tax

- **WHEN** an order has a non-zero shipping charge and tax
- **THEN** the order's root order-total figure equals the sum of item
  subtotals minus the order-wide discount, unaffected by the shipping
  charge or tax amount

### Requirement: An order item's subtotal reflects only that item's own product-scoped coupon share

An order item's subtotal SHALL be its price total reduced only by discount
attributed to that item from an item-scoped ("product") coupon. It SHALL
NOT be reduced by an order-wide coupon's attributed share of that item.

#### Scenario: Item discounted by both an item-scoped and an order-wide coupon

- **WHEN** an order item was discounted by both a product-targeted coupon
  and has an attributed share of an order-wide coupon's discount
- **THEN** the item's subtotal is reduced only by the product-targeted
  coupon's attributed amount, and the order-wide coupon's share appears
  only in the root-level order discount

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
