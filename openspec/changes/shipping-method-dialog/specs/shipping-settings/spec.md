## ADDED Requirements

### Requirement: Shipping methods are added and edited in a dialog

A shipping method SHALL be added and edited in a dialog that opens over the list the
merchant started from, and not on a separate screen. The dialog SHALL be reachable from the
method list on a zone's screen (to add and to edit) and from the method list on the Shipping
settings page (to edit). When the merchant edits a method, the dialog MUST show the values
that the list already holds, without a request to load that method. The dialog SHALL offer
**Cancel** and **Save**.

#### Scenario: Adding a method from a zone

- **WHEN** the merchant activates the add control of the method list on a zone's screen
- **THEN** a dialog titled "Add Shipping Method" opens with an empty method form, and the zone's screen stays behind it

#### Scenario: Editing a method from a zone

- **WHEN** the merchant activates the edit control of a listed method on a zone's screen
- **THEN** a dialog titled "Edit Shipping Method" opens with that method's stored values and rules

#### Scenario: Editing a method from the Shipping settings page

- **WHEN** the merchant activates the edit control of a method listed below a zone on the Shipping settings page
- **THEN** the same dialog opens with that method's stored values and rules, and the merchant stays on the Shipping settings page

#### Scenario: Unsaved work on the Shipping settings page

- **WHEN** the merchant activates a method's edit control while the Shipping settings page holds unsaved changes
- **THEN** the unsaved-changes confirmation is presented before the dialog opens

#### Scenario: No request to load the method

- **WHEN** the dialog opens for an existing method
- **THEN** the form is filled immediately from the listed data and no loading state is shown

#### Scenario: Saving a new method

- **WHEN** the merchant completes a valid new method and selects Save
- **THEN** the method is stored in the zone the dialog was opened for, the dialog closes, and the method appears in the list

#### Scenario: Saving an existing method

- **WHEN** the merchant changes an existing method and selects Save
- **THEN** the change is stored, the dialog closes, the list shows the updated method, and the method's enabled state is unchanged

#### Scenario: Save is rejected

- **WHEN** the merchant selects Save and validation or the server rejects the method
- **THEN** the dialog stays open, the offending fields show their messages, and nothing is stored

#### Scenario: Cancelling

- **WHEN** the merchant selects Cancel or closes the dialog
- **THEN** the dialog closes, nothing is stored, and a later opening does not show the abandoned input

### Requirement: Rules are stored together with their method

Rules that the merchant adds, edits, or deletes in the method dialog SHALL be stored only
when the method is saved, in the same save as the method's other values. A rule change MUST
NOT be stored when the merchant leaves the dialog without a save. Rules SHALL be available
for a new method before that method is saved for the first time.

#### Scenario: Rules on a new method

- **WHEN** the merchant opens the dialog to add a method
- **THEN** the Rules card is shown and the merchant can add a rule before the method is saved

#### Scenario: Rule saved with the method

- **WHEN** the merchant adds a rule in the dialog and then selects Save
- **THEN** the stored method contains that rule

#### Scenario: Rule changes discarded

- **WHEN** the merchant adds, edits, or deletes a rule in the dialog and then selects Cancel
- **THEN** the stored method's rules are unchanged

#### Scenario: Destination choices for a new method

- **WHEN** the merchant composes a destination rule for a method that is not saved yet
- **THEN** the destination choices are the regions of the zone the dialog was opened for

## MODIFIED Requirements

### Requirement: Shipping rules are created without leaving the method

A shipping rule SHALL be composed in the method dialog itself. While a rule is being
composed the merchant MUST be able to abandon it, leaving the rules already in the dialog
untouched.

#### Scenario: Composing a rule

- **WHEN** the merchant starts adding a rule
- **THEN** the condition and outcome inputs appear in the method dialog alongside the existing rules

#### Scenario: Abandoning a rule

- **WHEN** the merchant cancels a rule being composed
- **THEN** no rule is added and the rules already in the dialog are unchanged

#### Scenario: Editing an existing rule

- **WHEN** the merchant edits a rule in the dialog
- **THEN** the rule's current values are loaded for editing in place of that rule's summary
