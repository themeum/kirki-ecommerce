## Purpose

Defines which address fields each country actually uses, whether each one is optional or
required, and what it is called, so that address forms ask customers only for information their
country uses and never block them on a field their country has no value for.

## ADDED Requirements

### Requirement: Each country declares how its address fields behave

The system SHALL hold, for every country it offers, a rule for the state field and a rule for
the postal code field. Each rule SHALL state whether the field is hidden, optional, or
required. The state rule SHALL also carry the term used for that field in the country.

#### Scenario: Country that does not use a state field

- **WHEN** the rules for a country whose addresses carry no subdivision are read
- **THEN** the state field is marked hidden

#### Scenario: Country that requires a state

- **WHEN** the rules for a country whose addresses require a subdivision are read
- **THEN** the state field is marked required
- **AND** the rule carries the term that country uses for it

#### Scenario: Country that does not use postal codes

- **WHEN** the rules for a country whose addresses carry no postal code are read
- **THEN** the postal code field is marked hidden

#### Scenario: Country with subdivisions that are not required

- **WHEN** a country has subdivisions in the dataset but its addresses do not require one
- **THEN** the state field is marked optional
- **AND** its subdivisions remain available to choose from

### Requirement: Address forms render only the fields the country uses

An address form SHALL render a field only when the selected country's rule marks it optional or
required. A field the rule marks hidden SHALL NOT be rendered, and SHALL NOT be submitted.

#### Scenario: Selecting a country with no state field

- **WHEN** a customer selects a country whose state field is hidden
- **THEN** no state field is shown

#### Scenario: Selecting a country with no postal code

- **WHEN** a customer selects a country whose postal code field is hidden
- **THEN** no postal code field is shown

#### Scenario: Switching country updates the form

- **WHEN** a customer changes the selected country
- **THEN** the fields shown, their labels, and which of them are required update to match the newly selected country

#### Scenario: Field label reflects the country's own term

- **WHEN** an address form is rendered for a country that names its subdivision differently
- **THEN** the state field is labelled with that country's term rather than a generic one

### Requirement: Address validation follows the country's rules

Validation SHALL require a field only when the selected country's rule marks it required, and
SHALL NOT reject an address for omitting a field that country marks hidden or optional. The same
rules SHALL be applied when an address is submitted directly to the system, not only in the
browser.

#### Scenario: Omitting an optional state

- **WHEN** a customer submits an address for a country whose state field is optional
- **AND** no state is chosen
- **THEN** the address is accepted

#### Scenario: Omitting a required state

- **WHEN** a customer submits an address for a country whose state field is required
- **AND** no state is chosen
- **THEN** the address is rejected with an error naming that country's term for the field

#### Scenario: Omitting a postal code where the country has none

- **WHEN** a customer submits an address for a country whose postal code field is hidden
- **AND** no postal code is given
- **THEN** the address is accepted

#### Scenario: Submitting directly to the system

- **WHEN** an address is submitted without going through the browser form
- **THEN** the same country rules decide which fields are required

### Requirement: Address rules are available to consumers

The system SHALL expose each country's address rules to the clients that render address forms,
so that a client applies the stored rules rather than carrying its own copy.

#### Scenario: Storefront receives the rules

- **WHEN** a storefront page that renders an address form is requested
- **THEN** that page receives the address rules for the countries it can offer

#### Scenario: Reading a country through the API

- **WHEN** a client requests a country
- **THEN** the response includes that country's address rules

### Requirement: Existing addresses remain valid

Introducing address rules SHALL NOT invalidate addresses or orders already stored, including
ones holding a state value for a country whose state field is now hidden.

#### Scenario: Viewing an address saved before the rules existed

- **WHEN** a stored address holds a state for a country whose state field is now hidden
- **THEN** the address is still displayed and usable
- **AND** the stored value is not discarded
