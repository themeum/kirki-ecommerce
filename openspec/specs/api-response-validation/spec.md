# api-response-validation Specification

## Purpose

Defines how the admin app validates data returned by the API before it reaches application code, and what happens when a response does not match its declared shape.

## Requirements

### Requirement: Responses are validated against declared schemas

Every API operation SHALL validate its response against a declared schema before returning it to application code. Response types MUST be derived from those schemas rather than declared separately, so a response type cannot claim a shape the validation does not enforce.

This applies to all operations, including delete and bulk operations that return only an acknowledgement.

#### Scenario: Response matches its schema

- **WHEN** an API operation returns data matching its declared schema
- **THEN** the validated data is returned to the caller with its derived type

#### Scenario: Delete operation response

- **WHEN** a delete or bulk operation completes
- **THEN** its response is validated against a declared schema rather than accepted unchecked

#### Scenario: Response type asserted without validation

- **WHEN** code claims a response type for an operation that does not validate against a schema
- **THEN** the project typecheck fails

### Requirement: Response envelope is validated

The wrapper carrying every API response — its success indicator and message — SHALL be validated alongside the data it contains, so that code reading the message of a response is reading a value known to exist.

#### Scenario: Malformed envelope

- **WHEN** a response arrives without the expected success indicator or message
- **THEN** it is treated as a validation failure rather than passed through

### Requirement: Validation failures are reported to the user

When a response fails validation, the operation SHALL fail rather than return partial or unchecked data, and the user MUST be informed. This applies uniformly to reads and writes — a write whose response fails validation MUST NOT complete silently.

Diagnostic detail identifying the offending fields SHALL be recorded for developers.

#### Scenario: Read response fails validation

- **WHEN** a list or detail response does not match its schema
- **THEN** the operation fails and the user is shown an error

#### Scenario: Write response fails validation

- **WHEN** a create, update, or delete response does not match its schema
- **THEN** the operation fails and the user is shown an error rather than the interface appearing to succeed

#### Scenario: Developer diagnostics

- **WHEN** any response fails validation
- **THEN** the failing field paths and expected shapes are recorded for developers

### Requirement: Schemas tolerate benign backend variation

Response schemas SHALL accept absent or null values for fields the interface does not require, so that a backend adding or omitting an optional field does not break the admin app for merchants.

Tightening a schema so that previously accepted data is rejected is a behavioral change and MUST be evaluated separately from adding validation coverage.

#### Scenario: Backend omits an optional field

- **WHEN** a response omits a field the interface treats as optional
- **THEN** validation succeeds and the interface renders without that value

#### Scenario: Backend adds an unrecognized field

- **WHEN** a response includes a field not present in the declared schema
- **THEN** validation succeeds and the unrecognized field is ignored
