## ADDED Requirements

### Requirement: Tax-rule edits are staged and saved with the page

Adding, editing, or deleting a tax rule — in a general region's country-wide tax
rules section, on a state's page, or in the EU region's tax rules section — SHALL
update that page's form only and mark the tax settings form as having unsaved
changes. None of these edits SHALL be persisted on their own; they are written
only when the merchant saves the page, through the same Save path that persists
the page's rates. Discarding SHALL restore the rule list that was last loaded or
saved.

A delete MAY offer an immediate local undo. Activating the undo SHALL restore the
removed rule to the form. Declining it (letting the affordance dismiss itself)
SHALL leave the rule removed from the form and the form still dirty — it SHALL
NOT persist the removal.

This is a form-side concern only; the persisted rule shape and the stored
location of a region's or a state's rules are unchanged.

#### Scenario: Adding a rule stages an unsaved change

- **WHEN** the merchant adds a tax rule in any of the three tax rules sections
- **THEN** the rule appears in that section's list
- **AND** the tax settings form reports unsaved changes
- **AND** nothing is written to the settings API until the merchant saves

#### Scenario: Editing a rule stages an unsaved change

- **WHEN** the merchant edits an existing tax rule
- **THEN** the list shows the edited rule
- **AND** the tax settings form reports unsaved changes
- **AND** nothing is written to the settings API until the merchant saves

#### Scenario: Deleting a rule stages an unsaved change

- **WHEN** the merchant deletes a tax rule and does not undo the removal
- **THEN** the rule is gone from the list
- **AND** the tax settings form reports unsaved changes
- **AND** nothing is written to the settings API until the merchant saves

#### Scenario: Undoing a delete restores the rule

- **WHEN** the merchant deletes a tax rule and then activates the removal's undo
  affordance
- **THEN** the rule is back in the list in its original position

#### Scenario: Saving persists the staged rule edits

- **WHEN** the merchant has added, edited, or deleted tax rules and activates Save
- **THEN** the region or state is persisted with exactly the rules shown in the
  list
- **AND** the tax settings form no longer reports unsaved changes

#### Scenario: Discarding reverts the staged rule edits

- **WHEN** the merchant has added, edited, or deleted tax rules and activates
  Discard
- **THEN** the list returns to the rules that were last loaded or saved
- **AND** the tax settings form no longer reports unsaved changes
