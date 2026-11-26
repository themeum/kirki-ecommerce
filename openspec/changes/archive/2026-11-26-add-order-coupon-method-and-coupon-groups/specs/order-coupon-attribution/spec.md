## ADDED Requirements

### Requirement: An order coupon records the method of its coupon

The system SHALL record on each order coupon the method of the coupon (`code` or `automatic`) at the time the coupon is applied to the order. A coupon that stays on an order through an edit SHALL keep its recorded method. An order coupon with no method recorded, including every order coupon that exists before this requirement, SHALL read as `code`.

#### Scenario: Checkout with a code coupon

- **WHEN** an order is placed with a coupon whose method is `code`
- **THEN** the order coupon records the method `code`

#### Scenario: Checkout with an automatic coupon

- **WHEN** an order is placed with a coupon whose method is `automatic`
- **THEN** the order coupon records the method `automatic`

#### Scenario: Editing an order keeps the recorded method

- **WHEN** an order is edited and a coupon stays on it
- **THEN** that order coupon keeps its recorded method, even if the live coupon changed method since

#### Scenario: An order placed before the method was recorded

- **WHEN** an order coupon was stored before the method was recorded
- **THEN** its method reads as `code`
