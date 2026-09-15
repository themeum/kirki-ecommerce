## Purpose

Lets a shopper apply more than one valid coupon to their cart at the same time — mixing item-specific and cart-wide coupons — and see the combined discount computed live, with every coupon's contribution reconciled to the cent.

## ADDED Requirements

### Requirement: Multiple coupons can be applied to a cart
The system SHALL allow more than one coupon to be applied to a cart simultaneously, validating each new coupon independently against the cart's current state without disturbing already-applied coupons.

#### Scenario: Applying a second coupon keeps the first
- **WHEN** a shopper applies a coupon code to a cart that already has a different valid coupon applied
- **THEN** the system adds the new coupon to the cart's applied coupons and keeps the existing coupon applied

#### Scenario: Applying the same coupon twice is rejected
- **WHEN** a shopper applies a coupon code that is already applied to the cart
- **THEN** the system rejects the request as a duplicate and the cart's applied coupons are unchanged

### Requirement: One of several applied coupons can be removed independently
The system SHALL allow a shopper to remove a single applied coupon from a cart that has multiple coupons applied, without affecting the other applied coupons.

#### Scenario: Removing one coupon leaves the rest applied
- **WHEN** a shopper removes one coupon from a cart that has multiple coupons applied
- **THEN** the system removes only that coupon and recomputes the cart's totals using the remaining applied coupons

### Requirement: Item-scoped and cart-wide coupons combine in a fixed order
The system SHALL apply item-scoped coupons (targeting specific products) to their eligible items before applying cart-wide coupons (targeting the whole order), so cart-wide discounts are computed against the subtotal remaining after item-scoped discounts.

#### Scenario: A product coupon and an order coupon are both applied
- **WHEN** a cart has an item-scoped coupon eligible on one item and a cart-wide coupon applied
- **THEN** the system discounts the eligible item by the item-scoped coupon first, then applies the cart-wide coupon's discount against the subtotal that remains after that item-scoped discount

#### Scenario: Two item-scoped coupons target the same item
- **WHEN** two item-scoped coupons are both eligible on the same cart item
- **THEN** the system applies both coupons' discounts to that item, summed, without one coupon capping or excluding the other

#### Scenario: Two cart-wide coupons are applied together
- **WHEN** more than one cart-wide coupon is applied to a cart
- **THEN** the system applies them sequentially, each computed against the subtotal remaining after the previous cart-wide coupon's discount

### Requirement: Combined discounts reconcile exactly
The system SHALL ensure that discount amounts computed across multiple coupons and distributed across multiple items always sum exactly to the stated totals, with no fractional unit lost or invented.

#### Scenario: A cart-wide coupon's discount is split across items
- **WHEN** a cart-wide coupon's discount is allocated proportionally across more than one item
- **THEN** the sum of that coupon's per-item discount amounts equals exactly that coupon's total discount amount

#### Scenario: Multiple coupons' totals sum to the cart discount total
- **WHEN** multiple coupons are applied to a cart
- **THEN** the sum of every applied coupon's individual discount total equals exactly the cart's overall discount total

### Requirement: An individually invalid coupon does not disable the rest
The system SHALL drop only the applied coupon that has become invalid (expired, deactivated, or no longer meeting its conditions) from the cart's discount calculation, keeping every other still-valid applied coupon in effect.

#### Scenario: One of several applied coupons expires
- **WHEN** a cart has multiple applied coupons and one of them becomes invalid before checkout
- **THEN** the system excludes only the invalid coupon from the calculated discount and continues applying the remaining valid coupons

### Requirement: Free shipping coupons coexist with amount-off coupons
The system SHALL allow a free-shipping coupon to be applied alongside an amount-off coupon, waiving the shipping fee independently of the amount-off coupon's item or cart-wide discount.

#### Scenario: Free shipping and amount-off applied together
- **WHEN** a cart has a free-shipping coupon and an amount-off coupon both applied
- **THEN** the system waives the shipping fee and separately applies the amount-off coupon's discount to eligible items or the cart subtotal
