# Spec Delta

## Purpose

Lets a merchant create coupons that apply to a shopper's cart on their own, so the shopper gets the discount without typing a code, and the shopper cannot remove it. The admin keeps full control on orders.

## ADDED Requirements

### Requirement: Valid automatic coupons are attached to a storefront cart
The system SHALL attach every `automatic` coupon that is valid for the cart to that cart when the cart is calculated. The system SHALL use the same validation as a coupon code that a shopper types.

#### Scenario: A valid automatic coupon is attached
- **WHEN** a storefront cart is calculated and an active `automatic` coupon is valid for the cart
- **THEN** the coupon is among the cart's applied coupons and its discount is in the cart totals

#### Scenario: An automatic coupon that is not valid is not attached
- **WHEN** a storefront cart is calculated and an `automatic` coupon fails validation for the cart (for example, the minimum spend is not met)
- **THEN** the coupon is not attached to the cart and the cart calculation does not return an error for it

#### Scenario: An attached automatic coupon is not attached twice
- **WHEN** a cart that already has an automatic coupon is calculated again
- **THEN** the cart has that coupon only once

### Requirement: Automatic coupons that become invalid are detached until the order is created
The system SHALL validate each attached automatic coupon again on every cart calculation, up to and including order creation. The system SHALL detach an automatic coupon that is no longer valid, and SHALL NOT return an error for it.

#### Scenario: Automatic coupon stops being valid before checkout
- **WHEN** an automatic coupon is attached to a cart and then becomes invalid (for example, it expires or the cart no longer meets its conditions)
- **THEN** the next calculation detaches the coupon and the cart totals do not include its discount

#### Scenario: Automatic coupon is invalid when the order is created
- **WHEN** a checkout creates an order and an automatic coupon on the cart is no longer valid
- **THEN** the order is created without that coupon and without an error for it

#### Scenario: Automatic coupon becomes valid again
- **WHEN** a detached automatic coupon becomes valid again for the cart before the order is created
- **THEN** the next calculation attaches it again

### Requirement: A shopper cannot remove an automatic coupon
The system SHALL reject a shopper's request to remove an `automatic` coupon from a cart. Coupons with the `code` method SHALL stay removable by the shopper.

#### Scenario: Shopper tries to remove an automatic coupon
- **WHEN** a shopper sends a request to remove an automatic coupon from the cart
- **THEN** the system rejects the request with a validation error and the coupon stays on the cart

#### Scenario: Shopper removes a code coupon
- **WHEN** a shopper sends a request to remove a `code` coupon from the cart
- **THEN** the coupon is removed, as before this change

### Requirement: Automatic coupons are not attached to manual orders
The system SHALL NOT attach automatic coupons on its own to an order that an admin creates by hand. The admin SHALL be able to select an automatic coupon by hand like any other coupon.

#### Scenario: Admin creates a manual order
- **WHEN** an admin creates or previews a manual order and does not select any coupon
- **THEN** the order has no coupon, even if an automatic coupon would be valid for it

#### Scenario: Admin selects an automatic coupon
- **WHEN** an admin selects an automatic coupon on a manual order
- **THEN** the coupon is validated like any other coupon and applied when it is valid

### Requirement: An admin can remove an automatic coupon from an order
The system SHALL let an admin remove an automatic coupon from an existing order during order edit. Order edit SHALL NOT attach automatic coupons on its own.

#### Scenario: Admin removes an automatic coupon during order edit
- **WHEN** an admin edits an order that has an automatic coupon and the update does not include that coupon
- **THEN** the order is saved without the coupon and the totals are recalculated

#### Scenario: Order edit does not add automatic coupons
- **WHEN** an admin edits an order that has no automatic coupon, and an automatic coupon is valid for the order
- **THEN** the order is saved without that coupon

### Requirement: The backend gives an automatic coupon a code
The system SHALL generate a unique code for an `automatic` coupon that is saved without one. A code that the admin sends SHALL be kept. An update that sends no code SHALL keep the code the coupon already has.

#### Scenario: Automatic coupon is created without a code
- **WHEN** an admin creates an `automatic` coupon and sends no code
- **THEN** the coupon is saved with a generated code that no other coupon uses, and the response returns the code

#### Scenario: Automatic coupon is created with a code
- **WHEN** an admin creates an `automatic` coupon and sends a unique code
- **THEN** the coupon is saved with that code

#### Scenario: Automatic coupon is updated without a code
- **WHEN** an admin updates an `automatic` coupon and sends no code
- **THEN** the coupon keeps its stored code

#### Scenario: Coupon changes to the automatic method without a code
- **WHEN** an admin updates a coupon to the `automatic` method, the coupon has no code, and the update sends no code
- **THEN** the coupon is saved with a generated code

#### Scenario: Code coupon without a code is still rejected
- **WHEN** an admin saves a `code` coupon without a code
- **THEN** the system rejects the request with a validation error

