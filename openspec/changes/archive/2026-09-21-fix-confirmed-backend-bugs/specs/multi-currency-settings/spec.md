## ADDED Requirements

### Requirement: Exactly one base currency exists

The store SHALL keep exactly one currency flagged as the base currency. Saving a currency as the base SHALL demote every other currency, whether or not the request names them and in whatever order rows arrive. A request that clears the flag on the current base without making another currency the base SHALL NOT leave the store without a base currency.

#### Scenario: Setting a new base with a single-row request

- **WHEN** a request sets one currency as base and does not mention the previous base
- **THEN** that currency is the base
- **AND** the previous base is no longer flagged as base

#### Scenario: Whole-list request, old base first

- **WHEN** the administrator sets a new default in the currency list and the request sends the previous base before the new base
- **THEN** exactly one currency is flagged as base afterwards, the new one

#### Scenario: Whole-list request, new base first

- **WHEN** the same request sends the new base before the previous base
- **THEN** exactly one currency is flagged as base afterwards, the new one

#### Scenario: Clearing the only base

- **WHEN** a request clears the base flag on the current base and no other currency in the request becomes the base
- **THEN** the current base remains the base

#### Scenario: Creating a currency as base

- **WHEN** a currency is created with the base flag while another currency is the base
- **THEN** the new currency is the only base
