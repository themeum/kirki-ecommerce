## ADDED Requirements

### Requirement: Automatic migration row
When WooCommerce is installed and supported, the completion screen SHALL show a last row "Migrate from WooCommerce · <description>" after Configurations. After the setup rows finish, the system SHALL start a migration of all groups with no choice screen.

#### Scenario: Migration starts after setup
- **WHEN** all setup rows are complete and WooCommerce is supported
- **THEN** the migration starts on its own

#### Scenario: No WooCommerce
- **WHEN** WooCommerce is not present
- **THEN** no Migrate row shows and no migration runs

### Requirement: Top bar text during migration
While migration runs, the top bar left text SHALL read "Migrating · <current migration message>". The right label SHALL stay "Setup Complete". The bar SHALL show the overall percent.

#### Scenario: Message changes
- **WHEN** the migration moves to a new group
- **THEN** the text after "Migrating ·" shows the new message

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
