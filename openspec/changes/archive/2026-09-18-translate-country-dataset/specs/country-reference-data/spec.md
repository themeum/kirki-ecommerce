## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Country dataset is available without shipping its source form

**Reason**: The dataset is no longer produced from a separate authoring source. The committed
PHP files are themselves the source of truth, maintained directly, so there is no longer an
authoring file to exclude from the package and no regeneration step whose output could drift
from it. The one-time conversion that this requirement governed has been completed.

**Migration**: None for consumers — the runtime dataset and everything served from it are
unaffected. For maintainers, dataset edits are now made directly in
`resources/data/countries.php` and `resources/data/states.php` rather than by editing a source
file and regenerating.
