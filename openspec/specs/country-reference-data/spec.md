# country-reference-data Specification

## Purpose

Defines how the plugin's read-only country and state reference dataset is sourced, kept
consistent, and exposed to the admin API, the storefront, and internal consumers, so the
dataset's storage format can change without altering anything a consumer observes.

## Requirements

### Requirement: Country list output shape is stable

The country list exposed to consumers SHALL be a sequentially indexed list in which each
country carries its own nested list of states. The set of fields, their names, their key
order, and the nesting of states SHALL NOT change when the underlying storage format changes.
Ordering is explicitly NOT part of this guarantee: it is determined by the active locale, as
required by "Country and state lists are ordered by their translated name".

#### Scenario: Internal storage format changes

- **WHEN** the dataset's storage format is changed
- **AND** no consumer-facing requirement is otherwise modified
- **THEN** the country list returned to consumers carries the same keys, field names, key order, and nested state entries as before the change

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

### Requirement: Country and state names are translatable

Every country name and every state name in the dataset SHALL be exposed to the translation
system, so that a translator can supply localized names and the product displays them.

#### Scenario: Extracting translatable strings

- **WHEN** translatable strings are extracted from the plugin source
- **THEN** all 250 country names appear as translatable strings
- **AND** all 4,991 state names appear as translatable strings

#### Scenario: Displaying a translated country

- **WHEN** a translation for a country name exists for the active locale
- **AND** an address form or the country list is rendered
- **THEN** the translated name is shown in place of the English one

#### Scenario: Falling back to the source language

- **WHEN** no translation exists for a country or state name in the active locale
- **THEN** the English name is shown

#### Scenario: Translation does not alter stored values

- **WHEN** a customer selects a country and state under a non-English locale
- **THEN** the persisted country value is the ISO country code
- **AND** the persisted state value is the numeric state identifier
- **AND** both are identical to what the same selection would persist in English

### Requirement: Country and state lists are ordered by their translated name

The country list SHALL be ordered by the displayed country name under the active locale, and
each country's states SHALL be ordered by the displayed state name. Ordering SHALL be applied
after translation, not before.

#### Scenario: Ordering under a non-English locale

- **WHEN** the country list is requested under a locale with translated country names
- **THEN** the countries are ordered by their translated names
- **AND** not by the order they occupy in the stored dataset

#### Scenario: States are ordered within their country

- **WHEN** a country's states are rendered
- **THEN** they are ordered by their displayed names

#### Scenario: Locale-aware collation is unavailable

- **WHEN** the runtime provides no locale-aware collation facility
- **THEN** the lists are still returned in a deterministic, accent-insensitive alphabetical order
- **AND** no error is surfaced to the user

### Requirement: Country search matches the ISO country code

The admin country selector SHALL match a typed ISO country code as well as the displayed
country name, so that a code remains a usable way to find a country when the name has been
translated.

#### Scenario: Searching by code

- **WHEN** an administrator types a country's ISO code into the country selector
- **THEN** that country is offered as a match

#### Scenario: Searching by translated name

- **WHEN** an administrator types part of a country's name as displayed in the active locale
- **THEN** that country is offered as a match

### Requirement: European Union membership is derived from the country dataset

European Union membership SHALL be determined from the country dataset itself rather than from
a separate list of member countries. There SHALL be exactly one place in the product where a
country's EU membership is recorded.

#### Scenario: Identifying a member country

- **WHEN** a country that is an EU member is tested for membership
- **THEN** it is reported as a member

#### Scenario: Identifying a non-member country

- **WHEN** a country that is not an EU member is tested for membership
- **THEN** it is reported as not a member

#### Scenario: Membership is unaffected by the display language

- **WHEN** membership is tested under a locale that translates country names
- **THEN** the same set of countries is reported as members as under the source language

#### Scenario: Membership drives tax treatment

- **WHEN** tax handling is resolved for an address in a member country
- **THEN** the EU tax treatment is selected
- **AND** the selection does not depend on any country list other than the dataset
