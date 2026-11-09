## MODIFIED Requirements

### Requirement: Payments settings show gateway updates

The available-gateways dialog SHALL show an "Update Available" badge, in place
of the "Added" badge, for each installed gateway with an offered update, and a
small secondary "Update" button on the right of that row. Pressing it SHALL call
the update endpoint. During the request a spinner SHALL show in place of that
button, and the other "Add" and "Update" buttons SHALL be disabled until the
request ends. After success the row SHALL show only "Added", and the payment
lists SHALL refresh. On failure the system SHALL show the error message. For a
blocked update the dialog SHALL show the "Update Available" badge and, in place
of the button, an info icon whose tooltip shows the reason. Each installed
gateway row in the Payments list SHALL show an "Update available" badge when a
newer version exists, offered or blocked, and pressing the badge SHALL open the
dialog.

#### Scenario: Update button

- **WHEN** the dialog lists an installed gateway with an offered update
- **THEN** the row shows the "Update Available" badge and an "Update" button, and no "Added" badge

#### Scenario: Update succeeds

- **WHEN** the admin presses "Update" and the request succeeds
- **THEN** the button goes away, the row shows "Added", and the lists refresh

#### Scenario: Update fails

- **WHEN** the request fails
- **THEN** the error message shows and the "Update" button shows again

#### Scenario: Requirement not met

- **WHEN** the update is blocked by `requires_kirki_ecommerce`
- **THEN** the row shows "Update Available" and an info icon whose tooltip shows
  the reason, which names the required version and what to do, and no "Update" button

#### Scenario: Badge on the installed list

- **WHEN** an installed gateway has an offered update
- **THEN** its row in the Payments list shows "Update available", and pressing
  it opens the available-gateways dialog

#### Scenario: Badge for a blocked update on the installed list

- **WHEN** an installed gateway has a newer version, but a requirement blocks the update
- **THEN** its row in the Payments list still shows "Update available"
