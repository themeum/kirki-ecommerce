## Purpose

Defines the email template editor's own save/discard/unsaved-changes behavior as a full-page editor, and how its template preview stays live as the merchant edits branding fields without issuing repeated preview requests.

## ADDED Requirements

### Requirement: Editor owns Save, Discard, and unsaved-changes protection independently

The email template editor SHALL present Save and Discard in its own page header, driven by its own form's dirty and in-progress-save state, without depending on the settings shell's shared floating bar. While the editor reports unsaved changes, it SHALL block in-app navigation away from the page and shake to indicate the block, and it SHALL surface the browser's native unsaved-changes prompt on reload or tab close. These protections SHALL clear once the changes are saved or discarded.

#### Scenario: Editing shows Save and Discard

- **WHEN** the merchant changes a logo, height, position, or color field
- **THEN** Save and Discard appear in the editor's own header
- **AND** no floating bar appears anywhere on the page

#### Scenario: Navigating away while dirty is blocked

- **WHEN** the merchant has unsaved changes and attempts to navigate to another page in the application
- **THEN** the navigation does not complete
- **AND** the editor's Save/Discard controls indicate the blocked attempt

#### Scenario: Discard reverts and clears the guard

- **WHEN** the merchant activates Discard
- **THEN** the form reverts to the last saved values
- **AND** Save and Discard disappear from the header
- **AND** navigating away or reloading no longer prompts a warning

#### Scenario: Reloading with unsaved changes warns

- **WHEN** the merchant has unsaved changes and reloads or closes the browser tab
- **THEN** the browser's native unsaved-changes prompt is shown

### Requirement: Template preview reflects live edits without repeated network requests

The template preview SHALL be fetched from the backend exactly once when the editor loads. After that initial load, every subsequent edit to logo, height, position, or any color field SHALL be reflected in the visible preview by updating the already-loaded preview in place, without issuing any further preview request for the remainder of the session on that page.

#### Scenario: Initial preview load

- **WHEN** the editor finishes loading
- **THEN** the template preview renders showing the sample order-confirmation email styled with the currently saved branding settings

#### Scenario: Editing a color updates the preview instantly

- **WHEN** the merchant changes a color field
- **THEN** the corresponding element(s) in the visible preview update to the new color immediately
- **AND** no additional preview request is issued

#### Scenario: Editing logo height or position updates the preview instantly

- **WHEN** the merchant adjusts the logo height slider or changes its alignment
- **THEN** the preview's logo reflects the new height or alignment immediately
- **AND** no additional preview request is issued

#### Scenario: Uploading a new logo updates the preview instantly

- **WHEN** the merchant uploads a new logo image
- **THEN** the preview's logo image updates to the newly uploaded image once its URL is available
- **AND** no additional preview request is issued

### Requirement: Preview renders a representative sample order-confirmation email

The template preview SHALL always display a fixed, representative sample order-confirmation email — including sample line items, totals, a customer note, order details, and addresses — so the merchant can evaluate their branding in a realistic context. The preview SHALL NOT depend on or display data from any real order.

#### Scenario: Preview shows sample content

- **WHEN** the template preview is displayed
- **THEN** it shows a complete sample order-confirmation email with sample order items, totals, customer note, order details, and addresses
- **AND** none of that content is loaded from a real store order

### Requirement: Send Test Mail sends the currently edited template, saved or not

Activating Send Test Mail SHALL send the sample order-confirmation email, styled with the branding fields currently in the form (whether or not they have been saved), to the logged-in merchant's own account email address.

#### Scenario: Sending a test mail with unsaved changes

- **WHEN** the merchant has unsaved branding edits and activates Send Test Mail
- **THEN** the email delivered reflects those unsaved edits
- **AND** the merchant's saved settings are not changed as a result

#### Scenario: Test mail delivery confirmation

- **WHEN** Send Test Mail completes successfully
- **THEN** the merchant sees a confirmation that the test email was sent

#### Scenario: Test mail delivery failure

- **WHEN** the test email fails to send
- **THEN** the merchant sees an error indicating the send failed
