## ADDED Requirements

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
