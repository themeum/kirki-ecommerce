## MODIFIED Requirements

### Requirement: One add or update at a time

Pressing "Add" on a gateway SHALL install it, and pressing "Update" SHALL update
it. During any add (manual or gateway) or update request, the pressed button of
that row SHALL show a spinner at its center in place of its label, SHALL keep its
size and position, and SHALL stay visible without hover. All other "Add" and
"Update" buttons SHALL be disabled until the request ends. After success, the
lists SHALL refresh and the row SHALL show its new status. After a failure, the
error message SHALL show and the row SHALL show its button again.

#### Scenario: Add in progress

- **WHEN** the admin presses "Add" on Amazon Pay
- **THEN** the "Add" button of that row shows a spinner at its center, keeps its size and position, and the other "Add" and "Update" buttons are disabled

#### Scenario: Add succeeds

- **WHEN** the install request succeeds
- **THEN** the spinner goes away, the row shows "Added", and the other buttons are enabled again

#### Scenario: Add fails

- **WHEN** the install request fails
- **THEN** the error message shows, and the row shows its "Add" button again
