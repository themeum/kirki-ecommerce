## ADDED Requirements

### Requirement: The tax rules editor is composed inline within its section

In any of the three tax rules sections — a general region's country-wide
section, a state's page, or the EU region's section — the editor for adding
or editing a rule SHALL appear inline within that section, not in a modal
overlay. While a rule is being composed or edited the rest of the region or
state page SHALL remain visible and the merchant MUST be able to abandon the
edit, leaving previously staged rules untouched.

This is a presentation concern only. It does not change how tax-rule edits
are staged and saved with the page, the condition types each section offers,
the editor's fields or validation, or the persisted rule shape.

#### Scenario: Adding a rule

- **WHEN** the merchant starts adding a tax rule in a section
- **THEN** the condition and action inputs appear inline within that section,
  above the section's existing rule list
- **AND** no modal overlay is shown

#### Scenario: Editing an existing rule

- **WHEN** the merchant edits a staged rule
- **THEN** that rule's summary row is replaced in place by the inline editor,
  loaded with the rule's current values
- **AND** the other rule rows in the list remain visible

#### Scenario: Abandoning an edit

- **WHEN** the merchant cancels a rule being added or edited
- **THEN** the editor closes with no change to the staged rule list
- **AND** a rule being edited returns to its summary row unchanged
