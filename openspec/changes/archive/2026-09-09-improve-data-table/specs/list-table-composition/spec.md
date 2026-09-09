## ADDED Requirements

### Requirement: Every list table declares a stable identifier

A list table SHALL declare an identifier that is stable for that list across releases and
independent of the route it is reached by. This identifier SHALL be the name under which the
merchant's per-table preferences are held.

#### Scenario: Declaring a table

- **WHEN** a developer wires a new list table
- **THEN** they declare an identifier for it

#### Scenario: Two tables on one screen

- **WHEN** a screen carries two list tables
- **THEN** each declares its own identifier and their preferences do not collide

#### Scenario: A route is renamed

- **WHEN** the route a list is reached by changes
- **THEN** the table's identifier is unchanged and the merchant's preferences survive

### Requirement: A feature does not supply its own sorting or filtering affordances

A feature SHALL NOT present a sort control of its own alongside the table, and SHALL NOT present its
own summary of the filters in force. Sorting SHALL be reached through the column headers, and the
count of filters in force and the means to clear them SHALL be presented by the shared filter
overlay's trigger.

#### Scenario: Sorting a list

- **WHEN** a merchant wants to change how a list is ordered
- **THEN** the only affordance is the column headers

#### Scenario: No toolbar sort toggle

- **WHEN** a developer opens a feature's toolbar module
- **THEN** it carries no control for flipping the sort direction

#### Scenario: Seeing what is filtered

- **WHEN** filters are in force
- **THEN** the filter overlay's trigger reports how many, and no separate summary is presented
  elsewhere on the screen

## MODIFIED Requirements

### Requirement: A sortable column's identifier is the field the service sorts by

Where a column is sortable, its identifier SHALL be the field name the backing
service accepts for sorting. A feature SHALL NOT carry a separate sort-key
declaration alongside the identifier.

A column SHALL be declared sortable only where the backing service declares that
field as sortable. Because a service returns its default order rather than an error
when it does not recognise a field, a column declared sortable without a matching
service field presents an affordance that silently does nothing, and SHALL be
treated as a defect.

#### Scenario: Declaring a sortable column

- **WHEN** a developer makes a column sortable
- **THEN** the column's identifier is the service's field name for it
- **AND** no second name for the same thing is introduced

#### Scenario: The service does not accept the field

- **WHEN** a column is declared sortable but the backing service does not declare that field
- **THEN** this is a defect: either the service declares the field, or the column is not sortable

#### Scenario: A column that cannot be ordered

- **WHEN** a column presents an image or a set of row actions rather than a value
- **THEN** it is not declared sortable
