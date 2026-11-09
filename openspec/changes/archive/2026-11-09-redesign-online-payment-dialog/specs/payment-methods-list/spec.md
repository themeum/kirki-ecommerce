## ADDED Requirements

### Requirement: Header Add opens the payment method dialog

The "Add" button in the header of the Payment methods card SHALL open the
"Add a payment method" dialog directly. It SHALL NOT open a menu, and the card
SHALL NOT offer a blank form to create a new manual method. Existing manual
methods, preset or custom, SHALL stay editable through the edit button, where the
admin can change the name, the instructions and the icon.

#### Scenario: Press Add

- **WHEN** the admin presses "Add" in the Payment methods card
- **THEN** the "Add a payment method" dialog opens and no menu shows

#### Scenario: Edit a preset method

- **WHEN** the admin presses edit on the "Cash on delivery" row
- **THEN** the manual method dialog opens with its name, instructions and icon, and saving keeps its id

#### Scenario: Custom method stays

- **WHEN** a store has a custom manual method from before this change
- **THEN** the method shows in the list and can be edited and deleted

### Requirement: Manual preset icon fallback

A manual method whose id is a manual preset id and that has no uploaded icon SHALL
show the preset's icon: `bank_transfer` a bank building, `cheque` a receipt,
`cod` a banknote. An uploaded icon SHALL always show in place of the
fallback. A manual method with another id and no icon SHALL show the generic
manual icon.

#### Scenario: Preset with no icon

- **WHEN** the list shows the offline method `cod` with no icon
- **THEN** the row shows the banknote icon

#### Scenario: Preset with an uploaded icon

- **WHEN** the admin uploads an icon for the offline method `cod`
- **THEN** the row shows the uploaded icon

#### Scenario: Custom method with no icon

- **WHEN** the list shows a custom offline method with no icon
- **THEN** the row shows the generic manual icon
