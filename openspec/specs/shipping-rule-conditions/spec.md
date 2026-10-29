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

### Requirement: Cart weight is compared in the store weight unit

The cart weight condition SHALL compare the total cart weight in the store's default
weight unit. Each line's weight SHALL be converted from the unit of its variant to the
store unit before the lines are added. The rule value SHALL be read as a number in the
store unit.

#### Scenario: Lines in different units

- **WHEN** the store unit is kg and the cart holds one line of 500 g and one line of 1 kg
- **THEN** the cart weight is 1.5 and a rule "cart weight greater than 1" matches

#### Scenario: Quantity is applied after conversion

- **WHEN** the store unit is kg and the cart holds 3 units of a variant that weighs 250 g
- **THEN** the cart weight is 0.75

#### Scenario: Variant weight in pounds with a kilogram store

- **WHEN** the store unit is kg and a cart holds one variant that weighs 2 lb
- **THEN** a rule "cart weight less than 1" matches, because the cart weighs about 0.907 kg

#### Scenario: Variant without a weight unit

- **WHEN** a variant has a weight but no weight unit
- **THEN** its weight is counted as being in the store unit

### Requirement: Weight-based shipping rates use the store weight unit

A weight-based shipping method SHALL select its rate from the total cart weight in the
store's default weight unit, using the same conversion as the cart weight condition.
The weight ranges of the method SHALL be read in the store unit.

#### Scenario: Range lookup with mixed units

- **WHEN** the store unit is kg, a weight range runs from 1 to 2, and the cart holds 800 g plus 400 g
- **THEN** the total weight is 1.2 and that range is selected
