# cart-customer-email Specification

## Purpose

Lets a cart carry the shopper's contact email before an order is placed, so email-based rules (such as first-time-buyer coupons) can be checked while a guest is still on the cart.

## Requirements

### Requirement: The cart stores an optional contact email

A cart SHALL accept an optional contact email on update and return it with the cart. The value SHALL be a valid email address or empty. An invalid email SHALL be rejected with a field-level validation error. Sending an empty value SHALL clear the stored email.

#### Scenario: Guest saves a contact email to the cart

- **WHEN** a guest updates their cart with `customer_email` set to a valid email
- **THEN** the cart response includes that `customer_email`

#### Scenario: Invalid email is rejected

- **WHEN** a cart update sends `customer_email` that is not a valid email address
- **THEN** the request is rejected with a validation error on `customer_email`

#### Scenario: Omitting the field leaves the stored email unchanged

- **WHEN** a cart update omits `customer_email`
- **THEN** the cart keeps its previously stored `customer_email`

### Requirement: Storefront checkout keeps the guest contact email in sync with the cart

On the storefront checkout, a guest's contact email SHALL be saved to the cart once it is a valid email address. The contact field SHALL be pre-filled from the cart's stored email when the checkout loads. Applying a coupon SHALL first save any valid contact email that has not reached the cart yet, so the coupon is checked against the email the shopper can see.

#### Scenario: Guest types an email, then applies a coupon right away

- **WHEN** a guest enters a valid email and applies a first-time-buyer coupon before the debounced cart update has run
- **THEN** the email is saved to the cart before the coupon is checked

#### Scenario: Guest reloads the checkout

- **WHEN** a guest who saved a contact email to the cart reloads the checkout page
- **THEN** the contact email field shows the stored email

#### Scenario: Partially typed email is not sent

- **WHEN** the guest's contact field holds an incomplete or invalid email
- **THEN** no `customer_email` is sent with the cart update, and the other cart fields still update
