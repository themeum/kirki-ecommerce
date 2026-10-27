## Purpose

Ensures that a bulk operation which fails partway undoes its own database changes and tells the caller what went wrong, instead of crashing or leaving half-applied results.

## ADDED Requirements

### Requirement: A failed bulk operation rolls back and reports the intended error

When a bulk variant update or a bulk customer deletion fails after it has started changing data, the operation SHALL roll back its database changes and SHALL return the operation's own error response. It SHALL NOT end in an unhandled server error caused by the rollback itself.

#### Scenario: Bulk variant update with one failing variant

- **WHEN** a bulk variant update contains a variant that cannot be updated after earlier variants in the same request were updated
- **THEN** none of the request's variant changes are kept
- **AND** the response is the "variant could not be updated" error naming the failing variant, not a server error

#### Scenario: Bulk customer deletion fails partway

- **WHEN** deleting customers raises an error after some deletions have run
- **THEN** the operation's database changes are rolled back
- **AND** the original error is returned to the caller

#### Scenario: Successful operation

- **WHEN** every item in a bulk variant update or customer deletion succeeds
- **THEN** all changes are committed
