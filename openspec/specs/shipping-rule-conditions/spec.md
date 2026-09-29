# shipping-rule-conditions Specification

## Purpose
Defines the set of decision conditions and actions a merchant can choose from when
composing a shipping method rule, kept in step with the conditions the backend decision
registry actually supports.
## Requirements
### Requirement: Shipping rules offer the full set of shipping-relevant conditions

A shipping method rule's condition options SHALL include destination region, cart
weight, cart subtotal, shipping profile, and product categories. A condition SHALL NOT
be offered unless the shipping calculation context actually populates values for it —
product profile is excluded because nothing in the shipping calculation context sets a
value for it, so a rule built against it could never match.

#### Scenario: Composing a rule on a shipping method

- **WHEN** a merchant composes a rule on a shipping method
- **THEN** the condition options include destination region, cart weight, cart
  subtotal, shipping profile, and product categories

### Requirement: Cart subtotal is a distinct condition from cart weight

The cart subtotal condition SHALL be offered as its own selectable option, distinct
from and not merged with the cart weight condition, and SHALL be keyed and labeled as
cart subtotal.

#### Scenario: Selecting the cart subtotal condition

- **WHEN** a merchant selects the cart subtotal condition on a shipping rule
- **THEN** the rule is stored with the cart subtotal condition type, not cart weight

#### Scenario: Cart weight remains separately available

- **WHEN** a merchant opens the condition list on a shipping rule
- **THEN** cart weight and cart subtotal both appear as separate, correctly labeled
  options

### Requirement: Shipping rule values are complete before saving

A shipping rule SHALL NOT be saved while its condition lacks a value, while cart weight
or cart subtotal has a non-numeric value, or while a set, add, or multiply shipping cost
action lacks a numeric value. Cart subtotal values SHALL be entered in the store's base
currency major units.

#### Scenario: Multiplying the shipping cost

- **WHEN** a merchant selects the multiply shipping cost action
- **THEN** a multiplier field is shown and the rule cannot be saved without a number

#### Scenario: Comparing the cart subtotal

- **WHEN** a merchant selects the cart subtotal condition
- **THEN** they can choose greater than, equal to, or less than and enter an amount
