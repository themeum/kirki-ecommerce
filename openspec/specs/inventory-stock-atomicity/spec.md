# inventory-stock-atomicity Specification

## Purpose

Guarantees that stock quantities stay correct when many checkout, order-edit and cancel requests change the same variant at the same time, so a store never sells stock it does not have.

## Requirements

### Requirement: Reserving stock never oversells
When stock is reserved for a variant that tracks inventory and does not allow back orders, the system SHALL reserve it only if the available quantity at the moment of the change covers the requested quantity. When two or more requests compete for the same stock, the system MUST let requests succeed only up to the stock that exists, and MUST fail the rest with the existing "insufficient stock" validation error.

#### Scenario: Two requests compete for the last unit
- **WHEN** a variant has an available quantity of 1 and two requests each reserve 1 unit at the same time
- **THEN** exactly one request succeeds, the other fails with an insufficient stock error, and the available quantity is 0

#### Scenario: Stock changes between the check and the change
- **WHEN** a request checked stock as sufficient, but another request took the stock before this request changed it
- **THEN** this request fails with an insufficient stock error and changes no quantity

#### Scenario: A failed reserve changes nothing
- **WHEN** a reserve fails because the stock is short
- **THEN** the available quantity and the committed quantity of the variant are the same as before the request

#### Scenario: Back orders stay allowed
- **WHEN** a variant allows back orders and a request reserves more than the available quantity
- **THEN** the reserve succeeds and the available quantity may become negative

#### Scenario: Untracked variants are not limited
- **WHEN** a variant does not track inventory and a request reserves any quantity
- **THEN** the reserve succeeds and no quantity changes

### Requirement: Decreasing stock never oversells
When the available quantity of a variant that tracks inventory and does not allow back orders is decreased directly, the system SHALL apply the same guarantee as for a reserve: the available quantity MUST NOT become negative.

#### Scenario: Concurrent direct decreases
- **WHEN** a variant has an available quantity of 1 and two requests each decrease it by 1 at the same time
- **THEN** exactly one request succeeds, the other fails with an insufficient stock error, and the available quantity is 0

### Requirement: Releasing and confirming stock never exceed the committed quantity
When reserved stock is released or confirmed, the system SHALL move or remove at most the committed quantity that exists at the moment of the change. The committed quantity MUST NOT become negative, and a release MUST add back to the available quantity only the amount it took from the committed quantity.

#### Scenario: Release asks for more than is committed
- **WHEN** a request releases 5 units and the committed quantity is 3
- **THEN** 3 units move from committed to available and the committed quantity is 0

#### Scenario: Two releases compete for the same committed stock
- **WHEN** the committed quantity is 2 and two requests each release 2 units at the same time
- **THEN** the total moved back to available is 2, and the committed quantity is 0, never negative

#### Scenario: Confirm asks for more than is committed
- **WHEN** a request confirms 5 units and the committed quantity is 3
- **THEN** the committed quantity becomes 0 and the available quantity does not change

### Requirement: Stock alerts follow successful changes only
The system SHALL raise low-stock and out-of-stock alerts only for stock changes that were applied, and MUST NOT raise an alert for a request that failed because of a race.

#### Scenario: Losing request raises no alert
- **WHEN** a reserve fails with an insufficient stock error
- **THEN** no low-stock or out-of-stock alert is raised for that request
