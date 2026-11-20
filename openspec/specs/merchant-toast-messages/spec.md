# merchant-toast-messages Specification

## Purpose

Rules for the text of success toasts in the Kirki eCommerce merchant app, so that each toast tells the merchant the exact action that occurred, on which item, in one consistent style.

## Requirements

### Requirement: Success toast tells the exact action

A success toast in the merchant app SHALL name the action that the merchant did. It SHALL NOT use a general word ("updated", "Settings saved") when the action is more specific: activate, deactivate, enable, disable, create, delete, remove, duplicate, set as default, remove as default, move to trash, or restore.

A generic message is correct only when the action is a form save that changes many fields, for example "Product updated" or "Settings saved" from a settings page Save button.

#### Scenario: Payment method switch

- **WHEN** the merchant turns a payment method switch off on Settings > Payments
- **THEN** the toast says that the payment method is deactivated
- **AND** the toast does not say "Payment method updated"

#### Scenario: Shipping zone deactivated from its menu

- **WHEN** the merchant selects "Deactivate" on a shipping zone
- **THEN** the toast says that the shipping zone is deactivated
- **AND** the toast does not say "Settings saved"

#### Scenario: Settings page Save button

- **WHEN** the merchant clicks Save on the General settings page
- **THEN** the toast says "Settings saved"

### Requirement: Toggle verb matches the control

A toggle toast SHALL use the verb of the control that the merchant used:

| Control | Toast verb |
|---|---|
| Menu item "Activate" / "Deactivate" | activated / deactivated |
| Menu item "Enable" / "Disable" | enabled / disabled |
| Switch (no visible verb) | activated / deactivated |

#### Scenario: Coupon deactivated

- **WHEN** the merchant selects "Deactivate" on a coupon row
- **THEN** the toast uses "deactivated"

#### Scenario: Shipping method switch turned on

- **WHEN** the merchant turns a shipping method switch on
- **THEN** the toast uses "activated"

### Requirement: Single-item row actions name the item

When the merchant does an action on one item from a list row or from that item's page, and the app shows the item name, the toast SHALL include that name in double quotes, followed by the action. The actions are:

| Item | Actions |
|---|---|
| Payment method | activated, deactivated, deleted (offline), removed (online gateway) |
| Shipping zone | activated, deactivated, deleted |
| Shipping method | activated, deactivated, deleted |
| Shipping carrier | activated, deactivated, deleted |
| Shipping box | set as default, removed as default, deleted |
| Shipping profile, tax profile | deleted |
| Coupon (title, or code when the title is empty) | activated, deactivated, duplicated, deleted |
| Currency (code) | removed |
| Brand, tag, category, collection, customer, attribute, attribute value | deleted |
| Product | duplicated, moved to trash, restored, deleted permanently |

If the name is empty or not known, the toast SHALL use the item type in place of the name (for example "Payment method deactivated").

Bulk actions on many items, and form saves, SHALL NOT name items.

#### Scenario: Named payment method toggle

- **WHEN** the merchant turns off the switch of the payment method "Cash on delivery"
- **THEN** the toast says `"Cash on delivery" deactivated`

#### Scenario: Named brand delete

- **WHEN** the merchant deletes the brand "Acme" from the brand table
- **THEN** the toast says `"Acme" deleted`

#### Scenario: Bulk delete has no names

- **WHEN** the merchant deletes 3 brands with the bulk action
- **THEN** the toast does not name the brands

#### Scenario: Name not known

- **WHEN** a single-item action has no item name
- **THEN** the toast uses the item type, for example "Shipping box deleted"

### Requirement: REST messages tell the exact action

A merchant REST endpoint that knows the action from its input SHALL return a `message` that names that action. The response shape SHALL NOT change.

| Endpoint | Message |
|---|---|
| Online and offline payment `set_enabled` | "Payment method activated" when `is_enabled` is true, else "Payment method deactivated" |
| Order `partial` with only `order_notes` | "Order note updated" |
| Order `partial` with only `flags` | "Order flags updated" |
| Order `partial` with both fields | "Order updated" |
| Variant `bulk_update` | "Variants updated" |
| Online payment `update_plugin` | "Payment gateway updated to the latest version" |

#### Scenario: set_enabled with is_enabled false

- **WHEN** a client sends `set_enabled` with `is_enabled` false for an offline payment method
- **THEN** the response `message` is "Payment method deactivated"
- **AND** the response still has the `data` field with the same value as before

#### Scenario: Order note saved

- **WHEN** the merchant saves the order note on the order details page
- **THEN** the toast says "Order note updated"

### Requirement: One toast for each action

One merchant action SHALL show one success toast.

#### Scenario: Online payment edit dialog

- **WHEN** the merchant saves the online payment gateway edit dialog
- **THEN** one success toast shows

#### Scenario: Shipping box set as default

- **WHEN** the merchant sets a shipping box as default
- **THEN** one success toast shows, which says that the box is set as default

### Requirement: Success toast title style

The title of every success toast in the merchant app SHALL:

- be a short phrase in the past tense, for example "Order marked as shipped";
- have no trailing period;
- not contain the word "successfully".

This SHALL apply to text from PHP and text from the front end. A toast description can be a full sentence. Error and warning toasts, and storefront (`Api/Site/*`) messages, are not in the scope of this requirement.

The order action messages SHALL be:

| Action | Message |
|---|---|
| Mark as processing | Order marked as processing |
| Resume fulfillment | Fulfillment resumed |
| Mark as shipped | Order marked as shipped |
| Mark as delivered | Order marked as delivered |
| Put on hold | Order put on hold |
| Cancel fulfillment | Fulfillment cancelled |
| Cancel order | Order cancelled |
| Add tracking | Tracking number added |
| Remove tracking | Tracking number removed |
| Mark as paid | Order marked as paid |
| Resend order email | Order email resent |
| Archive order | Order archived |
| Initiate refund | Refund initiated |
| Approve refund | Refund approved |
| Decline refund | Refund declined |
| Mark refund complete | Refund marked as completed |

The email template messages SHALL be "Template restored to default" and "Test email sent".

#### Scenario: Order marked as delivered

- **WHEN** the merchant marks an order as delivered
- **THEN** the toast says "Order marked as delivered" with no period

#### Scenario: Test email

- **WHEN** the merchant sends a test email from an email template page
- **THEN** the toast says "Test email sent"
