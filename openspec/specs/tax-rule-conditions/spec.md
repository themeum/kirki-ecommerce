# tax-rule-conditions Specification

## Purpose
Defines the set of decision conditions and actions a merchant can choose from when
composing a tax rule, and guarantees that set is uniform no matter which tax region
strategy (general country, general state, EU) the rule is being composed on.
## Requirements
### Requirement: Tax rule conditions are uniform across region strategies

Every tax region strategy SHALL offer the same condition list when a merchant composes
a tax rule: tax profile, destination region, and product categories. A condition SHALL
NOT be offered unless the tax engine actually evaluates it against real data — product
profile and cart subtotal are excluded because the tax calculation context never
populates values for them, so a rule built against either could never match. No region
strategy SHALL offer a narrower or different condition list than another.

#### Scenario: Composing a rule on a general country region

- **WHEN** a merchant composes a tax rule on a general (country-level) tax region
- **THEN** the condition options include tax profile, destination region, and product
  categories

#### Scenario: Composing a rule on a general state sub-region

- **WHEN** a merchant composes a tax rule on a state/province sub-region of a general
  tax region
- **THEN** the condition options are the same as on the country-level region, including
  destination region

#### Scenario: Composing a rule on an EU region

- **WHEN** a merchant composes a tax rule on the EU tax region
- **THEN** the condition options are the same as on a general tax region

### Requirement: Every condition row on a tax rule offers the full condition set

A tax rule with more than one condition SHALL offer the same full condition list on
every row. No row SHALL be restricted to a subset of the conditions available to the
first row.

#### Scenario: Adding a second condition to a tax rule

- **WHEN** a merchant adds a second condition to a tax rule
- **THEN** the second condition row offers the same condition options as the first row

### Requirement: A selectable condition's value control offers real choices

Any tax rule condition that is matched against a list of existing records SHALL
populate its value control with those records. A condition SHALL NOT be offered in the
condition list if its value control cannot be populated.

#### Scenario: Selecting the product categories condition

- **WHEN** a merchant selects the product categories condition on a tax rule
- **THEN** the value control offers the store's existing product categories

### Requirement: Tax rules offer the full set of tax actions

A tax rule's outcome SHALL be selectable from the complete set of tax actions: set
product tax rate, set shipping tax rate, and set product tax exempt.

#### Scenario: Choosing a tax rule's outcome

- **WHEN** a merchant selects the outcome for a tax rule
- **THEN** the action options include set product tax rate, set shipping tax rate, and
  set product tax exempt

### Requirement: Tax rules only save when they can take effect

A tax rule SHALL NOT be saved while any condition lacks a value, while a rate action
lacks a numeric rate, or while a set shipping tax rate action is combined with any
condition other than destination region (the shipping tax context carries only the
destination address).

#### Scenario: Saving a shipping tax rate rule with a tax profile condition

- **WHEN** a merchant saves a rule whose action is set shipping tax rate and one of
  whose conditions is tax profile
- **THEN** the rule is not saved and an error explains that shipping tax rate rules can
  only use destination conditions

#### Scenario: Saving a rate action without a rate

- **WHEN** a merchant saves a rule whose action is set product tax rate or set shipping
  tax rate with a blank or non-numeric rate
- **THEN** the rule is not saved and the rate field shows an error
