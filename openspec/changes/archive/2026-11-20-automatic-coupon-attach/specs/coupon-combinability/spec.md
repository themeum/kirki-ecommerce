# Spec Delta

## Purpose

Lets a merchant mark a coupon, of any method, as not combinable with other coupons, and defines which coupon stays when two coupons cannot be applied together.

## ADDED Requirements

### Requirement: A coupon has an is_combinable setting that defaults to true
The system SHALL store an `is_combinable` setting for every coupon, for both `code` and `automatic` coupons. The setting SHALL be `true` for every existing coupon and for every new coupon that does not set it.

#### Scenario: Existing coupons keep stacking
- **WHEN** a store upgrades to the version that adds the setting
- **THEN** every existing coupon has `is_combinable` set to `true` and the cart behaves as before the upgrade

#### Scenario: New coupon without the setting
- **WHEN** a coupon is created without an `is_combinable` value
- **THEN** the coupon is saved with `is_combinable` set to `true`

#### Scenario: Admin sets the setting
- **WHEN** an admin creates or updates a coupon with `is_combinable` set to `false`
- **THEN** the coupon is saved with `is_combinable` set to `false` and the coupon responses show the value

### Requirement: A non-combinable coupon cannot be applied with another coupon
The system SHALL reject a coupon when it is not combinable and another coupon is already applied. The system SHALL also reject a coupon when any already applied coupon is not combinable. The coupon that is already applied SHALL stay applied.

#### Scenario: Non-combinable coupon is applied to a cart that has a coupon
- **WHEN** a shopper applies a coupon with `is_combinable` set to `false` to a cart that already has another coupon
- **THEN** the system rejects the new coupon with a validation error and the cart keeps its coupons

#### Scenario: Coupon is applied to a cart that has a non-combinable coupon
- **WHEN** a shopper applies any coupon to a cart whose applied coupon has `is_combinable` set to `false`
- **THEN** the system rejects the new coupon with a validation error and the non-combinable coupon stays on the cart

#### Scenario: Combinable coupons stack
- **WHEN** a shopper applies a coupon with `is_combinable` set to `true` to a cart whose applied coupons all have `is_combinable` set to `true`
- **THEN** the system applies the coupon, as before this change

#### Scenario: Non-combinable coupon is the only coupon
- **WHEN** a cart has no other coupon and a coupon with `is_combinable` set to `false` is applied
- **THEN** the system applies the coupon

### Requirement: Combinability applies to every path that applies coupons
The system SHALL use the same combinability rule for coupon codes in a cart, for automatic coupons, and for coupons on manual order create and order edit. On order edit, a coupon that is already stored on the order SHALL stay, and the new coupon SHALL be rejected when they conflict.

#### Scenario: Automatic coupon conflicts with an applied code coupon
- **WHEN** a cart has a non-combinable code coupon applied and an automatic coupon is valid for the cart
- **THEN** the automatic coupon is not attached and the code coupon stays

#### Scenario: Code coupon conflicts with an attached automatic coupon
- **WHEN** a cart has a non-combinable automatic coupon attached and a shopper applies a code coupon
- **THEN** the system rejects the code coupon and the automatic coupon stays

#### Scenario: Admin adds a conflicting coupon on order edit
- **WHEN** an admin adds a coupon to an order whose stored coupon is non-combinable
- **THEN** the new coupon is reported as invalid and the stored coupon keeps its discount
