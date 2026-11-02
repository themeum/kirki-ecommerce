# email-notification-templates Specification

## Purpose

Lets store owners view, edit, preview, and send a test of the content (subject,
heading, message) for every transactional notification email the store can send —
customer and admin, across order, user, and inventory events — rather than only the
one notification type that works today.

## Requirements

### Requirement: Notification rows display a human-readable label
Every notification row on the Email settings page SHALL display a human-readable title
identifying which event it represents, for all 15 customer/admin notification keys.

#### Scenario: Row titles are never blank
- **WHEN** the Email settings page loads the customer and admin notification lists
- **THEN** every row (order, user, and inventory notifications, for both customer and
  admin) shows a non-empty, human-readable title describing the notification event

### Requirement: Each notification is individually addressable and editable
Each notification (identified by its recipient type, group, and key — e.g. "customer
order confirmation" or "admin low stock alert") SHALL have its own editor where its
subject, heading, and message content can be viewed and changed independently of every
other notification.

#### Scenario: Editing one notification does not affect others
- **WHEN** a user edits and saves the subject, heading, or message of one notification
- **THEN** only that notification's stored content changes; every other notification's
  content and enabled/disabled state remains exactly as it was before

#### Scenario: Edit action opens the matching editor
- **WHEN** a user selects Edit on a notification row
- **THEN** they are taken to that specific notification's editor, pre-filled with its
  current subject, heading, and message

### Requirement: Preview reflects shortcode substitution in real time
While editing a notification's subject, heading, or message, the preview SHALL update
to reflect the current draft content, including substitution of any shortcode
placeholders (e.g. `{customer_name}`, `{order_number}`) with representative sample
values, without requiring the user to save first.

#### Scenario: Typing updates the preview immediately
- **WHEN** a user changes the heading or message field, including text containing a
  shortcode placeholder
- **THEN** the preview reflects the change immediately, with any recognized shortcode
  replaced by its sample value and any unrecognized placeholder left as literal text

### Requirement: Preview and test-send work for every notification key
Every one of the 15 notification keys SHALL support both generating a preview and
sending a test email, each rendered with sample data appropriate to that notification's
subject matter (an order, a customer, or a product/inventory item).

#### Scenario: Preview an order-related notification
- **WHEN** a user requests a preview of any customer or admin order-event notification
- **THEN** the system returns rendered HTML populated with sample order data

#### Scenario: Preview a user or inventory notification
- **WHEN** a user requests a preview of the password-reset notification or the
  low-stock notification
- **THEN** the system returns rendered HTML populated with sample customer data or
  sample product/inventory data, respectively

#### Scenario: Test-send reflects unsaved draft content
- **WHEN** a user sends a test email for a notification they have edited but not yet
  saved
- **THEN** the delivered email reflects the unsaved draft subject/heading/message, sent
  to the current user's account email address

#### Scenario: Unknown notification is rejected clearly
- **WHEN** a preview or test-send request references a recipient type, group, or key
  that does not correspond to a known notification
- **THEN** the system responds with a clear error rather than a server crash or a
  silently wrong template

### Requirement: Unsaved edits are protected against accidental loss
A notification editor with unsaved changes SHALL warn the user before navigating away,
consistent with other settings editors in the app.

#### Scenario: Navigating away with unsaved changes
- **WHEN** a user has unsaved edits in a notification editor and attempts to navigate
  away
- **THEN** they are warned and can choose to stay, discard, or save before leaving
