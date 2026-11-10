# payment-method-picker Specification

## Purpose
The "Add a payment method" dialog lets the admin find a manual payment method or
an online payment gateway by name, see its status, and add it from one compact list.
## Requirements
### Requirement: Dialog title

The dialog SHALL have the title "Add a payment method".

#### Scenario: Title shows

- **WHEN** the admin opens the dialog
- **THEN** the title reads "Add a payment method"

### Requirement: Manual payment presets

The dialog SHALL show three manual payment presets at the top of the list, in
this order, with these ids:

| Order | Name                 | Id              | Fallback icon |
| ----- | -------------------- | --------------- | ------------- |
| 1     | Direct bank transfer | `bank_transfer` | Landmark      |
| 2     | Cheque payments      | `cheque`        | ReceiptText   |
| 3     | Cash on delivery     | `cod`           | Banknote      |

Each preset SHALL have default instructions. The presets SHALL come from the
admin app, not from the remote gateway catalog. A preset SHALL show as added
when an offline payment method with the same id exists. The position of a
preset SHALL NOT change when it is added.

#### Scenario: Presets on top

- **WHEN** the admin opens the dialog
- **THEN** the first three rows are "Direct bank transfer", "Cheque payments" and "Cash on delivery", each with its fallback icon

#### Scenario: Preset already added

- **WHEN** an offline method with the id `cod` exists, with any name
- **THEN** the "Cash on delivery" row shows "Added" and no action

#### Scenario: Preset deleted

- **WHEN** the admin deletes the offline method with the id `cheque` and opens the dialog
- **THEN** the "Cheque payments" row shows the "Add" action

### Requirement: Adding a manual preset

Pressing "Add" on a manual preset SHALL create an offline payment method at once,
without a form, with the preset id, the preset name, the preset instructions, no
icon, and the enabled state on. After success, the row SHALL show "Added", and the
Payments list SHALL show the new method. After a failure, the error message
SHALL show and the row SHALL show "Add" again.

#### Scenario: Add bank transfer

- **WHEN** the admin presses "Add" on "Direct bank transfer"
- **THEN** an enabled offline method with the id `bank_transfer`, the name "Direct bank transfer" and the preset instructions is created
- **AND** the row shows "Added" and the method shows in the Payments list

#### Scenario: Add fails

- **WHEN** the create request fails
- **THEN** the error message shows and the row shows "Add" again

### Requirement: Client-side search

The dialog SHALL show a search input above the list. The input SHALL get focus
when the dialog opens. The input SHALL stay visible while the list scrolls. The
search SHALL filter manual presets and gateways by name with a case-insensitive
substring match, and SHALL NOT send a request. An empty search SHALL show all rows.

#### Scenario: Focus on open

- **WHEN** the dialog opens
- **THEN** the search input has focus

#### Scenario: Match by part of the name

- **WHEN** the list holds "Cash on delivery", "PayPal", "Paystack" and "Klarna" and the admin types "PAY"
- **THEN** the list shows "PayPal" and "Paystack" only, and no request is sent

#### Scenario: Match a manual preset

- **WHEN** the admin types "cheque"
- **THEN** the list shows "Cheque payments" only

#### Scenario: Clear the search

- **WHEN** the admin clears the search input
- **THEN** the list shows all rows again

#### Scenario: Search stays at the top

- **WHEN** the admin scrolls the list
- **THEN** the search input stays visible at the top of the dialog

### Requirement: List states

While the gateway list or the offline methods load, the dialog SHALL show a
skeleton list in place of the rows, with rows of the same height as the real
rows, and SHALL NOT show a spinner. If a load fails, the dialog SHALL show the error state with a
retry action. If the gateway list is empty, the manual presets SHALL still show.
If the search matches no row, the dialog SHALL show "No payment methods found".

#### Scenario: Loading

- **WHEN** the dialog opens and the lists are still loading
- **THEN** the dialog shows skeleton rows and no spinner

#### Scenario: No match

- **WHEN** the admin types a text that matches no name
- **THEN** the dialog shows "No payment methods found"

#### Scenario: Load fails

- **WHEN** a list request fails
- **THEN** the dialog shows the error state, and pressing retry loads the lists again

#### Scenario: No gateways

- **WHEN** the gateway catalog returns no gateways
- **THEN** the dialog shows the three manual presets

### Requirement: Compact rows with hover

Each row SHALL be compact: the icon, the name and the status badge on the left,
and at most one action on the right. When the pointer is on a row, or focus is
inside a row, the row SHALL change its background. The hover SHALL NOT change
the size or position of any row.

#### Scenario: Hover a row

- **WHEN** the pointer moves onto a row
- **THEN** the row background changes and no row moves

### Requirement: Gateway order

Gateways SHALL show under the manual presets. Installed gateways SHALL show
before gateways that are not installed. Inside each group, the list SHALL keep
the API order. The gateway order SHALL be set when the list first loads in the
open dialog, and SHALL NOT change while the dialog stays open. The next time the
dialog opens, the order SHALL use the current install status.

#### Scenario: Initial order

- **WHEN** the API returns Amazon Pay (not installed), PayPal (installed), Klarna (not installed), Paystack (installed)
- **THEN** the gateway order under the presets is PayPal, Paystack, Amazon Pay, Klarna

#### Scenario: Order is stable after an install

- **WHEN** the admin adds Klarna in the open dialog
- **THEN** Klarna stays in the same position and shows the "Added" badge

#### Scenario: Next open

- **WHEN** the admin closes and opens the dialog again after adding Klarna
- **THEN** Klarna shows in the installed group

### Requirement: Row status and actions

The row SHALL show its status and action as follows:

- Not added (manual preset) or not installed (gateway): no badge; an "Add"
  button with no background on the right. The "Add" button SHALL show only when
  the row has hover or focus inside it.
- Added, and no gateway update offered or blocked: an "Added" badge; nothing on
  the right.
- Gateway installed, update offered: an "Update Available" badge in place of
  "Added"; a small secondary "Update" button on the right that always shows.
- Gateway installed, update blocked by a requirement: an "Update Available"
  badge in place of "Added"; an info icon on the right that always shows, whose
  tooltip shows the blocked reason; no "Update" button.

#### Scenario: Not added, no hover

- **WHEN** a not-added row has no hover and no focus
- **THEN** the "Add" button is not visible and the row keeps its height

#### Scenario: Not added, hover

- **WHEN** the pointer moves onto a not-added row
- **THEN** the "Add" button shows

#### Scenario: Keyboard access to Add

- **WHEN** the admin moves focus with the Tab key onto the "Add" button of a row
- **THEN** the "Add" button shows

#### Scenario: Added, no update

- **WHEN** a row is added with no offered and no blocked update
- **THEN** the row shows "Added" and no action

#### Scenario: Update offered

- **WHEN** a gateway is installed and an update is offered
- **THEN** the row shows "Update Available" and an "Update" button, and no "Added" badge

#### Scenario: Update blocked

- **WHEN** a gateway is installed and the update is blocked because it needs Kirki eCommerce 1.1.0 and the store has 1.0.0
- **THEN** the row shows "Update Available" and an info icon, the icon tooltip reads "This update needs Kirki eCommerce 1.1.0 or newer (you have 1.0.0). Update Kirki eCommerce first, then update this gateway.", and no "Update" button shows

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

