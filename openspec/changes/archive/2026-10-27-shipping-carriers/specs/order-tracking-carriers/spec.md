## Purpose

Defines how a merchant adds tracking to an order by choosing a carrier from the shipping zone that covers the order's destination, and how the tracking link the customer receives is built from the carrier's template and the tracking number.

## ADDED Requirements

### Requirement: Carrier list comes from the order's matched zone

The Add-tracking dialog SHALL list the enabled carriers of the first enabled shipping zone that covers the order's shipping country and state. A zone without regions covers every destination. Disabled carriers MUST NOT be listed. The dialog SHALL always offer an "Other" choice after the listed carriers.

#### Scenario: Zone matches by country

- **WHEN** an order ships to a country covered by zone A, and zone A has UPS enabled and DHL disabled
- **THEN** the carrier select lists UPS and Other, and does not list DHL

#### Scenario: Zone matches by state

- **WHEN** an order ships to a state covered by a zone that lists only that state of the country
- **THEN** the carriers of that zone are listed

#### Scenario: No zone matches

- **WHEN** no enabled zone covers the order's shipping destination
- **THEN** only Other is offered

#### Scenario: Zone has no enabled carriers

- **WHEN** the matched zone has no enabled carriers
- **THEN** only Other is offered

### Requirement: Carrier select shows a placeholder and carrier icons

The Carrier select SHALL show "Select carrier" as its placeholder. Each listed carrier, the Other choice, and the selected value SHALL show an icon at the left: the carrier's logo when it has one, otherwise a generic carrier icon.

#### Scenario: Nothing selected

- **WHEN** the dialog opens without a stored carrier
- **THEN** the select shows "Select carrier"

#### Scenario: Carrier with a logo selected

- **WHEN** the merchant picks a carrier that has a logo
- **THEN** the option in the list and the selected value both show that logo at the left

#### Scenario: Carrier without a logo

- **WHEN** a carrier has no logo
- **THEN** its option and selected value show the generic carrier icon

### Requirement: Dialog has no Tracking URL input for a listed carrier

For a listed carrier, the dialog SHALL show Carrier and Tracking number fields and SHALL NOT show a Tracking URL input. Once the merchant types a tracking number, the dialog SHALL show a read-only preview of the tracking URL with `{tracking_number}` replaced by the number. Before a number is typed, the preview SHALL be hidden or show the template with the placeholder visible.

#### Scenario: Number typed

- **WHEN** the merchant selects UPS and types `1Z999AA10123456784`
- **THEN** the preview shows the UPS URL ending in `tracknum=1Z999AA10123456784`

#### Scenario: Number cleared

- **WHEN** the merchant clears the tracking number
- **THEN** the preview no longer shows a resolved number

#### Scenario: Save needs a number

- **WHEN** the tracking number is empty or only whitespace
- **THEN** the Save button is disabled

### Requirement: Other asks for a name and a URL template

When the merchant selects Other, the dialog SHALL show a required Carrier name field and a required Tracking URL template field. The template MUST follow the same rule as a carrier URL (http or https, contains `{tracking_number}`). The preview SHALL work as for a listed carrier.

#### Scenario: Other with valid template

- **WHEN** the merchant selects Other, enters a name, enters `https://track.example.com/?n={tracking_number}`, and enters a number
- **THEN** Save is enabled and the preview shows the resolved link

#### Scenario: Other with invalid template

- **WHEN** the merchant selects Other and the template lacks `{tracking_number}`
- **THEN** Save is disabled and the template field shows why

### Requirement: Server resolves the tracking URL

The add-tracking action SHALL accept a carrier reference and a tracking number, or for Other a carrier name, a URL template, and a tracking number. The server SHALL build the tracking URL by replacing every `{tracking_number}` in the template with the URL-encoded tracking number. The server MUST validate the template scheme and MUST NOT trust a resolved URL sent by the client. The server SHALL store the carrier name, the tracking number, and the resolved URL on the order.

#### Scenario: Listed carrier resolved

- **WHEN** the action is sent with the id of a carrier whose template is `https://www.ups.com/track?loc=en_US&tracknum={tracking_number}` and the number `1Z 999&A`
- **THEN** the order stores the UPS name, the number, and `https://www.ups.com/track?loc=en_US&tracknum=1Z%20999%26A`

#### Scenario: Unknown carrier id

- **WHEN** the action is sent with a carrier id that no zone holds
- **THEN** the server rejects the action with a validation error and the order is unchanged

#### Scenario: Unsafe template for Other

- **WHEN** the action is sent for Other with a template that does not start with http:// or https://
- **THEN** the server rejects the action and the order is unchanged

#### Scenario: Legacy client request

- **WHEN** the action is sent with `carrier`, `tracking_number`, and `tracking_url` and no carrier reference
- **THEN** the server still accepts a valid http or https URL and stores it as sent

### Requirement: Stored tracking is a snapshot

An order SHALL keep the carrier name and resolved URL it was saved with. Editing, disabling, or deleting a carrier later MUST NOT change tracking already stored on an order.

#### Scenario: Carrier edited after use

- **WHEN** the merchant changes a carrier's URL template after adding tracking to an order with it
- **THEN** that order still shows the earlier resolved URL

### Requirement: Existing tracking pre-selects its carrier

When an order already has tracking, the dialog SHALL open with the stored tracking number. It SHALL pre-select the listed carrier whose name equals the stored carrier name. If none matches, it SHALL select Other with the stored name and URL prefilled.

#### Scenario: Stored carrier still listed

- **WHEN** an order has carrier "DHL" and the matched zone lists an enabled DHL
- **THEN** the dialog opens with DHL selected

#### Scenario: Stored carrier no longer listed

- **WHEN** an order has carrier "Old Courier" that no enabled carrier of the zone matches
- **THEN** the dialog opens with Other selected and the stored name and URL filled in

### Requirement: Adding tracking emails the customer

Adding tracking to an order SHALL queue a "Tracking added" email to the order's customer. The email SHALL show the carrier name, the tracking number, and the resolved tracking link. The merchant SHALL be able to switch this email off and edit its subject, heading, and message in the Email settings, like the other customer order emails. Adding tracking again MUST send a new email with the latest details. A failed or rejected add-tracking action MUST NOT send an email.

#### Scenario: Tracking added

- **WHEN** the merchant adds tracking with carrier UPS and number `1Z999` to a shipped order
- **THEN** one "Tracking added" email is queued to the customer
- **AND** the email contains `UPS`, `1Z999`, and the resolved link ending in `tracknum=1Z999`

#### Scenario: Email switched off

- **WHEN** the "Tracking added" email is disabled in Email settings and the merchant adds tracking
- **THEN** the tracking is saved and no email is sent, because a disabled template is skipped when its queued job runs

#### Scenario: Tracking changed

- **WHEN** the merchant adds tracking to an order that already has tracking
- **THEN** a new "Tracking added" email with the new details is queued

#### Scenario: Add tracking rejected

- **WHEN** the add-tracking action fails validation
- **THEN** no email is queued and the order is unchanged

### Requirement: Tracking can only be added to a shipped order

The add-tracking action SHALL remain available only in the order states that already allow it (shipped orders). The Order Shipped email MUST keep its current content and trigger.

#### Scenario: Order not yet shipped

- **WHEN** the merchant tries to add tracking to an order that is not shipped
- **THEN** the action is rejected as not available for the order's status
