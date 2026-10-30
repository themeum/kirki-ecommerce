# Spec Delta

## ADDED Requirements

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
