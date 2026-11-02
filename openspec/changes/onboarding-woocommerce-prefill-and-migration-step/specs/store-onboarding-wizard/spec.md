## ADDED Requirements

### Requirement: Completion screen migration row
The completion screen SHALL list the setup rows Location, Currency, Store pages, Tax (when tax is Yes) and Configurations, and, when WooCommerce is supported, the Migrate row. Each row SHALL show a circular ring, then a check. Action buttons SHALL show only after all work ends, as set by the `onboarding-migration-step` rules.

#### Scenario: Setup running
- **WHEN** setup or migration is running
- **THEN** no action button shows

#### Scenario: Setup done without WooCommerce
- **WHEN** setup is done and no migration ran
- **THEN** "Add your first product", "Go to Dashboard" and the sample data link show

### Requirement: Preconfigured shipping zone states
The preset shipping zones written at onboarding SHALL save every state of a region country when the preset region has a country and no state, with or without WooCommerce.

#### Scenario: Country-only preset region
- **WHEN** a preset zone region has only a country that has states
- **THEN** the saved region lists all state ids of that country
