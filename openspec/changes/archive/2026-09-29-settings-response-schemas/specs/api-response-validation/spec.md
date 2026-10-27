## ADDED Requirements

### Requirement: A response schema is traceable to the documented API contract

Every response schema SHALL be derivable from the recorded contract for the endpoint it validates — the documented success response in `docs/ecommerce/` — rather than from a shape inferred by reading the consuming component.

Where the recorded contract and an existing hand-written type disagree, the contract SHALL be treated as authoritative for which fields exist and whether they can be absent. A field present only in the hand-written type SHALL be retained as optional rather than dropped, since the type may record real behavior the contract omits.

A schema SHALL be verified against the recorded response body before it ships, so that a schema which would reject real data fails during development rather than in front of a merchant.

#### Scenario: Documented response body

- **WHEN** a response schema is introduced for an endpoint with a recorded contract
- **THEN** the documented success body for that endpoint parses against the schema

#### Scenario: Hand-written type contradicts the contract

- **WHEN** an existing type declares a field the contract shows as absent, or declares as required a field the contract shows as omitted
- **THEN** the schema follows the contract, and the field is kept as optional rather than removed

#### Scenario: Endpoint shape differs from what callers assume

- **WHEN** an endpoint returns a shape the calling code does not expect, such as a keyed object where a list is read
- **THEN** the normalization is performed as part of validation rather than as an unchecked fallback, so the resulting value is both reshaped and validated

### Requirement: A settings read is typed by its section

The settings endpoint serves a different set of fields per section. A read of one section SHALL be validated and typed against that section's own shape, not against a combined shape covering every section.

A caller reading a section SHALL therefore receive that section's fields as present, and SHALL NOT receive fields belonging to other sections. Code MUST NOT need to assert or widen the returned type to reach the fields its own section provides.

#### Scenario: Reading a section

- **WHEN** a caller reads a named settings section
- **THEN** the response is validated against that section's shape and the caller receives that section's fields

#### Scenario: Reading a field from another section

- **WHEN** a caller reads a field that belongs to a different settings section than the one requested
- **THEN** the project typecheck fails

#### Scenario: Application configuration is not a settings section

- **WHEN** the application configuration endpoint is read
- **THEN** it is validated against its own shape rather than being treated as a settings section
