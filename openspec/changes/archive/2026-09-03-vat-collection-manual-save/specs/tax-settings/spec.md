## MODIFIED Requirements

### Requirement: The EU region collects VAT per member country

The EU region SHALL persist a single VAT rate for each member country it collects
VAT in, identified by the member country's code. That one rate SHALL apply to
both product tax and shipping tax for that country. The rate is entered as a
number. The EU region form SHALL block the save with no member country
configured, and while a configured member country is missing its rate — a
form-level check; see "The settings API validates field types, not region
completeness".

Adding, editing, or removing a member country SHALL update the region form only
and mark the tax settings form as having unsaved changes. None of these edits
SHALL be persisted on their own — they are written only when the merchant saves
the page. A removal MAY offer an immediate local undo, but declining it SHALL
leave the member country removed from the form and the form still dirty, not
persist the removal.

#### Scenario: Configuring a member country

- **WHEN** the merchant adds a member country to the EU region with a numeric VAT
  rate
- **THEN** the member country appears in the region's VAT collection list with
  that rate
- **AND** the tax settings form reports unsaved changes
- **AND** nothing is written to the settings API until the merchant saves

#### Scenario: Editing a member country's rate stages an unsaved change

- **WHEN** the merchant changes the VAT rate of an already-listed member country
- **THEN** the list shows the new rate
- **AND** the tax settings form reports unsaved changes
- **AND** nothing is written to the settings API until the merchant saves

#### Scenario: Removing a member country stages an unsaved change

- **WHEN** the merchant removes a member country from the EU region and does not
  undo the removal
- **THEN** the member country is gone from the VAT collection list
- **AND** the tax settings form reports unsaved changes
- **AND** nothing is written to the settings API until the merchant saves

#### Scenario: Undoing a removal restores the member country

- **WHEN** the merchant removes a member country and then activates the removal's
  undo affordance
- **THEN** the member country is back in the VAT collection list with its rate

#### Scenario: Saving persists the staged VAT collection edits

- **WHEN** the merchant has added, edited, or removed member countries and
  activates Save
- **THEN** the EU region is persisted with exactly the member countries and rates
  shown in the list
- **AND** the tax settings form no longer reports unsaved changes

#### Scenario: Saving the EU region with a member country missing its rate

- **WHEN** the merchant saves an EU region where a configured member country has a
  blank VAT rate
- **THEN** the save is blocked and the blank rate field displays its required
  message

#### Scenario: Saving the EU region with no member country

- **WHEN** the merchant saves an EU region that has no member country configured
- **THEN** the save is blocked
