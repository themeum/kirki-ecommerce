## MODIFIED Requirements

### Requirement: Sort state is translated between address and table

The address SHALL hold sort state as a field name and a direction. The table SHALL
express sort state as an ordered set of column identifiers with a descending flag.
The binding SHALL translate between them.

When the table reports no sort at all, the binding SHALL remove the sort field and
direction from the address, so that the list returns to the default sort declared in
the feature's list configuration.

#### Scenario: Reading sort state

- **WHEN** the address holds a sort field and a descending direction
- **THEN** the table receives that column identifier marked descending

#### Scenario: Table requests a sort

- **WHEN** the table reports sorting by a column identifier in descending order
- **THEN** the address is updated with that field name and a descending direction

#### Scenario: Table reports no sort

- **WHEN** the table reports no sort at all
- **THEN** the sort field and direction are removed from the address
- **AND** the table receives the feature's default sort field and direction

#### Scenario: No sort held in the address

- **WHEN** the address holds no sort field
- **THEN** the table receives the feature's default sort field and direction
