## MODIFIED Requirements

### Requirement: Carrier select shows a placeholder and carrier icons

The Carrier select SHALL show "Select carrier" as its placeholder. Each listed carrier, the Other choice, and the selected value SHALL show an icon at the left: the carrier's logo when it has one, otherwise a generic carrier icon.

#### Scenario: Nothing selected

- **WHEN** the dialog opens on an order without stored tracking, no last used carrier applies, and the order's zone lists at least one carrier
- **THEN** the select shows "Select carrier"

#### Scenario: Carrier with a logo selected

- **WHEN** the merchant picks a carrier that has a logo
- **THEN** the option in the list and the selected value both show that logo at the left

#### Scenario: Carrier without a logo

- **WHEN** a carrier has no logo
- **THEN** its option and selected value show the generic carrier icon

### Requirement: Server resolves the tracking URL

The add-tracking action SHALL accept a carrier reference and a tracking number, or for Other a carrier name, a URL template, and a tracking number. The server SHALL build the tracking URL by replacing every `{tracking_number}` in the template with the URL-encoded tracking number. The server MUST validate the template scheme and MUST NOT trust a resolved URL sent by the client. The server SHALL store the carrier name, the tracking number, and the resolved URL on the order.

The server SHALL validate the tracking fields before it runs the action:

- An add-tracking request MUST send exactly one of `carrier_id` and `carrier`.
- Any request that sends both `carrier_id` and `carrier` MUST be rejected.
- A `carrier_id` MUST be an enabled carrier of the zone that covers the order's shipping address.
- A request that sends `carrier_id` or `carrier` MUST send a `tracking_number`.
- A request that sends `carrier` (Other) MUST send a `tracking_url` that starts with http:// or https://.

#### Scenario: Listed carrier resolved

- **WHEN** the action is sent with the id of a carrier whose template is `https://www.ups.com/track?loc=en_US&tracknum={tracking_number}` and the number `1Z 999&A`
- **THEN** the order stores the UPS name, the number, and `https://www.ups.com/track?loc=en_US&tracknum=1Z%20999%26A`

#### Scenario: Unknown carrier id

- **WHEN** the action is sent with a carrier id that the order's zone does not hold
- **THEN** the server rejects the request with a validation error on `carrier_id` and the order is unchanged

#### Scenario: Unsafe template for Other

- **WHEN** the action is sent for Other with a template that does not start with http:// or https://
- **THEN** the server rejects the request and the order is unchanged

#### Scenario: Carrier and carrier id together

- **WHEN** an add-tracking request sends both `carrier_id` and `carrier`
- **THEN** the server rejects the request with a validation error and the order is unchanged

#### Scenario: No carrier

- **WHEN** an add-tracking request sends a tracking number but neither `carrier_id` nor `carrier`
- **THEN** the server rejects the request with a validation error and the order is unchanged

#### Scenario: Other without a URL

- **WHEN** an add-tracking request sends `carrier` and `tracking_number` but no `tracking_url`
- **THEN** the server rejects the request with a validation error on `tracking_url`

#### Scenario: Legacy client request

- **WHEN** the action is sent with `carrier`, `tracking_number`, and an http or https `tracking_url`, and no carrier reference
- **THEN** the server accepts it and stores the URL as sent, or resolved when it holds `{tracking_number}`

## ADDED Requirements

### Requirement: Store remembers the last used carrier

The store SHALL keep one last used carrier for the whole store. A successful add-tracking action, and a successful mark-as-shipped action that stores tracking, SHALL replace it. A listed carrier SHALL be kept by its id; an Other carrier SHALL be kept by its name. A rejected request MUST NOT change it. An admin SHALL read it from `GET /shipping-carriers/last-used`, which returns `{ "carrier_id": <id|null>, "carrier": <name|null> }`, or `null` data before tracking was added for the first time.

#### Scenario: No tracking added yet

- **WHEN** an admin requests the last used carrier on a store where no tracking was added
- **THEN** the response data is `null`

