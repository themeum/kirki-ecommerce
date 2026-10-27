## Purpose

Guarantees that a coupon's total usage limit and its per-customer limit hold when several orders use the same coupon at the same time.

## ADDED Requirements

### Requirement: Total usage limit holds under concurrent orders
When an order is placed with a coupon that has a usage limit, the system SHALL count the use only if the counted uses at the moment of the change are below the limit. When requests compete for the last remaining uses, the system MUST let only as many succeed as the limit allows, and MUST fail the others with the existing "Coupon usage limit reached" error. A failed order MUST NOT keep any part of the order.

#### Scenario: Two orders compete for the last use
- **WHEN** a coupon has a limit of 10 and 9 uses, and two orders apply it at the same time
- **THEN** exactly one order succeeds, the other fails with the usage limit error, and the usage count is 10

#### Scenario: The losing order is rolled back
- **WHEN** an order fails because the coupon limit was reached by another order
- **THEN** no order, order item, order coupon or stock reservation from that request remains

#### Scenario: Coupons without a limit are not restricted
- **WHEN** a coupon has no usage limit and many orders apply it
- **THEN** every order succeeds and each use is counted

### Requirement: Per-customer limit holds under concurrent orders
When a coupon has a per-customer limit, the system SHALL verify the customer's usage again when the coupon use is counted, so two simultaneous orders from one customer cannot exceed the limit.

#### Scenario: One customer submits two orders at the same time
- **WHEN** a coupon has a per-customer limit of 1 and one customer submits two orders that apply it at the same time
- **THEN** exactly one order succeeds and the other fails with the per-customer limit error

### Requirement: Reversed usage is counted once
When an order is cancelled or edited so a coupon is removed, the system SHALL reverse that coupon use once only. The usage count MUST NOT go below zero, and a repeated or racing reversal MUST NOT reverse the use a second time.

#### Scenario: Two cancel requests for one order
- **WHEN** two cancel requests for the same order run at the same time and the order used a coupon
- **THEN** the coupon usage count goes down by 1 in total, not by 2
