## ADDED Requirements

### Requirement: Dynamic output is escaped in code, not suppressed by comment

Every value echoed or printed by plugin PHP, and every dynamic string passed to an inline-style or inline-script API, SHALL pass through an escaping or sanitizing call suited to its output context. A `phpcs:ignore` comment SHALL NOT be the only protection for a dynamic value.

#### Scenario: Plain value printed in HTML

- **WHEN** application code prints a value into HTML text or an attribute
- **THEN** the value passes through the matching escaping function (`esc_html()`, `esc_attr()`, `esc_url()` or equivalent) at the point of output

#### Scenario: Block-template markup

- **WHEN** the plugin prints markup produced by rendering a block theme's header or footer template
- **THEN** the markup passes through a sanitizer with an allow-list that keeps the valid block markup, and a block-theme page still renders the same header and footer

#### Scenario: Inline CSS and JavaScript

- **WHEN** the plugin adds inline CSS or JavaScript through `wp_add_inline_style()` or `wp_add_inline_script()`
- **THEN** the CSS has HTML tags stripped, and the JavaScript data is built from JSON encoded with tag-safe flags

#### Scenario: Suppression comment on a dynamic value

- **WHEN** a dynamic value is printed with an `EscapeOutput` suppression comment and no escaping call
- **THEN** the change fails review, unless the value is a protocol response whose exact body a third party requires and the reason is recorded in code

### Requirement: Payment webhook acknowledgement bodies are not corrupted by escaping

The webhook handler SHALL output the acknowledgement body in the exact form the payment provider requires, while still sending a sanitized `Content-Type` header.

#### Scenario: Plain-text acknowledgement

- **WHEN** a provider's webhook returns a plain-text body
- **THEN** the body is escaped for plain text, the provider still accepts it, and the header content type is a sanitized MIME type

#### Scenario: XML acknowledgement

- **WHEN** a provider's webhook returns an XML body
- **THEN** the body reaches the provider as valid XML, and the provider's webhook flow still succeeds
