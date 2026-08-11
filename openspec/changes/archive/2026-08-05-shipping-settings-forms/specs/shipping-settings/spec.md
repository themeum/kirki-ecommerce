## Purpose

Defines how a merchant sets up shipping: the zones they ship to, the delivery methods
offered within each zone, and the conditional rules that adjust a method's price — including
what each form requires before it can be saved and what is persisted on save.

## ADDED Requirements

### Requirement: Shipping zone requires a title and at least one destination

A shipping zone SHALL NOT be saved without a title and at least one destination region.
Each failure MUST be reported on the offending field rather than as a page-level or
post-request message.

#### Scenario: Zone saved with no title

- **WHEN** the merchant saves a zone whose title is empty or whitespace-only
- **THEN** the save is blocked and the title field displays its required message

#### Scenario: Zone saved with no destinations

- **WHEN** the merchant saves a zone with no destination region selected
- **THEN** the save is blocked and the regions field displays its required message

#### Scenario: Zone saved with both

- **WHEN** the merchant saves a zone that has a title and at least one destination
- **THEN** the zone is persisted and the form is no longer reported as having unsaved changes

### Requirement: Destinations are searchable and reviewable before saving

The destination control SHALL let the merchant find a country by typing part of its name,
and SHALL show every currently selected destination. A country subdivided into states MUST
allow selecting individual states rather than only the whole country.

#### Scenario: Filtering by typed text

- **WHEN** the merchant types part of a country name into the destination control
- **THEN** only countries matching that text are offered

#### Scenario: No destinations selected yet

- **WHEN** a zone has no destinations selected
- **THEN** the destination area shows an empty-state message instead of an empty box

#### Scenario: Selecting states within a country

- **WHEN** the merchant chooses a country that has states
- **THEN** the merchant can select a subset of that country's states
- **AND** the selected destination reports how many states are included

#### Scenario: Reviewing and removing a destination

- **WHEN** a zone has destinations selected
- **THEN** each is listed individually and can be removed without opening another screen

### Requirement: Shipping method validation depends on the method type

A shipping method SHALL always require a name. Every other required field SHALL be
determined by the selected method type, and a field that is not part of the selected type
MUST NOT block saving.

#### Scenario: Method saved with no name

- **WHEN** the merchant saves a method of any type with an empty name
- **THEN** the save is blocked and the name field displays its required message

#### Scenario: Flat rate without a rate

- **WHEN** the merchant saves a flat-rate method with no rate entered
- **THEN** the save is blocked and the rate field displays its required message

#### Scenario: Local pickup with a fee enabled but no amount

- **WHEN** the merchant enables the pickup fee on a local-pickup method and leaves the fee empty
- **THEN** the save is blocked and the fee field displays its required message

#### Scenario: Local pickup without a fee

- **WHEN** the merchant saves a local-pickup method with the pickup fee disabled
- **THEN** the empty fee does not block the save

#### Scenario: Rate by weight with no ranges

- **WHEN** the merchant saves a rate-by-weight method with no weight range rows
- **THEN** the save is blocked and the weight range area displays its required message

#### Scenario: Field belonging to another type is empty

- **WHEN** the merchant saves a local-pickup method while the flat-rate rate field holds no value
- **THEN** the save succeeds, because the rate is not part of the local-pickup type

### Requirement: Changing method type preserves shared input and discards type-specific input

The name and description SHALL survive a change of method type. Values belonging only to
the previous type MUST NOT be persisted once a different type is selected.

#### Scenario: Switching type keeps the name

- **WHEN** the merchant enters a name and then changes the method type
- **THEN** the name is still present in the form

#### Scenario: Switching type drops the previous type's values

- **WHEN** the merchant enters a flat rate, changes the type to local pickup, and saves
- **THEN** the saved method contains no flat-rate rate value

### Requirement: Weight ranges are edited as a list of rows

A rate-by-weight method SHALL let the merchant maintain any number of weight ranges, each
carrying a lower bound, an upper bound, and a rate. Each row's values MUST be validated
and reported independently of the other rows.

#### Scenario: Adding a range

- **WHEN** the merchant adds a weight range row
- **THEN** an empty row is appended without disturbing values already entered in other rows

#### Scenario: Removing a range

- **WHEN** the merchant removes a weight range row
- **THEN** only that row is removed and the remaining rows keep their values

#### Scenario: Incomplete row

- **WHEN** the merchant saves with a row that has a bound but no rate
- **THEN** the save is blocked and the error is reported on that row's rate input

### Requirement: Shipping rules are created without leaving the method

A shipping rule SHALL be composed on the method screen itself. While a rule is being
composed the merchant MUST be able to abandon it, leaving previously saved rules untouched.

#### Scenario: Composing a rule

- **WHEN** the merchant starts adding a rule
- **THEN** the condition and outcome inputs appear on the method screen alongside the existing rules

#### Scenario: Abandoning a rule

- **WHEN** the merchant cancels a rule being composed
- **THEN** no rule is added and the previously saved rules are unchanged

#### Scenario: Editing an existing rule

- **WHEN** the merchant edits a saved rule
- **THEN** the rule's current values are loaded for editing in place of that rule's summary

### Requirement: Saved rules are described in the merchant's language

A saved rule SHALL be summarized using the same labels the merchant selected it with. Raw
internal identifiers MUST NOT appear in the summary.

#### Scenario: Rule summary wording

- **WHEN** a rule matching a product profile is saved and listed
- **THEN** its summary reads with the selected condition's, operator's, and outcome's display labels
- **AND** contains no underscore-separated internal identifier

#### Scenario: Condition value choices are populated

- **WHEN** the merchant selects a condition that is matched against a list of existing records
- **THEN** that condition's value control offers those records

### Requirement: Method summaries reflect stored method data

Where a shipping method is listed, its summary SHALL be derived from that method's own
stored values, and a disabled method MUST be visibly distinguished from an enabled one.

#### Scenario: Method with a description

- **WHEN** a method has a description
- **THEN** the description is shown as the method's supporting text in the list

#### Scenario: Disabled method

- **WHEN** a method is disabled
- **THEN** it is marked as inactive in the list

### Requirement: Saving a zone-related form sends only shipping zone data

Saving any shipping zone, method, or rule SHALL transmit only the shipping zones collection.
No other stored shipping settings value may be re-sent as a side effect of the save.

#### Scenario: Saving a method

- **WHEN** the merchant saves a shipping method
- **THEN** the request body carries the shipping zones and no other shipping settings field

#### Scenario: Concurrently changed sibling value

- **WHEN** an unrelated shipping settings value changed after the page loaded and the merchant saves a zone
- **THEN** that value is not overwritten by the save
