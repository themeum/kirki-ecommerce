# cart-item-quantity-limits Specification

## Purpose
Defines how the system validates a cart line's quantity against available stock and the variant's configured per-order limit whenever a shopper adds a variant to their cart.
## Requirements
### Requirement: Stock validation considers the cart line's resulting quantity
When a shopper adds a variant to their cart, the system SHALL validate available stock against the quantity the cart line will hold after the addition (existing quantity for that variant in the cart, if any, plus the requested quantity) — not the requested quantity alone.

#### Scenario: Adding to an empty cart line within stock
- **WHEN** a shopper adds a variant not already in their cart, and the requested quantity does not exceed available stock
- **THEN** the item is added to the cart

#### Scenario: Adding to an existing cart line within stock
- **WHEN** a shopper adds a variant already in their cart, and the existing quantity plus the requested quantity does not exceed available stock
- **THEN** the cart line's quantity is increased by the requested amount

#### Scenario: Addition would exceed available stock once merged with the existing line
- **WHEN** a shopper adds a variant already in their cart, and the existing quantity plus the requested quantity exceeds available stock, even though the requested quantity alone does not
- **THEN** the system rejects the addition with an insufficient-stock error
- **AND** the cart line's quantity is unchanged

### Requirement: Per-order limit validation considers the cart line's resulting quantity
When a shopper adds a variant to their cart, and that variant has a configured per-order limit, the system SHALL validate the limit against the quantity the cart line will hold after the addition (existing quantity for that variant in the cart, if any, plus the requested quantity) — not the requested quantity alone.

#### Scenario: Adding to an existing cart line within the limit
- **WHEN** a shopper adds a variant already in their cart that has a per-order limit, and the existing quantity plus the requested quantity does not exceed that limit
- **THEN** the cart line's quantity is increased by the requested amount

#### Scenario: Addition would exceed the per-order limit once merged with the existing line
- **WHEN** a shopper adds a variant already in their cart that has a per-order limit, and the existing quantity plus the requested quantity exceeds that limit, even though the requested quantity alone does not
- **THEN** the system rejects the addition with a limit-exceeded error
- **AND** the cart line's quantity is unchanged

#### Scenario: Variant without a configured limit is unaffected
- **WHEN** a shopper adds a variant that has no per-order limit configured
- **THEN** the addition is not rejected on limit grounds, regardless of the resulting cart line quantity

### Requirement: Rejected additions do not partially mutate the cart
When an add-to-cart request fails stock or per-order limit validation, the system SHALL leave the cart and its existing items unchanged.

#### Scenario: Failed validation leaves an existing line untouched
- **WHEN** an add-to-cart request for a variant already in the cart fails stock or limit validation
- **THEN** the existing cart line's quantity remains at its pre-request value

#### Scenario: Failed validation does not create a new line
- **WHEN** an add-to-cart request for a variant not yet in the cart fails stock or limit validation
- **THEN** no cart line is created for that variant

