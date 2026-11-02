## Purpose
Defines the merchant-facing screens that scan the source store, let the merchant choose data groups, run the migration with live progress, and end at the dashboard.

## ADDED Requirements

### Requirement: Entry point on the last onboarding screen

When a source plugin is detected and its version is supported, the last onboarding screen SHALL show a "Migrate from WooCommerce" button. When no source is detected, the button SHALL NOT be shown.

#### Scenario: WooCommerce detected

- **WHEN** the merchant reaches the last onboarding screen and WooCommerce is detected
- **THEN** the "Migrate from WooCommerce" button is shown

#### Scenario: Not detected

- **WHEN** WooCommerce is not detected
- **THEN** the last onboarding screen has no migration button

### Requirement: Scan screen with skeleton loader

The migration screen SHALL show a skeleton loader while the scan runs. After the scan it SHALL show the groups.

#### Scenario: Scan in progress

- **WHEN** the merchant opens the migration screen
- **THEN** a skeleton loader is shown until the scan result arrives

#### Scenario: Scan fails

- **WHEN** the scan request fails
- **THEN** an error message and a retry action are shown

### Requirement: Group selection

Each detected group SHALL be shown as a row with a checkbox on the left, the group label and the item count, for example "Products (100)". All checkboxes SHALL be checked by default. The merchant SHALL be able to uncheck any group. Detected extension plugins that are not migrated SHALL be listed as notices. The screen SHALL have "Skip" and "Migrate" buttons. "Migrate" SHALL be disabled when no group is checked. "Skip" SHALL leave the migration and continue to the dashboard.

#### Scenario: Default selection

- **WHEN** the scan result is shown
- **THEN** every group is checked

#### Scenario: Deselect settings

- **WHEN** the merchant unchecks Settings and presses "Migrate"
- **THEN** settings are not migrated

#### Scenario: Nothing selected

- **WHEN** the merchant unchecks all groups
- **THEN** the "Migrate" button is disabled

### Requirement: Progress display

While the migration runs, the top progress bar SHALL show migration progress in place of the onboarding steps. A message under the bar SHALL describe the current action with the range and total, for example "Migrating products 11-20 of 100". The merchant SHALL NOT be able to start a second run at the same time.

#### Scenario: Chunk in progress

- **WHEN** the second chunk of 10 products is being migrated out of 100
- **THEN** the message names products, the range 11-20 and the total 100

### Requirement: Failure and resume

When a chunk request fails, the screen SHALL stop the run, show the error, and offer a "Resume" action. "Resume" SHALL continue from the saved position.

#### Scenario: Network error

- **WHEN** a chunk request fails because of a network error
- **THEN** the screen shows the error and a "Resume" button, and no data is created twice after resume

### Requirement: Completion

When all groups are finished, the screen SHALL show a summary with created, reused and skipped counts for each group, access to the skipped item list, and a "Go to dashboard" button.

#### Scenario: Finished run

- **WHEN** the last group finishes
- **THEN** the progress bar is full, the summary is shown, and "Go to dashboard" opens the dashboard
