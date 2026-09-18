## Purpose

Defines how the plugin's read-only country and state reference dataset is sourced, kept
consistent, and exposed to the admin API, the storefront, and internal consumers, so the
dataset's storage format can change without altering anything a consumer observes.

## ADDED Requirements

### Requirement: Country dataset is available without shipping its source form

The distributed plugin SHALL contain the country and state dataset only in the form the
runtime actually consumes. The authoring source from which that form is produced SHALL NOT
be included in the distributed package.

#### Scenario: Building the distributable package

- **WHEN** the plugin package is built
- **THEN** the package contains the runtime country dataset
- **AND** the package does not contain the authoring source file

#### Scenario: Runtime dataset is derived from the authoring source

- **WHEN** the runtime dataset is regenerated from the authoring source
- **THEN** the regenerated output is byte-identical to the committed runtime dataset
- **AND** a build that detects any difference fails

### Requirement: Country list output shape is stable

The country list exposed to consumers SHALL be a sequentially indexed list in which each
country carries its own nested list of states. This shape SHALL NOT change when the
underlying storage format changes.

#### Scenario: Internal storage format changes

- **WHEN** the dataset's storage format is changed
- **AND** no consumer-facing requirement is otherwise modified
- **THEN** the country list returned to consumers is identical to the list returned before the change, including ordering, keys, field names, and nested state entries

#### Scenario: Storefront address forms receive the dataset

- **WHEN** a storefront page that renders an address form is requested
- **THEN** that page receives the full country list in the stable shape
- **AND** each country in it carries its states

### Requirement: Country endpoints return countries and their states

The system SHALL expose a read-only endpoint returning all countries, and a read-only
endpoint returning a single country identified by its ISO country code. Both SHALL include
each country's states.

#### Scenario: Listing all countries

- **WHEN** a client requests the country list
- **THEN** the response contains every country in the dataset
- **AND** each country includes its name, ISO code, phone code, currency details, flag, and states

#### Scenario: Requesting a known country

- **WHEN** a client requests a country by an ISO code present in the dataset
- **THEN** the response contains that country and its states

#### Scenario: Requesting an unknown country

- **WHEN** a client requests a country by an ISO code not present in the dataset
- **THEN** the system responds with a not-found error

#### Scenario: Country code casing is ignored

- **WHEN** a client requests a country using lowercase or mixed-case ISO code
- **THEN** the system resolves the same country as for the uppercase code

### Requirement: Group-filtered country results are returned as a list

When the country list is filtered to a named group, the result SHALL be serialized as a
sequentially indexed list, consistent with the unfiltered result.

#### Scenario: Filtering by group

- **WHEN** a client requests the country list filtered to a group
- **THEN** the response body is a JSON array containing only countries in that group
- **AND** the response is not a JSON object keyed by the positions those countries occupied in the unfiltered dataset

#### Scenario: Filtering does not affect later reads

- **WHEN** the country list is read with a group filter applied
- **AND** the country list is subsequently read without a group filter
- **THEN** the second read returns the complete dataset

### Requirement: State identifiers are unchanged by a storage format change

Each state entry SHALL carry its name and the existing numeric identifier. The value the
system persists for a customer's or order's selected state SHALL remain that numeric
identifier, so that changing how the dataset is stored cannot invalidate already-persisted
addresses and orders.

#### Scenario: Reading a country's states

- **WHEN** a country's states are read
- **THEN** each state carries a name and a numeric identifier

#### Scenario: Saving an address

- **WHEN** a customer saves an address with a state selected
- **THEN** the numeric state identifier is persisted
- **AND** addresses and orders saved before this change resolve to the same state as before

### Requirement: Countries without states are identifiable from the country index

The dataset SHALL record, for every country, whether that country has any states, so that a
consumer holding only the country index can determine this without reading state data.

#### Scenario: Country that has no states

- **WHEN** the index entry for a country with no states is read
- **THEN** it indicates that the country has no states

#### Scenario: Country that has states

- **WHEN** the index entry for a country with one or more states is read
- **THEN** it indicates that the country has states
