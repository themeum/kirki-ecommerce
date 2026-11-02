## MODIFIED Requirements

### Requirement: Wizard layout

Every wizard screen SHALL render full-screen without the WordPress admin menu. Each screen SHALL show, from top to bottom:

- the Kirki eCommerce logo at 20px height;
- a progress bar with a "Step N of 3" label and the current step's name;
- a card holding the step's content and its actions.

The steps SHALL be named "Store Basics", "Business Info" and "Essentials". The completion screen SHALL show a full progress bar labelled "Setup complete". When the merchant starts a migration from the completion screen, the progress bar SHALL show migration progress as defined by the `migration-onboarding-flow` capability. When a supported source plugin is detected, the completion screen SHALL also show the migration entry point defined by that capability.

#### Scenario: Step one header

- **WHEN** the merchant opens the wizard
- **THEN** the logo, a progress bar one third full, "Step 1 of 3", and "Store Basics" are shown above the card

#### Scenario: Completion header

- **WHEN** the merchant reaches the completion screen
- **THEN** the progress bar is full and labelled "Setup complete"

#### Scenario: Migration started

- **WHEN** the merchant presses "Migrate" on the migration screen
- **THEN** the progress bar shows migration progress instead of the onboarding steps
