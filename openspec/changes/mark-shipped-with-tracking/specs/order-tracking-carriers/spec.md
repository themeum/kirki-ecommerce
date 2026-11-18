## ADDED Requirements

### Requirement: Tracking can be added while marking an order as shipped

Choosing Mark as shipped in the Take an Action card SHALL open a Mark as shipped dialog
instead of changing the status at once. The dialog SHALL mark the order as shipped and MAY
add tracking in the same step. Tracking SHALL be optional. When tracking is added, the
carrier list, the Other choice, and the validation SHALL follow the rules of this
capability for the Add-tracking dialog.

#### Scenario: Ship without tracking

- **WHEN** the merchant opens Mark as shipped and selects Mark as shipped without opening the tracking fields
- **THEN** the order becomes shipped and no tracking is stored

#### Scenario: Ship with tracking

- **WHEN** the merchant opens the tracking fields, picks UPS, types `1Z999`, and selects Mark as shipped
- **THEN** the order becomes shipped and stores UPS, `1Z999`, and the resolved UPS link

#### Scenario: Tracking fields opened but left empty

- **WHEN** the merchant opens the tracking fields, picks a carrier, leaves the number empty, and selects Mark as shipped
- **THEN** the dialog asks for the tracking number or for the tracking fields to be removed, and the order is unchanged

#### Scenario: Cancel

- **WHEN** the merchant selects Cancel
- **THEN** the dialog closes and the order is unchanged

### Requirement: The dialog remembers how the merchant ships

The Mark as shipped dialog SHALL open with the tracking fields open when the merchant's
last shipment added tracking, and closed otherwise. It SHALL preselect the carrier the
merchant used last for the order's shipping zone and mark it "Last used" when the zone
lists more than one carrier.

#### Scenario: First shipment

- **WHEN** the merchant has never marked an order as shipped
- **THEN** the dialog opens with the tracking fields closed

#### Scenario: Last shipment had tracking

- **WHEN** the merchant's last shipment added FedEx tracking in zone A, and the next order is also in zone A
- **THEN** the dialog opens with the tracking fields open, FedEx selected with a "Last used" badge, and focus in Tracking number

#### Scenario: Last shipment had no tracking

- **WHEN** the merchant's last shipment added no tracking
- **THEN** the dialog opens with the tracking fields closed

### Requirement: The Take an Action card shows the order's tracking

A shipped order SHALL show its tracking in the Take an Action card, below the state line:
the carrier logo, the carrier name, the tracking number, and one menu with Copy tracking
number, Edit tracking, and Track on <carrier> site. A shipped order without tracking SHALL
show "No tracking added" with an Add tracking button there. The Items card SHALL NOT show
a tracking link.

#### Scenario: Shipped with tracking

- **WHEN** an order is shipped with DHL tracking `123456789`
- **THEN** the Take an Action card shows the DHL logo, "DHL", `123456789`, and the menu

#### Scenario: Track on carrier site

- **WHEN** the merchant chooses Track on DHL site from the menu
- **THEN** the order's resolved tracking URL opens in a new tab

#### Scenario: Shipped without tracking

- **WHEN** a shipped order has no tracking
- **THEN** the card shows "No tracking added" and Add tracking, which opens the tracking dialog

## MODIFIED Requirements

### Requirement: Adding tracking emails the customer

Adding tracking to an order SHALL queue a "Tracking added" email to the order's customer. The email SHALL show the carrier name, the tracking number, and the resolved tracking link. The merchant SHALL be able to switch this email off and edit its subject, heading, and message in the Email settings, like the other customer order emails. Adding tracking again MUST send a new email with the latest details. A failed or rejected add-tracking action MUST NOT send an email. When tracking is added in the same step as marking the order as shipped, the customer SHALL receive one email — the Order Shipped email with the tracking details — and MUST NOT also receive "Tracking added" (pending design.md Q2).

#### Scenario: Tracking added

- **WHEN** the merchant adds tracking with carrier UPS and number `1Z999` to a shipped order
- **THEN** one "Tracking added" email is queued to the customer
- **AND** the email contains `UPS`, `1Z999`, and the resolved link ending in `tracknum=1Z999`

#### Scenario: Shipped with tracking in one step

- **WHEN** the merchant marks an order as shipped with UPS tracking `1Z999` and the email checkbox checked
- **THEN** one Order Shipped email with UPS, `1Z999`, and the link is queued, and no "Tracking added" email

#### Scenario: Email switched off

- **WHEN** the "Tracking added" email is disabled in Email settings and the merchant adds tracking
- **THEN** the tracking is saved and no email is sent, because a disabled template is skipped when its queued job runs

#### Scenario: Tracking changed

- **WHEN** the merchant adds tracking to an order that already has tracking
- **THEN** a new "Tracking added" email with the new details is queued

#### Scenario: Add tracking rejected

- **WHEN** the add-tracking action fails validation
- **THEN** no email is queued and the order is unchanged
