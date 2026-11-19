## Purpose

Defines how a merchant marks an order as shipped from the order details page, with optional tracking details in the same step, and how a local-pickup order is marked ready for pickup.

## ADDED Requirements

### Requirement: Mark as shipped opens a dialog

Selecting the "Mark as shipped" action on the order details page SHALL open a dialog instead of running the action at once. The dialog title SHALL be "Mark <order number> as shipped". Cancel SHALL close the dialog without changing the order. The dialog SHALL close after the action succeeds.

#### Scenario: Open the dialog

- **WHEN** the merchant selects "Mark as shipped" in the Take-action card and selects Update
- **THEN** the "Mark #1001 as shipped" dialog opens and the order is not changed yet

#### Scenario: Cancel

- **WHEN** the merchant selects Cancel in the dialog
- **THEN** the dialog closes and the order stays unshipped

### Requirement: Tracking details are optional when shipping

The ship dialog SHALL show an "Add tracking details" slot marked "Optional". Selecting it SHALL show the tracking fields (Carrier, Tracking number, and for Other the Carrier name and Tracking URL template), pre-filled as described by the order-tracking-carriers capability. A remove control SHALL hide the fields and clear them. When the tracking fields are hidden, "Mark as shipped" SHALL send the action without tracking. When they are shown, the form MUST be valid before the action is sent, and the action SHALL send the tracking with it.

#### Scenario: Ship without tracking

- **WHEN** the merchant opens the dialog and selects "Mark as shipped" without adding tracking details
- **THEN** the order is marked shipped and no tracking is stored

#### Scenario: Ship with tracking

- **WHEN** the merchant adds tracking details with UPS and `1Z999` and selects "Mark as shipped"
- **THEN** the order is marked shipped and stores UPS, `1Z999`, and the resolved UPS link

#### Scenario: Tracking details removed

- **WHEN** the merchant opens the tracking details, then selects the remove control, then selects "Mark as shipped"
- **THEN** the order is marked shipped without tracking

#### Scenario: Last used carrier opens the tracking details

- **WHEN** the dialog opens and a last used carrier is pre-selected
- **THEN** the tracking details are shown

### Requirement: Server ships and tracks in one step

The `mark-as-shipped` action SHALL accept the optional fields `carrier_id` or `carrier`, `tracking_number`, and `tracking_url`, with the same validation as add-tracking when a carrier is sent. When a tracking number and a carrier are sent, the server SHALL mark the order as shipped and store the tracking in the same transaction, and SHALL update the last used carrier. When the tracking is rejected, the order MUST NOT be marked as shipped.

#### Scenario: Shipped with a listed carrier

- **WHEN** `mark-as-shipped` is sent with `carrier_id` `ups` and `tracking_number` `1Z999` for an order whose zone lists UPS
- **THEN** the order is shipped, stores the UPS tracking, and the last used carrier is `ups`

#### Scenario: Carrier without a number

- **WHEN** `mark-as-shipped` is sent with `carrier_id` and no `tracking_number`
- **THEN** the server rejects the request and the order is not shipped

#### Scenario: Emails when shipped with tracking

- **WHEN** an order is marked as shipped with tracking
- **THEN** the Order Shipped email and the "Tracking added" email are both queued, each according to its own Email settings

#### Scenario: Shipped without tracking fields

- **WHEN** `mark-as-shipped` is sent with no tracking fields
- **THEN** the order is shipped and the last used carrier does not change

### Requirement: Local pickup is marked ready for pickup

For an order whose shipping method type is `local_pickup`, the dialog SHALL be titled "Mark <order number> as ready for pickup?", SHALL NOT show tracking fields, and its primary button "Ready for pickup" SHALL send the mark-as-shipped action without tracking. The dialog SHALL show a pickup box with:

- "Pickup at <address>" when the order has a pickup address, else the pickup method name;
- the pickup hours as "<start> – <end>" when both times are set;
- the pickup instructions when they are set.

When an order is created or updated, the server SHALL store the method's description and taxable flag in the order's shipping snapshot, and for a local-pickup method also the address and pickup times. The times SHALL be stored only when pickup time is on and both times are set. The admin order response SHALL include `shipping_meta` (`{ description, is_taxable, address, pickup_time_start, pickup_time_end }`) for every order. The pickup keys SHALL be `null` for a method that is not local pickup. The pickup box SHALL show the description as the pickup instructions.

#### Scenario: Pickup order

- **WHEN** the merchant marks a local-pickup order as shipped
- **THEN** the dialog shows "Ready for pickup", the pickup box, and no tracking fields

#### Scenario: Pickup details shown

- **WHEN** the order was placed with a pickup method at "221 Market St", 10:00–18:00, with the instructions "Bring your order number."
- **THEN** the pickup box shows "Pickup at 221 Market St", "10:00 – 18:00", and "Bring your order number."

#### Scenario: Order without stored pickup details

- **WHEN** a local-pickup order was placed before this change
- **THEN** `shipping_meta` has `null` values and the pickup box shows only the method name

### Requirement: Notify-customer flag is accepted

The order action request SHALL accept an optional boolean `notify_customer`. In this change the flag MUST NOT change which emails are sent, and the dialogs SHALL NOT show a notify-customer control.

#### Scenario: Flag sent

- **WHEN** `mark-as-shipped` is sent with `notify_customer: true`
- **THEN** the request is accepted and the emails sent are the same as without the flag
