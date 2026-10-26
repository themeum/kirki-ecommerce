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

### Requirement: Item and root subtotal figures are exposed once, in the store's tax mode

Every calculated line item's subtotal, and the root items-subtotal and order-total figures, SHALL be exposed as a single money object in the base currency, in the store's current tax mode. The payload SHALL expose that mode as an `is_tax_inclusive` flag. It SHALL NOT expose a tax-exclusive and a tax-inclusive variant of the same figure.

#### Scenario: Calculation priced under tax-exclusive pricing

- **WHEN** an admin prices a manual order under tax-exclusive pricing
- **THEN** `is_tax_inclusive` is false and each line item's subtotal money object excludes tax

#### Scenario: Calculation priced under tax-inclusive pricing

- **WHEN** an admin prices a manual order under tax-inclusive pricing
- **THEN** `is_tax_inclusive` is true and each line item's subtotal money object includes the tax portion of the item's price

#### Scenario: Root items-subtotal and order-total figures

- **WHEN** an admin views the calculation's root pricing breakdown
- **THEN** the items-subtotal and order-total figures are each one money object, in the same tax mode as the line item subtotals

### Requirement: A calculated line item's strikethrough price is exposed once, in the store's tax mode

When a calculated line item exposes a strikethrough price, it SHALL expose it as a single money object in the base currency, in the same tax mode as the item's subtotal, so the "was" price is directly comparable to the subtotal it is displayed alongside. It SHALL NOT expose a tax-exclusive and a tax-inclusive variant of the same figure.

#### Scenario: Strikethrough price shown alongside either subtotal figure

- **WHEN** a calculated line item exposes a strikethrough price
- **THEN** its strikethrough money object is in the same tax mode as the item's subtotal money object

### Requirement: The root breakdown separates items subtotal, order discount, and order total

The calculation payload SHALL expose the sum of every item's own subtotal
net of its product-scoped coupon share, the order-wide coupon discount, and
an order total equal to the items subtotal minus the order-wide discount,
computed before shipping and before any tax is added on top, matching the
`cart-pricing-breakdown` capability's root breakdown shape. All three
figures SHALL be in the store's current tax mode.

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
SHALL be exposed as a money object, not a bare scalar. When the
calculation previews an edit, a coupon that is on the stored order SHALL be
calculated from its stored terms, and a coupon that is not on the stored
order SHALL be calculated from its live record.

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

#### Scenario: A stored coupon in an edit preview

- **WHEN** an edit preview includes a coupon that is on the stored order, and
  the coupon has expired since
- **THEN** the coupon list contains that coupon with its stored terms and its
  discount amount

#### Scenario: A rejected code in a create preview

- **WHEN** a creation preview sends a code that the calculation does not
  apply
- **THEN** that code does not appear in the coupon list

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

### Requirement: A calculated line item exposes a per-unit price derived from its line subtotal

Every calculated line item in the manual order calculation payload SHALL expose a per-unit price as a single money object in the base currency, in the store's current tax mode. The per-unit figure SHALL equal the line-subtotal figure the item exposes divided by the item's quantity, rounded up to the currency's minor unit. So, like the line subtotal, the per-unit price SHALL be net of only that item's own product-scoped coupon share.

#### Scenario: Line subtotal divides evenly

- **WHEN** a calculated line item has quantity 2 and a line subtotal of 70.00
- **THEN** its unit price is 35.00

#### Scenario: Line subtotal does not divide evenly

- **WHEN** a calculated line item has quantity 3 and a line subtotal of 10.00
- **THEN** its unit price is 3.34, rounded up, and its line subtotal is still 10.00

#### Scenario: Item discounted by a product-scoped coupon

- **WHEN** a calculated line item with quantity 2 and a pre-coupon line subtotal of 80.00 is discounted 10.00 by a product-targeted coupon
- **THEN** its unit price is 35.00, reflecting the coupon discount

#### Scenario: Item discounted only by an order-wide coupon

- **WHEN** a calculated line item is discounted only by an order-wide coupon's allocation
- **THEN** its unit price is unaffected by that allocation, the same as its line subtotal

### Requirement: A calculated line item exposes a per-unit strikethrough price derived from its line strikethrough price

Every calculated line item in the manual order calculation payload SHALL expose a per-unit strikethrough price as a single money object in the base currency, in the store's current tax mode. The per-unit strikethrough figure SHALL equal the line strikethrough figure divided by the item's quantity, rounded up to the currency's minor unit. A per-unit strikethrough figure SHALL be null exactly when the line strikethrough figure is null.

#### Scenario: Item on sale with no product-scoped coupon

- **WHEN** a calculated line item with quantity 2 is on sale, with a line strikethrough price of 100.00 (its regular-price total)
- **THEN** its unit strikethrough price is 50.00

#### Scenario: Item with nothing struck through

