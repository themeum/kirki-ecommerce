## ADDED Requirements

### Requirement: Tax-rule condition types depend on where the rules are edited

When the merchant adds or edits a tax rule, the first condition SHALL offer a
set of condition types determined by which tax rules section is open:

- On a **state's page** (per-state mode), the first condition SHALL offer
  **Tax Profile** only. It SHALL be preselected and SHALL NOT be changeable to
  any other condition type.
- In a general region's **country-wide** tax rules section and in the **EU
  region's** tax rules section, the first condition SHALL offer both **Tax
  Profile** and **Destination**.

A second condition, where one is available, SHALL offer **Tax Profile** only in
every context. Whenever a condition offers exactly one type, that type SHALL be
shown as a fixed, non-interactive selection rather than a single-item dropdown.

Because a second condition is only reachable after the first condition is set to
**Destination**, a tax rule edited on a state's page SHALL have exactly one
condition.

The condition type restriction is a form-side concern only; the persisted rule
shape is unchanged.

#### Scenario: Adding a rule on a state's page

- **WHEN** the merchant opens the tax rules editor on a state's page
- **THEN** the first condition is set to Tax Profile
- **AND** the condition type cannot be changed
- **AND** there is no way to add a second condition

#### Scenario: Adding a rule in a country-wide region's rules section

- **WHEN** the merchant opens the tax rules editor in a general region's
  country-wide tax rules section
- **THEN** the first condition can be set to either Tax Profile or Destination

#### Scenario: Adding a rule in the EU region's rules section

- **WHEN** the merchant opens the tax rules editor in the EU region's tax rules
  section
- **THEN** the first condition can be set to either Tax Profile or Destination

#### Scenario: Second condition is Tax Profile only

- **WHEN** the merchant sets the first condition to Destination and adds a
  second condition
- **THEN** the second condition is Tax Profile and its type cannot be changed
