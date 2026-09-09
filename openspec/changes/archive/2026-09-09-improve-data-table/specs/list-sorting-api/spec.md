## Purpose

Defines how a list endpoint orders its results: how the sort field named in a request is resolved
to something the database can order by, how a column that is derived rather than stored is made
sortable, and how an unrecognised field or direction is handled.

## ADDED Requirements

### Requirement: Each listable resource declares its sortable fields

Every service backing a list endpoint SHALL declare the set of sort fields it accepts, and SHALL
declare it in exactly one place. This declaration SHALL be the sole authority on what may be sorted
by; no other layer SHALL keep a second list of accepted sort fields.

#### Scenario: Making a field sortable

- **WHEN** a developer makes a field sortable on a resource
- **THEN** exactly one declaration is edited
- **AND** the endpoint accepts that field with no further change

#### Scenario: No competing allowlist

- **WHEN** a request names a sort field
- **THEN** it is checked against the resource's declaration and nowhere else

### Requirement: A sort field may resolve to a stored column, an alias, or a subquery

A declared sort field SHALL resolve to whatever the database needs to order by it: the name of a
stored column, the alias of a value the list query already computes, or a subquery. A field whose
value is derived rather than stored SHALL therefore be sortable on the same terms as any other.

#### Scenario: Sorting by a stored column

- **WHEN** a client sorts by a field backed by a stored column
- **THEN** results are ordered by that column

#### Scenario: Sorting by a counted relation

- **WHEN** a client sorts by a field whose value is a count of related records
- **THEN** results are ordered by that count

#### Scenario: Sorting by a value held on a related record

- **WHEN** a client sorts by a field whose value lives on a related record rather than the listed
  one
- **THEN** results are ordered by that related value

#### Scenario: A request field need not match the column name

- **WHEN** the field name a client sends differs from the underlying column's name
- **THEN** the declaration maps one to the other and ordering still applies

### Requirement: An unrecognised sort field falls back to the resource's default order

When a request names a sort field the resource does not declare, the endpoint SHALL return results
in that resource's default order rather than failing. The response SHALL still be a successful one.

#### Scenario: Unknown sort field

- **WHEN** a client requests a sort field the resource does not declare
- **THEN** the endpoint responds successfully with results in the resource's default order

#### Scenario: No sort field named

- **WHEN** a client names no sort field
- **THEN** results are returned in the resource's default order

### Requirement: A malformed sort direction is rejected without failing the request

The sort direction SHALL be constrained to ascending or descending. A direction outside that set
SHALL fall back to the resource's default direction. It SHALL NOT reach the query layer, and SHALL
NOT produce a server error.

#### Scenario: Malformed direction

- **WHEN** a client sends a sort direction that is neither ascending nor descending
- **THEN** the endpoint responds successfully using the resource's default direction
- **AND** no server error is raised

#### Scenario: Direction applies to any accepted field

- **WHEN** a client sorts an accepted field descending
- **THEN** results are ordered by that field descending

### Requirement: A value computed outside the database is not sortable

Where a field presented by a list is derived at serialization time rather than stored, aliased or
joinable — because resolving it needs application logic or configuration the query cannot reach —
that field SHALL NOT be declared sortable. Restating such logic as an ordering expression SHALL be
treated as duplication, since the resource already resolves it and the list already filters on it.

#### Scenario: A status derived from application rules

- **WHEN** a list presents a status resolved in application code from several stored values plus
  configuration
- **THEN** that field is absent from the resource's sortable declaration
- **AND** the column presents no sort affordance

#### Scenario: Requesting it anyway

- **WHEN** a client names such a field as its sort field
- **THEN** it is unrecognised, and results come back in the resource's default order
