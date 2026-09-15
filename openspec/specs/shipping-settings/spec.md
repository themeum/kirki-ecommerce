## Purpose

Defines how a merchant sets up shipping: the zones they ship to, the delivery methods
offered within each zone, and the conditional rules that adjust a method's price — including
what each form requires before it can be saved and what is persisted on save.

## Requirements

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

### Requirement: Zones are listed expanded and can be collapsed

Every shipping zone in the list SHALL be presented expanded, showing its delivery methods,
without the merchant expanding anything. A zone SHALL be collapsible individually, and
collapsing one zone MUST NOT affect any other zone. A collapse SHALL be treated as a view
preference for the current visit only: the list MUST return to fully expanded when the page
is loaded again.

#### Scenario: Arriving at the shipping settings page

- **WHEN** the merchant opens shipping settings with one or more zones configured
- **THEN** every zone shows its delivery methods without any further interaction

#### Scenario: Collapsing one zone

- **WHEN** the merchant collapses a zone
- **THEN** that zone's delivery methods are hidden
- **AND** every other zone stays expanded

#### Scenario: Re-expanding a collapsed zone

- **WHEN** the merchant expands a zone they previously collapsed
- **THEN** that zone's delivery methods are shown again

#### Scenario: Returning to the page after collapsing

- **WHEN** the merchant collapses a zone and later loads the shipping settings page again
- **THEN** every zone is expanded, including the one that was collapsed

### Requirement: A zone's destinations are summarized in its header

A listed zone SHALL identify its destinations in its own header. At most three destination
country markers SHALL be shown; when the zone covers more countries than that, the header
MUST also report how many further countries are covered. The expanded body of a listed zone
SHALL NOT repeat the destination list.

#### Scenario: Zone covering three or fewer countries

- **WHEN** a zone's destinations span three or fewer countries
- **THEN** its header shows a marker for each of those countries
- **AND** no overflow count is shown

#### Scenario: Zone covering more than three countries

- **WHEN** a zone's destinations span more than three countries
- **THEN** its header shows three country markers followed by a count of the remaining ones

#### Scenario: Expanded body contents

- **WHEN** a zone is expanded
- **THEN** its body contains its delivery methods and no destination list

#### Scenario: Zone with no destinations

- **WHEN** a zone has no destinations
- **THEN** its header shows no country markers and no overflow count

### Requirement: A zone's edit action is reachable without opening a menu

A listed zone SHALL offer editing as a control in the zone's own header, not as an entry in
a menu. That control SHALL be present whether the zone is enabled or disabled. Activating it
MUST behave as editing does elsewhere in settings: any unsaved work is confirmed first, and
the merchant is then taken to that zone's screen.

#### Scenario: Editing an enabled zone

- **WHEN** the merchant activates the edit control on an enabled zone
- **THEN** they are taken to that zone's screen without having opened a menu

#### Scenario: Editing a disabled zone

- **WHEN** a zone is disabled
- **THEN** its edit control is still offered and still opens that zone's screen

#### Scenario: Unsaved work when editing

- **WHEN** the merchant activates the edit control while the page holds unsaved changes
- **THEN** the unsaved-changes confirmation is presented before navigation

### Requirement: Zone activation and deletion are menu actions

A listed zone SHALL offer exactly two actions in its menu: one that flips the zone between
enabled and disabled, and one that deletes the zone. The activation entry SHALL be labelled
for the action it performs, so a merchant reads what will happen rather than the zone's
current state. No separate always-visible activation toggle SHALL be offered in the zone
header.

#### Scenario: Menu on an enabled zone

- **WHEN** the merchant opens an enabled zone's menu
- **THEN** it offers exactly a deactivate action and a delete action

#### Scenario: Menu on a disabled zone

- **WHEN** the merchant opens a disabled zone's menu
- **THEN** it offers exactly an activate action and a delete action

#### Scenario: Toggling activation from the menu

- **WHEN** the merchant chooses the activation entry in a zone's menu
- **THEN** that zone's enabled state flips
- **AND** the zone's appearance updates to reflect the new state

#### Scenario: No inline activation control

- **WHEN** a zone is listed
- **THEN** its header offers no activation toggle outside the menu

### Requirement: A listed method's actions are available on the method itself

Within an expanded zone, each delivery method SHALL offer editing, deletion, and a control
that enables or disables that method, without leaving the list. A method's price summary and
its actions MUST NOT compete for the same space: when a method's actions are available, the
price summary gives way to them.

#### Scenario: Reaching a method's actions

- **WHEN** the merchant directs attention to a listed delivery method, by pointer or by
  keyboard
- **THEN** that method's edit, delete, and enable/disable controls become available

#### Scenario: Price summary while actions are shown

- **WHEN** a method's actions are available
- **THEN** that method's price summary is not shown in their place

#### Scenario: Disabling a method from the list

- **WHEN** the merchant disables a method from within the zone list
- **THEN** the method is marked inactive in the list without the merchant opening it
