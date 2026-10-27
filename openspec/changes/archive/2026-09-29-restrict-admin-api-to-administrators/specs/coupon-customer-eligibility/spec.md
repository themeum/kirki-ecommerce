## Purpose

Defines who counts as a registered customer versus a guest when a coupon is restricted to, or excludes, registered customers or guests - so a signed-in shopper is never treated as a guest just because their first order has not created a customer record yet.

## ADDED Requirements

### Requirement: A signed-in shopper counts as a registered customer for coupon eligibility

When a coupon is applied to a cart, the shopper SHALL count as a registered customer for the coupon's registered-customer and guest restrictions if the cart belongs to a signed-in WordPress user, whether or not a customer record exists for them yet. A shopper SHALL count as a guest only when the cart has no signed-in owner and no customer record.

#### Scenario: Signed-in shopper without a customer record applies a registered-customers-only coupon

- **WHEN** a signed-in user with no customer record applies a coupon restricted to registered customers to their cart
- **THEN** the coupon is applied

#### Scenario: Signed-in shopper without a customer record applies a guests-only coupon

- **WHEN** a signed-in user with no customer record applies a coupon restricted to guests to their cart
- **THEN** the coupon is rejected with the guest-checkout-only message

#### Scenario: Signed-in shopper without a customer record applies a coupon that excludes registered customers

- **WHEN** a signed-in user with no customer record applies a coupon that excludes registered customers
- **THEN** the coupon is rejected

#### Scenario: Guest applies a registered-customers-only coupon

- **WHEN** a visitor who is not signed in applies a coupon restricted to registered customers to their cart
- **THEN** the coupon is rejected with the "Please login to use this coupon." message
