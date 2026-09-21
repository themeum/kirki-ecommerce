## Purpose

Defines the backend rendering system for transactional emails: reusable atomic view partials composed into full email templates, and the endpoints that render them for preview and for test delivery.

## ADDED Requirements

### Requirement: Transactional emails are composed from reusable atomic partials

A transactional email template SHALL be composed from independently reusable partials, at minimum: a header (logo), a content/greeting section, an order summary (line items and totals), a customer note section, an order details section (order number/date, shipping/payment method, billing/shipping addresses), and a footer. Each partial SHALL be usable on its own by other transactional email templates without modification.

#### Scenario: Order-confirmation template composition

- **WHEN** the order-confirmation email is rendered
- **THEN** its output is assembled from the header, content, order summary, customer note, order details, and footer partials

#### Scenario: A partial is reused by another template

- **WHEN** a new transactional email template is built that needs the same order summary presentation
- **THEN** it reuses the existing order summary partial rather than duplicating its markup

### Requirement: Rendered email markup is compatible with common email clients

Every transactional email partial and the templates composed from them SHALL render as self-contained, table-based HTML with styles applied inline, without depending on an external stylesheet or JavaScript. Layouts SHALL remain legible and usable when rendered at narrow (mobile) viewport widths within the constraints of common email clients.

#### Scenario: No external dependencies

- **WHEN** a transactional email is rendered
- **THEN** its HTML contains no `<link>` to an external stylesheet and no `<script>` tags
- **AND** all visual styling is expressed via inline style attributes

#### Scenario: Narrow viewport rendering

- **WHEN** a rendered transactional email is viewed at a narrow mobile width
- **THEN** its content reflows to remain legible (e.g. columns stack) rather than being clipped or requiring horizontal scrolling

### Requirement: Preview endpoint renders the order-confirmation email with current settings and sample data

An authenticated preview endpoint SHALL render the order-confirmation template using the currently saved email template settings (logo, height, position, colors) and a fixed sample order dataset, returning the complete rendered HTML. Elements whose appearance is controlled by an editable branding field SHALL carry an identifying attribute in the returned markup so that a caller can locate and update them without re-requesting the endpoint.

#### Scenario: Fetching the preview

- **WHEN** an authenticated request is made to the preview endpoint
- **THEN** it returns the fully rendered order-confirmation email HTML, styled with the currently saved branding settings and populated with the sample order data

#### Scenario: Branding-controlled elements are identifiable

- **WHEN** the preview HTML is returned
- **THEN** the logo image and every color-driven element carry an attribute identifying which branding field controls them

#### Scenario: Unauthenticated request is rejected

- **WHEN** an unauthenticated request is made to the preview endpoint
- **THEN** it is rejected and no email HTML is returned

### Requirement: Send-test-mail endpoint sends the order-confirmation email with submitted settings

An authenticated endpoint SHALL accept a set of email template settings (logo, height, position, colors) — independent of what is currently saved — render the order-confirmation template with those settings and the fixed sample order dataset, and send the result to the requesting merchant's own account email address.

#### Scenario: Sending with submitted settings

- **WHEN** an authenticated request is made to the send-test-mail endpoint with a set of branding settings
- **THEN** the order-confirmation email rendered with those settings is sent to the requesting merchant's account email address
- **AND** the merchant's saved email template settings are unchanged

#### Scenario: Send failure is reported

- **WHEN** the underlying email delivery fails
- **THEN** the endpoint reports the failure rather than indicating success

#### Scenario: Unauthenticated request is rejected

- **WHEN** an unauthenticated request is made to the send-test-mail endpoint
- **THEN** it is rejected and no email is sent
