# weight-unit-conversion Specification

## Purpose
Defines how a weight is converted between the supported weight units, so that weights
entered in different units can be added and compared in one unit, the store's default
weight unit.
## Requirements
### Requirement: Weights convert between supported units

The system SHALL convert a weight between the supported weight units (g, kg, lb, oz)
and return the value in the target unit.

#### Scenario: Converting kilograms to grams

- **WHEN** 1.5 kg is converted to g
- **THEN** the result is 1500

#### Scenario: Converting pounds to kilograms

- **WHEN** 1 lb is converted to kg
- **THEN** the result is 0.45359237

#### Scenario: Converting ounces to grams

- **WHEN** 1 oz is converted to g
- **THEN** the result is 28.349523125

#### Scenario: Same unit

- **WHEN** a weight is converted to the unit it is already in
- **THEN** the value is returned unchanged

### Requirement: The store weight unit is the default target

When no target unit is given, the system SHALL convert to the store's default weight
unit from the product settings.

#### Scenario: Store unit is kilograms

- **WHEN** the store weight unit is kg and 500 g is converted without a target unit
- **THEN** the result is 0.5

#### Scenario: Store unit is pounds

- **WHEN** the store weight unit is lb and 16 oz is converted without a target unit
- **THEN** the result is 1

### Requirement: A missing or unknown unit never breaks a conversion

When the source unit is missing, empty, or not a supported weight unit, the system
SHALL return the weight unchanged, treating it as already in the target unit. When
the target unit is not a supported weight unit, the system SHALL also return the
weight unchanged.

#### Scenario: Variant without a unit

- **WHEN** a weight of 2 is converted from an empty unit
- **THEN** the result is 2

#### Scenario: Unit that is not a weight unit

- **WHEN** a weight is converted from a volume unit such as ml
- **THEN** the weight is returned unchanged and no error is raised
