## ADDED Requirements

### Requirement: Offline create accepts a client id

`POST /offline-payments` SHALL accept an optional string `id`. When `id` is
present, the created method SHALL use it. When `id` is absent or empty, the
system SHALL generate a UUID. When an offline method with the same `id` already
exists, the request SHALL fail with HTTP 409 and SHALL NOT change the stored
methods.

#### Scenario: Create with an id

- **WHEN** a client posts `{ "id": "cheque", "name": "Cheque payments" }` and no method `cheque` exists
- **THEN** the response has status 201 and the created method has the id `cheque`

#### Scenario: Create without an id

- **WHEN** a client posts a method with no `id`
- **THEN** the created method has a generated UUID id

#### Scenario: Duplicate id

- **WHEN** a client posts `{ "id": "cod", ... }` and a method `cod` exists
- **THEN** the response has status 409 and the stored methods do not change
