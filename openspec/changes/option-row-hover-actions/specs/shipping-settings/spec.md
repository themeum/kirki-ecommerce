## ADDED Requirements

### Requirement: Shipping profiles are listed with their rule usage

The Shipping Profiles section SHALL list every saved shipping profile, and for each profile
SHALL indicate how many shipping rules reference it and how many zones those rules belong to.
A profile referenced by no rule SHALL show neither indicator.

#### Scenario: Profile referenced by rules in several zones

- **WHEN** a profile is referenced by three shipping rules spread across three zones
- **THEN** its row shows "3 Rules" and "In Use: 3 Zones"

#### Scenario: Profile referenced by rules within one zone

- **WHEN** a profile is referenced by two rules that both belong to the same zone
- **THEN** its row shows "2 Rules" and "In Use: 1 Zones"

#### Scenario: Unused profile

- **WHEN** no shipping rule references a profile
- **THEN** its row shows the profile name with no usage indicators

#### Scenario: Rules identify profiles by name

- **WHEN** a shipping rule's condition stores a profile reference
- **THEN** usage is counted by matching that stored value against the profile's name

### Requirement: Shipping profiles can be created, edited and deleted from the section

The Shipping Profiles section SHALL offer a control to create a profile, and each listed
profile SHALL be editable and deletable from its row.

#### Scenario: Creating a profile

- **WHEN** the merchant activates the create control
- **THEN** a dialog opens for naming a new profile
- **AND** saving it adds the profile to the list

#### Scenario: Editing a profile

- **WHEN** the merchant activates a row's edit control
- **THEN** the dialog opens pre-filled with that profile's current name

#### Scenario: Empty section

- **WHEN** no shipping profiles exist
- **THEN** the section shows the placeholder text "Added shipping profiles will appear here"
- **AND** the create control is still available

### Requirement: Deleting a shipping profile is reversible for a short window

Deleting a shipping profile SHALL remove it from the list immediately and offer an undo for a
short window before the deletion is sent to the server.

#### Scenario: Undo within the window

- **WHEN** the merchant deletes a profile and chooses undo before the notice closes
- **THEN** the profile is restored to the list in its previous position
- **AND** no delete request is sent to the server

#### Scenario: Window elapses

- **WHEN** the undo notice closes without being used
- **THEN** the profile is deleted on the server and the list reflects the server state

#### Scenario: Deletion is not silently reverted

- **WHEN** the profile list is refreshed while the undo window is still open
- **THEN** the deleted profile does not reappear in the list
