# migration-run-recovery Specification

## Purpose
TBD - created by archiving change migration-revert-retry-and-cleanup. Update Purpose after archive.

## Requirements
### Requirement: A failed run offers Retry

When a run fails in the middle, the system SHALL show a Retry button. Retry SHALL continue from the saved position of the failed group. Items before that position SHALL NOT be processed again. Items that were skipped with a reason are not failures and SHALL NOT cause Retry to show.

#### Scenario: Server error during products

- **WHEN** a chunk request fails after 120 of 300 products
- **THEN** the screen shows the error and Retry, and Retry starts at product 121

#### Scenario: Skipped items only

- **WHEN** the run finishes and some items were skipped
- **THEN** the screen shows the completed summary and no Retry button
