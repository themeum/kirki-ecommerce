# wp-org-required-standards Specification

## Purpose

Defines the subset of WordPress coding and security practices that are
required for WordPress.org Plugin Directory approval (as distinct from
general WordPress coding-standard style preferences), and requires
automated tooling that keeps the codebase passing that subset going
forward.

## Requirements

### Requirement: Translated strings used in exceptions are escaped

Any translated string passed into a thrown exception or similar
error-surfacing mechanism SHALL be escaped for output (e.g. via
`esc_html__()`/`esc_html_e()`) rather than passed through the bare
translation function.

#### Scenario: Exception message built from a translated string

- **WHEN** application code constructs an exception message from a
  translation function call
- **THEN** the translation function call is one of the escaping
  variants (`esc_html__()`, `esc_html_e()`, or equivalent), not the
  bare `__()`/`_e()`

### Requirement: Translatable strings with placeholders carry translator context

Any translation function call whose string contains `sprintf()`-style
placeholders SHALL be preceded by a `translators:` comment describing
each placeholder, and multi-placeholder strings SHALL use numbered
placeholders (`%1$s`, `%2$s`, ...) rather than positional (`%s`, `%s`).

#### Scenario: Translated string with placeholders

- **WHEN** a translation function call's string contains one or more
  `%s`/`%d`-style placeholders
- **THEN** a `translators:` comment immediately precedes the call, and
  if there is more than one placeholder they are numbered

### Requirement: Template files guard against direct access

Every PHP file under `resources/views/` SHALL begin with a direct
file-access guard (`defined('ABSPATH') || exit;` or equivalent) before
any other executable code.

#### Scenario: Template file requested directly

- **WHEN** a file under `resources/views/` is requested directly
  without WordPress having been bootstrapped
- **THEN** the file exits immediately instead of executing further

### Requirement: Plugin code stays within its declared WordPress version support

The plugin SHALL NOT call a WordPress core function, class, or method
that requires a WordPress version newer than the plugin's declared
"Requires at least" header, unless that header is raised to match.

#### Scenario: Using a WordPress API introduced after the declared minimum

- **WHEN** application code calls a WordPress core API
- **THEN** that API is available in the WordPress version declared in
  the plugin's "Requires at least" header

### Requirement: Plugin code does not mutate global PHP runtime state

The plugin SHALL NOT change process-wide PHP runtime configuration
(such as the default timezone) in a way that affects other plugins,
themes, or WordPress core running in the same request.

#### Scenario: Plugin needs a specific timezone for its own date handling

- **WHEN** the plugin performs date/time calculations that assume a
  specific timezone
- **THEN** it scopes that assumption to its own code path (e.g. via
  explicit `DateTimeZone` arguments or WordPress's own date/time
  APIs) instead of changing the process-wide default timezone

### Requirement: Automated tooling enforces the required-only standard

The project SHALL run an automated check, scoped to the sniff
categories in this capability (security escaping/sanitization/nonces,
i18n, direct file access, WordPress-version compatibility, global
runtime state, global-scope naming), as part of continuous
integration, and a violation SHALL fail the build.

#### Scenario: A change introduces a required-standard violation

- **WHEN** a pull request introduces code that violates one of this
  capability's requirements
- **THEN** the CI check scoped to this capability's sniff categories
  fails

#### Scenario: A change violates a style preference outside this capability's scope

- **WHEN** a pull request introduces code that violates a WordPress
  coding-standard style preference not covered by this capability
  (e.g. local variable naming)
- **THEN** the CI check added for this capability does not fail
  because of it

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
- **THEN** the change fails review, unless the value is a protocol response whose exact body a third party requires, or CSS built only from developer-written arrays with its tags stripped (the email style block), and the reason is recorded in code

### Requirement: Payment webhook acknowledgement bodies are not corrupted by escaping

The webhook handler SHALL output the acknowledgement body in the exact form the payment provider requires, while still sending a sanitized `Content-Type` header.

#### Scenario: Plain-text acknowledgement

- **WHEN** a provider's webhook returns a plain-text body
- **THEN** the body is escaped for plain text, the provider still accepts it, and the header content type is a sanitized MIME type

#### Scenario: XML acknowledgement

- **WHEN** a provider's webhook returns an XML body
- **THEN** the body reaches the provider as valid XML, and the provider's webhook flow still succeeds
