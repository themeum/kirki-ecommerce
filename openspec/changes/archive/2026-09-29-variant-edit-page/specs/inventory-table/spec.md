## MODIFIED Requirements

### Requirement: The inventory table is read-only

The inventory table SHALL NOT offer any control for changing a variant's values.
No cell SHALL accept text entry, and the screen SHALL NOT present a save or
discard action, nor change its heading in response to viewing or selecting rows.

Editing SHALL be reachable from this screen in two ways: activating a row, which
opens that variant's edit screen; and selecting rows and invoking the bulk-edit
action, which navigates to the bulk-edit screen. Activating a row's selection
control SHALL select the row without opening the variant.

#### Scenario: No cell accepts input

- **WHEN** a merchant clicks any cell in the inventory table
- **THEN** no editable field appears and no value can be changed in place

#### Scenario: Heading is stable

- **WHEN** a merchant selects rows or interacts with the table
- **THEN** the page heading continues to read "Inventory"
- **AND** no save or discard action is offered

#### Scenario: Editing is reached through bulk edit

- **WHEN** a merchant selects one or more rows and applies the bulk-edit action
- **THEN** they are taken to the bulk-edit screen for the selected variants

#### Scenario: Editing one variant is reached by activating its row

- **WHEN** a merchant activates a row
- **THEN** they are taken to that variant's edit screen

#### Scenario: Selecting a row does not open it

- **WHEN** a merchant activates a row's selection control
- **THEN** the row is selected
- **AND** the variant's edit screen is not opened
