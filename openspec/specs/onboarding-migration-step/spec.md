# onboarding-migration-step Specification

## Purpose
TBD - created by archiving change onboarding-woocommerce-prefill-and-migration-step. Update Purpose after archive.

## Requirements
### Requirement: Automatic migration row
When WooCommerce is installed and supported, the completion screen SHALL show a last row "WooCommerce Migration · <description>" after Configurations. After the setup rows finish, the system SHALL start a migration of all groups with no choice screen.

#### Scenario: Migration starts after setup
- **WHEN** all setup rows are complete and WooCommerce is supported
- **THEN** the migration starts on its own

#### Scenario: No WooCommerce
- **WHEN** WooCommerce is not present
- **THEN** no Migrate row shows and no migration runs

### Requirement: Top bar progress and text
On the completion screen, the last part of the top bar (one of N + 1 equal parts, as set by the wizard layout rules) SHALL fill without a reset. The bar SHALL never go back to zero.

- When WooCommerce is present, the setup rows SHALL fill the first 10% of that part, in proportion to the rows completed. The migration SHALL fill the other 90%, in proportion to its real percent.
- When WooCommerce is not present, the setup rows SHALL fill the whole part, in proportion to the rows completed.
- The bar SHALL be full only when the setup rows and the migration, if any, are done.
- If setup or the migration fails, the bar SHALL stay at its current value.

The right label SHALL stay "Setup Complete". The left text SHALL name the work in progress:

- While a setup row is in progress: "Setting up · <row label>", for example "Setting up · Currency".
- While the migration runs: "Migrating · <current migration message>".

#### Scenario: Setup rows with WooCommerce
- **WHEN** WooCommerce is present, there are 5 setup rows, and 2 of them are completed
- **THEN** the bar sits at the start of the last part plus 4% of that part, and the left text reads "Setting up · " followed by the label of the row in progress

#### Scenario: Migration starts
- **WHEN** the last setup row completes and the migration starts
- **THEN** the bar is 10% into the last part and does not reset

#### Scenario: Migration progress
- **WHEN** the migration is at 50%
- **THEN** the bar is 55% into the last part

#### Scenario: Message changes
- **WHEN** the migration moves to a new group
- **THEN** the text after "Migrating ·" shows the new message

#### Scenario: No WooCommerce
- **WHEN** WooCommerce is not present and the last setup row completes
- **THEN** the bar is full

#### Scenario: Failure
- **WHEN** the migration fails at 30%
- **THEN** the bar stays at 37% into the last part

### Requirement: Circular progress rings
Each row SHALL show a circular ring instead of a spinner. Setup rows SHALL fill in a short timed animation and then show a check. The Migrate row ring SHALL show the real migration percent.

#### Scenario: Migrate ring
- **WHEN** the migration is at 40%
- **THEN** the Migrate ring is 40% filled

### Requirement: Button rules
No action button SHALL show while setup or migration runs. After they finish: without a migration, the screen SHALL show "Add your first product", "Go to Dashboard" and the sample data link; after a migration, the screen SHALL show only "Go to Dashboard".

#### Scenario: Migration done
- **WHEN** the migration finishes
- **THEN** only "Go to Dashboard" shows, and the sample data link is hidden

#### Scenario: Migration fails
- **WHEN** the migration fails
- **THEN** the screen shows the error, "Retry" (continues from the saved position) and "Go to Dashboard"

### Requirement: Single entry point
The onboarding completion screen SHALL be the only place that runs a WooCommerce migration. The app SHALL NOT have a migration route, and the dashboard SHALL NOT show a "Migrate from WooCommerce" button. The product SHALL NOT offer a way to revert a migration.

#### Scenario: No migration route
- **WHEN** the merchant opens `#/migration/woo-commerce`
- **THEN** the app shows its not-found page

#### Scenario: Dashboard without WooCommerce button
- **WHEN** WooCommerce is installed and the merchant opens the dashboard
- **THEN** no "Migrate from WooCommerce" button shows

### Requirement: Ledger cleared after success
When a migration run finishes successfully, the system SHALL delete every row of that source from the record ledger table. A failed or unfinished run SHALL keep its ledger rows, so that Retry and resume continue from the saved position without creating duplicates. The saved run state SHALL stay.

#### Scenario: Run finishes
- **WHEN** the last chunk of a run reports done
- **THEN** the ledger has no rows for that source, and the latest run still reads as done

#### Scenario: Run fails
- **WHEN** a chunk request fails in the middle of a run
- **THEN** the ledger rows stay, and Retry continues from the saved position of the failed group
