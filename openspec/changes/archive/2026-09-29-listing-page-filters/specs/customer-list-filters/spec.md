## Purpose

Defines how a merchant narrows the customer list by where customers are, which of a
customer's addresses that location is read from, and how the offered locations are drawn from the
merchant's own customer base rather than from a global reference list.

## ADDED Requirements

### Requirement: The customer list filters by location

The customer list SHALL offer a country filter and a city filter, each holding one value, plus a
default on each meaning no filter. A customer SHALL be listed when their default shipping address
matches the selected country, and when it matches the selected city. A customer with no default
shipping address SHALL NOT be listed while either location filter is in force.

#### Scenario: Filtering by country

- **WHEN** a merchant selects a country
- **THEN** the list holds only customers whose default shipping address is in that country

#### Scenario: Filtering by city

- **WHEN** a merchant selects a city
- **THEN** the list holds only customers whose default shipping address is in that city

#### Scenario: Filtering by country and city together

- **WHEN** a merchant selects a country and a city
- **THEN** the list holds only customers whose default shipping address matches both

#### Scenario: A customer without a default shipping address

- **WHEN** a location filter is in force and a customer has no default shipping address
- **THEN** that customer is not listed

#### Scenario: No location filter

- **WHEN** neither country nor city is selected
- **THEN** location does not narrow the list
- **AND** customers without any address are still listed

### Requirement: Location options come from the customer base

The country and city options SHALL be the distinct locations present on customers' default shipping
addresses, not a global reference list of countries or cities. Selecting any offered option SHALL
therefore always be capable of matching at least one customer at the time the options were read.

#### Scenario: A country with no customers

- **WHEN** no customer has a default shipping address in a given country
- **THEN** that country is not offered as an option

#### Scenario: A country with customers

- **WHEN** at least one customer has a default shipping address in a given country
- **THEN** that country is offered as an option

#### Scenario: No customers have addresses

- **WHEN** no customer has a default shipping address
- **THEN** no country or city options are offered

### Requirement: The city options depend on the selected country

The city options SHALL be limited to cities within the selected country. Changing the country
SHALL re-read the city options and SHALL clear a city selection that is no longer among them.
Clearing the country SHALL clear the city selection.

#### Scenario: Choosing a country narrows the cities

- **WHEN** a merchant selects a country
- **THEN** only cities within that country are offered

#### Scenario: Changing the country

- **WHEN** a city is selected and the merchant changes the country to one that does not contain it
- **THEN** the city selection is cleared
- **AND** the cities offered are those of the newly selected country

#### Scenario: Clearing the country

- **WHEN** a country and a city are selected and the merchant clears the country
- **THEN** the city selection is cleared

### Requirement: Unrecognised customer list filter values are rejected

The customer list SHALL reject a filter value that is not of the expected shape with a validation
error rather than applying it. A rejected request SHALL NOT return a silently empty list.

#### Scenario: A malformed filter value

- **WHEN** the customer list is requested with a location filter value that is not valid
- **THEN** the request is rejected with a validation error

#### Scenario: A valid but unmatched value

- **WHEN** the customer list is requested with a well-formed country that matches no customer
- **THEN** the request succeeds and returns an empty list
