# cart-pricing-breakdown Specification

## Purpose

Defines the pricing breakdown a cart preview exposes to the checkout UI:
how a line item's subtotal, strikethrough price, and
discount are separated; how the order-wide discount and shipping amount are
kept distinct from per-item and shipping-specific figures; and how every
applicable tax rate is surfaced without collapsing distinct rates together.

## Requirements

### Requirement: A line item's subtotal reflects only that item's own product-scoped discount

A cart line item's subtotal SHALL be its
sale-or-regular price total reduced only by discounts scoped to that
specific item (a product-targeted coupon). It SHALL NOT be reduced by an
order-wide coupon's allocation to that item.

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

### Requirement: A line item's strikethrough price shows its pre-discount baseline

A cart line item MAY expose a strikethrough price. When exposed, it SHALL
be the price basis before whichever discount currently reduces the item's
subtotal: when a product-targeted coupon reduces the item, the
strikethrough price SHALL be the sale-or-regular total before that coupon;
when no coupon applies but a sale price is active, the strikethrough price
SHALL be the regular price total; when neither applies, no strikethrough
price SHALL be exposed.

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

### Requirement: The order-wide discount is reported separately from per-item and shipping discounts

The pricing breakdown SHALL report three distinct discount figures: the sum
of per-item product-scoped discounts (reflected inside each item's own
subtotal, not summed separately at the root), the order-wide coupon
discount (a root-level figure, applied against the sum of item subtotals
only), and the shipping discount (a root-level figure, applied only against
the shipping amount). None of these three SHALL be combined into a single
total discount figure.

#### Scenario: Order-wide coupon alongside per-item coupons

- **WHEN** a cart has both a product-targeted coupon on one item and an
  order-wide coupon
- **THEN** the root-level order discount reflects only the order-wide
  coupon's amount, computed against the sum of item subtotals

#### Scenario: Order-wide coupon does not affect shipping

- **WHEN** an order-wide coupon is applied to a cart that also has a
  shipping charge
- **THEN** the order-wide discount figure does not reduce the shipping
  amount

### Requirement: The root breakdown separates items subtotal, order discount, and order total

The pricing breakdown SHALL expose the sum of every item's own subtotal, the
order-wide discount, and an order total equal to the items subtotal minus
the order-wide discount — computed before shipping and before tax.

#### Scenario: Order total excludes shipping and tax

- **WHEN** a cart has a non-zero shipping charge and applicable tax
- **THEN** the order total equals the sum of item subtotals minus the
  order-wide discount, unaffected by the shipping charge or tax amount

### Requirement: The shipping amount is reported separately from shipping tax

The pricing breakdown SHALL expose a shipping amount equal to the shipping
subtotal minus the shipping discount, excluding any tax on shipping. It
SHALL NOT expose a dedicated shipping-tax figure; the tax charged on
shipping is instead represented as an entry in the merged tax-lines
breakdown.

#### Scenario: Shipping amount excludes tax under tax-exclusive pricing

- **WHEN** the store's pricing is tax-exclusive and the shipping charge is
  taxable
- **THEN** the shipping amount equals the shipping subtotal minus the
  shipping discount, with the tax on shipping appearing only in the
  tax-lines breakdown, not folded into the shipping amount

#### Scenario: Shipping amount under tax-inclusive pricing

- **WHEN** the store's pricing is tax-inclusive
- **THEN** the shipping amount still equals the shipping subtotal minus the
  shipping discount

### Requirement: Every applicable tax rate is shown as its own breakdown line

The pricing breakdown SHALL expose one merged list of tax lines combining
every item's tax and the shipping charge's tax. Lines are grouped by the
combination of their name and rate: two lines sharing a name but not a rate
SHALL each appear as their own entry with their own amount; two lines
sharing both name and rate SHALL be combined into one entry summing their
amounts.

#### Scenario: Two simultaneous rates under the same tax name

- **WHEN** a cart's items are taxed under the same tax name but at two
  different rates (e.g. two VAT rates in an EU cart)
- **THEN** the merged tax-lines breakdown shows two separate entries, one
  per rate, each with its own amount

#### Scenario: Shipping tax merges with item tax when the country treats them as one tax

- **WHEN** a country's tax logic taxes shipping under the same name and at
  the same rate as an item in the cart (e.g. EU VAT following the goods'
  rate)
- **THEN** the merged tax-lines breakdown combines that shipping tax amount
  into the matching item-tax entry rather than showing it separately

#### Scenario: Shipping tax stays distinguishable when the country treats it as its own tax

- **WHEN** a country's tax logic taxes shipping under a name distinct from
  item tax (e.g. a flat "Shipping Tax" alongside item-level "Tax")
- **THEN** the merged tax-lines breakdown shows shipping tax as its own
  entry, separate from item tax entries

### Requirement: Restructuring the breakdown does not change the amount charged

The final amount charged for the cart SHALL remain the same as
before this breakdown restructuring, under both tax-inclusive and
tax-exclusive pricing. Only how the breakdown is decomposed and labeled
changes, not the total collected.

#### Scenario: Grand total unaffected by breakdown changes

- **WHEN** the pricing breakdown is computed for a cart under either
  tax-inclusive or tax-exclusive pricing
- **THEN** the final amount charged matches what it would have been before
  the breakdown was restructured, for the same cart contents
