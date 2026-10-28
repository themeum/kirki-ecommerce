## Purpose

Defines the manual build command that packages each gateway plugin in
`payments/` as an installable WordPress zip with a logo and metadata, ready to
upload to the catalog server.

## ADDED Requirements

### Requirement: One installable zip is built per gateway

The build command SHALL create, for every `kirki-*` gateway folder in
`payments/`, a folder `payment-server/gateways/<slug>/` that contains `<slug>.zip`,
`logo.svg`, and `meta.json`. The zip SHALL contain a single top-level folder
named `<slug>` so that WordPress installs it as a plugin.

#### Scenario: Building all gateways

- **WHEN** the maintainer runs the build command
- **THEN** each gateway folder produces `payment-server/gateways/<slug>/<slug>.zip`,
  `logo.svg`, and `meta.json`

#### Scenario: A new gateway is added

- **WHEN** a new `payments/kirki-<name>/` folder exists and the command runs
- **THEN** it is built without any edit to a hand-kept list

### Requirement: Dependencies are installed for packaging only

When a gateway has a `composer.json`, the build command SHALL run
`composer install` without dev dependencies in a staging copy and include the
resulting `vendor/` in the zip. The gateway source folder SHALL NOT be
modified, and development files SHALL NOT be included in the zip.

#### Scenario: Gateway with Composer dependencies

- **WHEN** a gateway has a `composer.json`
- **THEN** its zip contains `vendor/` with production dependencies only and the
  source folder has no new files

#### Scenario: Gateway without Composer dependencies

- **WHEN** a gateway has no `composer.json`
- **THEN** no Composer command runs for it

### Requirement: Metadata is generated from the plugin

`meta.json` SHALL contain the gateway `id`, `name`, `description`, `version`,
and the SHA-256 checksum of the zip. `name`, `description`, and `version` SHALL
come from the plugin header comment. The command SHALL fail with a clear
message when a gateway has no valid header or no `assets/logo.svg`.

#### Scenario: Checksum matches the zip

- **WHEN** the build finishes
- **THEN** `meta.json.sha256` equals the SHA-256 of the built zip

#### Scenario: Missing logo

- **WHEN** a gateway has no `assets/logo.svg`
- **THEN** the command stops and names the gateway

### Requirement: Payment server builds the list on the fly

The payment server SHALL answer `GET /payments` with a list built by reading
`payment-server/gateways/*/meta.json` on each request, adding `icon_url` and
`download_url` made from its own base URL. It SHALL serve the zips and logos
as static files.

#### Scenario: Listing gateways

- **WHEN** a client requests `/payments`
- **THEN** each built gateway is listed with `id`, `name`, `description`,
  `version`, `icon_url`, `download_url`, and `sha256`

#### Scenario: Gateway added after server start

- **WHEN** a new gateway folder appears in `payment-server/gateways`
- **THEN** the next `/payments` response includes it without a restart
