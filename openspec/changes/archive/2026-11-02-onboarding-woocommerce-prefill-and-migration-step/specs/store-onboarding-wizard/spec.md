## MODIFIED Requirements

### Requirement: Wizard layout

Every wizard screen SHALL render full-screen without the WordPress admin menu. Each
screen SHALL show, from top to bottom:

- the Kirki eCommerce logo at 20px height;
- a progress bar with a "Step N" label and the current step's name;
- a card holding the step's content and its actions.

The step label SHALL NOT show the total number of steps.

The steps SHALL be named "Store Basics", "Business Info", "Essentials" and "Store
Tax". The "Store Tax" step SHALL exist only when the merchant answered "Yes" to
"Collect sales tax?". Let N be the number of input steps: 4 when the merchant
collects tax, 3 when they do not. The completion screen counts as one more equal part,
so the progress bar is divided into N + 1 parts. The fill on an input step SHALL be the
number of steps already done (the current step number minus one) divided by N + 1. On
step one the bar SHALL be empty.

The progress bar SHALL NOT be full on an input step. The completion screen, which opens
when the merchant clicks "Create Store", SHALL start the bar at N divided by N + 1 and
fill the last part while store setup and the migration run, as set by the
`onboarding-migration-step` rules. The bar SHALL be full only when all of that work is
done.

The completion screen SHALL show a progress bar labelled "Setup Complete" and SHALL NOT
show a step number.

#### Scenario: Step one header

- **WHEN** the merchant opens the wizard with "Collect sales tax?" not answered "Yes"
- **THEN** the logo, an empty progress bar, "Step 1", and "Store Basics" are shown above the card

#### Scenario: Header when collecting tax

- **WHEN** the merchant has answered "Yes" to "Collect sales tax?" and is on step two
- **THEN** the label reads "Step 2" and the progress bar is one fifth full

#### Scenario: Store Tax header

- **WHEN** the merchant is on the Store Tax step
- **THEN** the label reads "Step 4", the step name reads "Store Tax", and the progress bar is three fifths full

#### Scenario: Last step without tax

- **WHEN** the merchant has not answered "Yes" to "Collect sales tax?" and is on step three
- **THEN** the label reads "Step 3" and the progress bar is half full

#### Scenario: Completion header

- **WHEN** the merchant reaches the completion screen
- **THEN** the progress bar starts at four fifths (three quarters when the merchant does not collect tax), it is labelled "Setup Complete", and no step number is shown

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