#### Scenario: Listed carrier used

- **WHEN** the merchant adds tracking with the listed carrier `ups`
- **THEN** the last used carrier is `{ "carrier_id": "ups", "carrier": null }`

#### Scenario: Other carrier used

- **WHEN** the merchant adds tracking with Other and the name `Local Courier`
- **THEN** the last used carrier is `{ "carrier_id": null, "carrier": "Local Courier" }`

#### Scenario: Marked as shipped with tracking

- **WHEN** the merchant marks an order as shipped with tracking from carrier `dhl`
- **THEN** the last used carrier is `{ "carrier_id": "dhl", "carrier": null }`

#### Scenario: Rejected request

- **WHEN** an add-tracking request fails validation
- **THEN** the last used carrier does not change

### Requirement: Dialog pre-selects the last used carrier

When the order has no stored tracking, the tracking form SHALL pre-select a carrier in this order:

1. The last used carrier id, when the order's zone lists a carrier with that id.
2. Otherwise, Other with the last used Other name in Carrier name. The Tracking URL field stays empty.
3. Otherwise, Other when the order's zone lists no carrier.
4. Otherwise, no carrier ("Select carrier").

Stored tracking on the order MUST take precedence over the last used carrier. This applies to the Add-tracking dialog and to the tracking details of the Mark-as-shipped dialog.

#### Scenario: Last used carrier listed in the zone

- **WHEN** the last used carrier id is `ups` and the order's zone lists UPS
- **THEN** the dialog opens with UPS selected

#### Scenario: Last used carrier not in the zone

- **WHEN** the last used carrier id is `ups`, the order's zone lists only DHL, and there is no last used Other name
- **THEN** the dialog opens with "Select carrier"

#### Scenario: Last used Other carrier

- **WHEN** the last used carrier is the Other name `Local Courier`
- **THEN** the dialog opens with Other selected, Carrier name `Local Courier`, and an empty Tracking URL

#### Scenario: Order already has tracking

- **WHEN** the order has stored tracking with carrier DHL and the last used carrier is `ups`
- **THEN** the dialog opens with DHL and the stored tracking number

### Requirement: Merchant can remove tracking

The `remove-tracking` action SHALL clear the carrier name, the tracking number, and the tracking URL of an order. It SHALL be available in every order state in which add-tracking is available, and MUST be rejected while a refund is in progress. The Add-tracking dialog SHALL show a "Remove tracking" button only when the order has a stored tracking number. The action MUST NOT change the last used carrier.

#### Scenario: Remove stored tracking

- **WHEN** the merchant opens the Add-tracking dialog on an order with tracking and selects "Remove tracking"
- **THEN** the order has no carrier, tracking number, or tracking URL, and the dialog closes

#### Scenario: No tracking stored

- **WHEN** the merchant opens the Add-tracking dialog on an order without a tracking number
- **THEN** the dialog does not show "Remove tracking"

### Requirement: Order page shows the stored tracking

On the order details page, the Take-action card of an order with fulfillment status `shipped` SHALL show the tracking state. With a stored tracking number, it SHALL show the carrier logo (or a generic truck icon), the carrier name, and the tracking number, with a menu to copy the number, edit the tracking, and open the tracking link when one is stored. Without a tracking number, it SHALL show "No tracking Added" and an "Add Tracking" button that opens the Add-tracking dialog. An order that is not shipped MUST NOT show this section.

#### Scenario: Shipped order with tracking

- **WHEN** a shipped order has carrier UPS, number `1Z999`, and a tracking URL
- **THEN** the card shows UPS and `1Z999`, and the menu offers Copy tracking number, Edit tracking, and "Track on UPS site"

#### Scenario: Shipped order without tracking

- **WHEN** a shipped order has no tracking number
- **THEN** the card shows "No tracking Added" and an "Add Tracking" button

#### Scenario: Order not shipped

- **WHEN** the order's fulfillment status is not `shipped`
- **THEN** the card shows no tracking section
