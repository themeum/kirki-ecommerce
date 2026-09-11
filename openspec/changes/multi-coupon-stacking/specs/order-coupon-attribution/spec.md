## Purpose

Freezes a cart's applied coupons into permanent, exact per-order and per-order-item discount records at checkout, so refunds, reports, and support can trace exactly which coupon discounted which line and by how much.

## ADDED Requirements

### Requirement: Checkout freezes every applied coupon onto the order
The system SHALL record one order-coupon entry for every coupon applied at checkout, each capturing that coupon's identity, scope, and total discount amount as of the moment of checkout.

#### Scenario: Order placed with multiple coupons
- **WHEN** an order is created from a cart that has more than one coupon applied
- **THEN** the system records a separate order-coupon entry for each applied coupon, with that coupon's own total discount amount

### Requirement: Per-item discount is attributed to the coupon that caused it
The system SHALL record, for each order item discounted by an item-scoped or cart-wide coupon, the exact discount amount that specific coupon contributed to that item.

#### Scenario: Two coupons discount the same item
- **WHEN** an order item's price was discounted by two different applied coupons
- **THEN** the system records a separate attribution entry for each coupon showing the exact amount that coupon discounted on that item

### Requirement: Coupon usage is tracked per applied coupon
The system SHALL record a separate usage entry and increment the usage count for each coupon applied to an order, independent of the other coupons on that order.

#### Scenario: Order placed with multiple coupons increments each independently
- **WHEN** an order is placed using more than one coupon
- **THEN** the system records a usage entry for each coupon and increments each coupon's own usage count

### Requirement: Order-side coupon records are immutable after checkout
The system SHALL preserve an order's recorded coupon details and discount amounts unchanged even if the underlying coupon is later edited or deleted.

#### Scenario: A coupon used on a placed order is later deleted
- **WHEN** a coupon that was applied to a placed order is deleted or edited after checkout
- **THEN** the order's recorded coupon details and discount amounts for that order remain exactly as they were at checkout

### Requirement: Order-side discount amounts reconcile exactly
The system SHALL ensure that per-item coupon attributions, per-coupon totals, and the order's overall discount total always sum exactly, with no fractional unit lost or invented.

#### Scenario: An order-coupon's attributions sum to its own total
- **WHEN** an order-coupon has discounted one or more order items (and, if applicable, waived shipping)
- **THEN** the sum of its per-item attribution amounts plus any shipping discount it granted equals exactly that order-coupon's recorded total discount amount

#### Scenario: All order-coupons sum to the order's discount total
- **WHEN** an order has more than one order-coupon
- **THEN** the sum of every order-coupon's total discount amount equals exactly the order's overall recorded discount total

#### Scenario: An order item's attributions sum to its own recorded discount
- **WHEN** an order item was discounted by more than one order-coupon
- **THEN** the sum of those per-coupon attribution amounts equals exactly that order item's recorded discount amount

### Requirement: Free-shipping coupons attribute to shipping, not line items
The system SHALL record a free-shipping order-coupon's discount amount as the shipping cost it waived, without creating any per-item attribution entries for it.

#### Scenario: A free-shipping coupon is applied on an order
- **WHEN** an order-coupon is a free-shipping coupon
- **THEN** its recorded discount amount equals the shipping cost waived, and no order item has an attribution entry for that coupon

### Requirement: Cancelling an order reverses coupon usage without erasing its record
The system SHALL, when an order with applied coupons is cancelled, decrement each applied coupon's usage count and mark that order's coupon-usage as reversed, while keeping the order-coupon's discount and attribution records intact.

#### Scenario: An order with multiple applied coupons is cancelled
- **WHEN** an order that has more than one applied coupon is cancelled
- **THEN** the system decrements each applied coupon's usage count exactly once and the order's order-coupon records remain visible with their original discount amounts, marked as no longer counting toward any usage limit

### Requirement: Orders placed before this change are not migrated
The system SHALL NOT attempt to backfill order-coupon or order-item-coupon records for orders that were placed before this capability existed.

#### Scenario: Viewing a pre-existing order's coupon data
- **WHEN** an order placed before this change is viewed
- **THEN** the system does not require or synthesize order-coupon or order-item-coupon records for it
