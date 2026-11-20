# Spec Delta

## MODIFIED Requirements

### Requirement: Multiple coupons can be applied to a cart
The system SHALL allow more than one coupon to be applied to a cart simultaneously, validating each new coupon independently against the cart's current state without disturbing already-applied coupons. A coupon that cannot be combined with an already-applied coupon (see `coupon-combinability`) SHALL be rejected.

#### Scenario: Applying a second coupon keeps the first
- **WHEN** a shopper applies a coupon code to a cart that already has a different valid coupon applied
- **THEN** the system adds the new coupon to the cart's applied coupons and keeps the existing coupon applied

#### Scenario: Applying the same coupon twice is rejected
- **WHEN** a shopper applies a coupon code that is already applied to the cart
- **THEN** the system rejects the request as a duplicate and the cart's applied coupons are unchanged

#### Scenario: Applying a coupon that cannot be combined is rejected
- **WHEN** a shopper applies a coupon code to a cart that already has a coupon, and one of the two coupons has `is_combinable` set to `false`
- **THEN** the system rejects the new coupon and the cart's applied coupons are unchanged

### Requirement: One of several applied coupons can be removed independently
The system SHALL allow a shopper to remove a single applied coupon from a cart that has multiple coupons applied, without affecting the other applied coupons. The system SHALL NOT allow a shopper to remove an applied `automatic` coupon (see `automatic-coupon-application`).

#### Scenario: Removing one coupon leaves the rest applied
- **WHEN** a shopper removes one coupon from a cart that has multiple coupons applied
- **THEN** the system removes only that coupon and recomputes the cart's totals using the remaining applied coupons

#### Scenario: Removing an automatic coupon is rejected
- **WHEN** a shopper removes an automatic coupon from a cart that has multiple coupons applied
- **THEN** the system rejects the request and every applied coupon stays on the cart
