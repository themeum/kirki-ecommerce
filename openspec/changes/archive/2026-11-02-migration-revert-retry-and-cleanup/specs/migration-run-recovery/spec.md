## ADDED Requirements

### Requirement: A failed run offers Retry

When a run fails in the middle, the system SHALL show a Retry button. Retry SHALL continue from the saved position of the failed group. Items before that position SHALL NOT be processed again. Items that were skipped with a reason are not failures and SHALL NOT cause Retry to show.

#### Scenario: Server error during products

- **WHEN** a chunk request fails after 120 of 300 products
- **THEN** the screen shows the error and Retry, and Retry starts at product 121

#### Scenario: Skipped items only

- **WHEN** the run finishes and some items were skipped
- **THEN** the screen shows the completed summary and no Retry button

### Requirement: The completed state is saved

The system SHALL save with the run that it is completed. When the merchant opens the migration screen later, for example after a reload, the system SHALL show the completed summary of the latest run, with Revert and Go to dashboard.

#### Scenario: Reload after completion

- **WHEN** a run is completed and the merchant reloads the page
- **THEN** the completed summary shows the groups that were migrated, with Revert and Go to dashboard

#### Scenario: Reverted run

- **WHEN** the latest run is reverted
- **THEN** the screen shows the scan step, not the completed summary