- **WHEN** a calculated line item is neither on sale nor discounted by a product-scoped coupon, so its line strikethrough figure is null
- **THEN** its unit strikethrough figure is null

#### Scenario: Unit strikethrough is comparable to unit price

- **WHEN** a calculated line item exposes a unit strikethrough price
- **THEN** it is in the same tax mode as the item's unit price, so the two are directly comparable

### Requirement: The calculation accepts an order ID to preview an edit
The order calculation endpoint SHALL accept an optional `order_id`. All other inputs are the same as for order creation, except that an existing line is sent with its `order_item_id`. When `order_id` is sent, the endpoint SHALL calculate the edit of that order with the same frozen values as the save. It SHALL fail with a 404 error when the order does not exist, and with a 422 error when the order is not editable.

#### Scenario: Preview an edit
- **WHEN** an admin sends a calculation with the ID of an editable order
- **THEN** the endpoint returns the calculation for that edit, with stored prices, stored coupons, stored shipping and stored tax rates

#### Scenario: Preview an edit of a paid order
- **WHEN** an admin sends a calculation with the ID of a paid order
- **THEN** the request fails with a 422 error

#### Scenario: Unknown order
- **WHEN** an admin sends a calculation with an order ID that does not exist
- **THEN** the request fails with a 404 error

#### Scenario: No order ID
- **WHEN** an admin sends a calculation without an order ID
- **THEN** the endpoint behaves as an order-creation preview

### Requirement: Each calculated item says if its line is reachable
Each calculated line item SHALL expose `is_reachable`. It is false when the line's variant or product no longer exists, or its product is draft, scheduled or trashed, or its variant is hidden. It is true otherwise. The client uses it to disable the quantity buttons of the line.

#### Scenario: Published product
- **WHEN** an item's variant exists and its product is published
- **THEN** the item shows `is_reachable` true

#### Scenario: Unpublished product
- **WHEN** an item's product was moved to draft
- **THEN** the item shows `is_reachable` false

#### Scenario: Deleted variant
- **WHEN** an item's variant was deleted
- **THEN** the item shows `is_reachable` false

### Requirement: Each calculated item exposes live stock and limit data
Each calculated line item SHALL expose these values, read from its variant at calculation time: `allow_back_order`, `track_inventory`, `available_quantity`, `in_stock`, `has_limit_per_order` and `max_per_order`. For a line whose variant was deleted, each of these values SHALL be null.

#### Scenario: Live values
- **WHEN** a variant has 4 units available, tracks inventory and has a per-order limit of 3
- **THEN** its calculated item shows `available_quantity` 4, `track_inventory` true, `has_limit_per_order` true and `max_per_order` 3

#### Scenario: Deleted variant
- **WHEN** an edit preview includes a line whose variant was deleted
- **THEN** that line's six stock and limit values are null

### Requirement: Each calculated item identifies its stored order line
Each calculated line item SHALL expose `order_item_id`. Its value is the ID of the stored order line when the line is an existing line of an edit. Otherwise its value is null.

#### Scenario: Existing line in an edit
- **WHEN** an edit preview includes a line sent with an `order_item_id`
- **THEN** that item's `order_item_id` is the stored line's ID

#### Scenario: New line or create preview
- **WHEN** an item is new in an edit, or the calculation has no order ID
- **THEN** that item's `order_item_id` is null

### Requirement: Calculation and save apply the same quantity and stock rules
The calculation endpoint and the order save SHALL apply the same quantity, per-order limit and stock rules, and SHALL fail with a 422 error when a rule is broken. The calculation SHALL still return `is_reachable` and the live stock and limit values for display. The calculation SHALL NOT reserve stock; the save SHALL check stock again and reserve it under the order lock.

#### Scenario: Quantity over the limit in a preview
- **WHEN** an admin previews a new line with quantity 5 for a variant whose per-order limit is 3
- **THEN** the calculation fails with a 422 error

#### Scenario: Quantity of an unreachable line changed in a preview
- **WHEN** an admin previews a changed quantity for a line whose product is a draft
- **THEN** the calculation fails with a 422 error

#### Scenario: Increase beyond stock in a preview
- **WHEN** a line has quantity 2, the variant has 1 available unit and does not allow back orders, and an admin previews a quantity of 4
- **THEN** the calculation fails with a 422 error

#### Scenario: Unchanged line on a sold-out variant in a preview
- **WHEN** a line has quantity 5, the variant now has 0 available stock, and an admin previews an edit that does not change that line
- **THEN** the calculation succeeds and the item shows `available_quantity` 0

#### Scenario: Quantity lowered or line removed in a preview
- **WHEN** an admin previews a lower quantity for a line, or leaves a line out of the payload
- **THEN** the calculation succeeds, and no limit or stock check applies to that line

#### Scenario: Stock changes between preview and save
- **WHEN** a preview succeeds, and the stock of the variant is used by another order before the admin saves
- **THEN** the save fails with an insufficient-stock error and nothing on the order changes
