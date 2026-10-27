## Purpose

Ensures the customer list's "delete all" removes only the customers the administrator is looking at, so a filtered list can never lead to deleting more customers than it shows.

## ADDED Requirements

### Requirement: Delete-all applies every active customer list filter

A bulk "delete all" on customers SHALL select the customers to delete using the same filters the customer list supports: search text, date range, country and city. A filter that the list honors SHALL NOT be ignored by delete-all.

#### Scenario: Deleting all customers in a country

- **WHEN** the administrator filters the customer list by a country and runs "delete all"
- **THEN** only customers matching that country are deleted
- **AND** customers in other countries remain

#### Scenario: Deleting all customers in a city

- **WHEN** the administrator filters the customer list by a country and a city and runs "delete all"
- **THEN** only customers matching both are deleted

#### Scenario: No filters

- **WHEN** the administrator runs "delete all" with no filters applied
- **THEN** every customer is deleted, as before
