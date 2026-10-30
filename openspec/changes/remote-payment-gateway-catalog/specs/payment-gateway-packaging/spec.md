## Purpose

Defines the manual build command that packages each gateway plugin in
`payments/` as an installable WordPress zip with a logo and metadata, ready to
publish to a public S3 bucket, together with the static catalog file.

## ADDED Requirements

### Requirement: One installable zip is built per gateway

The build command SHALL create, for every `kirki-*` gateway folder in
`payments/`, a folder `gateways/<slug>/` that contains `<slug>.zip`,
`logo.svg`, and `meta.json`. The zip SHALL contain a single top-level folder
named `<slug>` so that WordPress installs it as a plugin.

#### Scenario: Building all gateways

- **WHEN** the maintainer runs the build command
- **THEN** each gateway folder produces `gateways/<slug>/<slug>.zip`,
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

### Requirement: Build writes the catalog file

The build command SHALL write `gateways/payments`, a JSON list of every built
gateway with `id`, `name`, `description`, `version`, `icon_url`,
`download_url`, and `sha256`. `download_url` SHALL start with the `BASE_URL`
value and `icon_url` with the `ICON_BASE_URL` value. The list SHALL be sorted
by `order` (lowest first), then by name A to Z, with gateways without `order`
last.

#### Scenario: Listing gateways

- **WHEN** the build finishes
- **THEN** `gateways/payments` lists each built gateway with all seven fields
  and the URLs made from the two base values

#### Scenario: A new gateway is added

- **WHEN** a new gateway folder exists and the build runs again
- **THEN** the catalog file includes it with no list edit

### Requirement: Publish uploads in a safe order

The publish command SHALL build the gateways, then upload every zip and logo
to the bucket, and upload the `payments` catalog last with
`Content-Type: application/json` and a short `Cache-Control`. The bucket and
endpoint SHALL come from environment values, so the same command targets a
local S3 or a real one.

#### Scenario: Upload order

- **WHEN** the publish command runs
- **THEN** the catalog object is written only after all zips and logos are
  uploaded

#### Scenario: Local S3

- **WHEN** the endpoint value points to the local S3 container
- **THEN** the objects are uploaded there and a request to
  `{bucket-url}/payments` returns the catalog

### Requirement: Local S3 environment for testing

The repository SHALL provide a Docker setup that runs a local S3 (RustFS) with a
public-read bucket, started and stopped with npm scripts.

#### Scenario: Starting the local S3

- **WHEN** the maintainer runs `npm run s3:up`
- **THEN** the bucket exists and its objects can be read without credentials
