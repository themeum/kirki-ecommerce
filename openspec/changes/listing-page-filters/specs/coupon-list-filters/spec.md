## Purpose

Defines how a merchant narrows the coupon list by a coupon's lifecycle status, how that
status is derived rather than stored, and how the list responds to a filter value it does not
recognise.

## ADDED Requirements

### Requirement: The coupon list filters by lifecycle status

The coupon list SHALL offer a status filter holding one value, covering active, scheduled, not
active and expired, plus a default meaning no status filter. Status SHALL be derived from whether
the coupon is enabled and from its start and end moments relative to now, not read from a stored
status value.

#### Scenario: Active coupons

- **WHEN** a merchant selects active
- **THEN** the list holds only enabled coupons that have started and have not ended

#### Scenario: Scheduled coupons

- **WHEN** a merchant selects scheduled
- **THEN** the list holds only enabled coupons whose start is still in the future

#### Scenario: Expired coupons

- **WHEN** a merchant selects expired
- **THEN** the list holds only enabled coupons whose end has passed

#### Scenario: Coupons that are not active

- **WHEN** a merchant selects not active
- **THEN** the list holds only coupons that are disabled, whatever their dates

#### Scenario: A coupon that crosses its end moment

- **WHEN** an enabled coupon's end moment passes
- **THEN** it stops being listed under active
- **AND** starts being listed under expired, without any stored value changing

### Requirement: The coupon list filters by method and discount type

The coupon list SHALL offer a method filter covering code and automatic, and a discount type filter
covering amount off, free shipping and buy X get Y. Each SHALL hold one value plus a default meaning
no filter.

#### Scenario: Filtering by method

- **WHEN** a merchant selects the code method
- **THEN** the list holds only coupons a shopper redeems with a code

#### Scenario: Filtering by discount type

- **WHEN** a merchant selects free shipping
- **THEN** the list holds only free-shipping coupons

#### Scenario: Combining status, method and type

- **WHEN** a merchant selects active, automatic and amount off
- **THEN** the list holds only coupons satisfying all three

### Requirement: Unrecognised coupon filter values are rejected

The coupon list SHALL reject a status, method or discount type it does not recognise with a
validation error naming the offending field. It SHALL NOT accept the value and return an empty list,
which is indistinguishable from a filter that legitimately matched nothing.

#### Scenario: An unrecognised status

- **WHEN** the coupon list is requested with a status outside the supported set
- **THEN** the request is rejected with a validation error

#### Scenario: An unrecognised discount type

- **WHEN** the coupon list is requested with a discount type outside the supported set
- **THEN** the request is rejected with a validation error

#### Scenario: A recognised status matching nothing

- **WHEN** the coupon list is requested with a supported status that no coupon currently holds
- **THEN** the request succeeds and returns an empty list
