# payment-gateway-packaging Specification

## Purpose
Defines the manual build command that packages each gateway plugin in
`payments/` as an installable WordPress zip with a logo and metadata, ready to
publish to a public S3 bucket, together with the static catalog file.
## Requirements
### Requirement: One installable zip is built per gateway

The build command SHALL create, for every `kirki-*` gateway folder in
`payments/` that it builds, a folder `gateways/<slug>/` that contains
`<slug>-<version>.zip`, `logo.svg`, and `meta.json`. The zip name SHALL
include the plugin version, so that each version has its own URL and an
uploaded zip never changes. The zip SHALL contain a single top-level folder
named `<slug>` so that WordPress installs it as a plugin. Without `--full`,
the command SHALL build only the gateways that the incremental rule selects.
With `--full`, it SHALL build all gateways.

#### Scenario: Building all gateways

- **WHEN** the maintainer runs the build command with `--full`
- **THEN** each gateway folder produces `gateways/<slug>/<slug>-<version>.zip`,
  `logo.svg`, and `meta.json`

#### Scenario: Versioned zip name

- **WHEN** `kirki-payfast` has `Version: 1.0.1`
- **THEN** its zip is `gateways/kirki-payfast/kirki-payfast-1.0.1.zip` and its
  catalog `download_url` ends with `/kirki-payfast/kirki-payfast-1.0.1.zip`

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

`meta.json` SHALL contain the gateway `id`, `slug`, `name`, `description`,
`version`, `requires_kirki_ecommerce`, `requires_wp`, `requires_php`, `changelog`, and
the SHA-256 checksum of the zip. `name`, `description`, `version` and the
three requirements SHALL come from the plugin header comment (`Requires
Kirki`, `Requires at least`, `Requires PHP`). A missing requirement header
SHALL give an empty value. `changelog` SHALL be the text of the gateway's
`CHANGELOG.md`, or empty when the file does not exist. The command SHALL fail
with a clear message when a gateway has no valid header or no
`assets/logo.svg`.

#### Scenario: Checksum matches the zip

- **WHEN** the build finishes
- **THEN** `meta.json.sha256` equals the SHA-256 of the built zip

#### Scenario: Missing logo

- **WHEN** a gateway has no `assets/logo.svg`
- **THEN** the command stops and names the gateway

#### Scenario: Requirement header

- **WHEN** a gateway header has `Requires Kirki eCommerce: 1.1.0`
- **THEN** its `meta.json` and catalog entry have `requires_kirki_ecommerce` `1.1.0`

#### Scenario: Changelog

- **WHEN** a gateway has a `CHANGELOG.md`
- **THEN** its `meta.json.changelog` holds the text of that file

### Requirement: Build writes the catalog file

The build command SHALL write `gateways/payments`, a JSON list of every
gateway in `payments/`, built or kept, with `id`, `slug`, `name`,
`description`, `version`, `requires_kirki_ecommerce`, `requires_wp`, `requires_php`,
`icon_url`, `download_url`, `sha256` and `source_sha256`. `download_url` SHALL
start with the `BASE_URL` value and `icon_url` with the `ICON_BASE_URL` value.
The list SHALL be sorted by `order` (lowest first), then by name A to Z, with
gateways without `order` last. A gateway in the live catalog that has no
folder in `payments/` SHALL NOT be in the new catalog, and the command SHALL
name it in its output.

#### Scenario: Listing gateways

- **WHEN** the build finishes
- **THEN** `gateways/payments` lists every gateway with all the fields and the
  URLs made from the two base values

#### Scenario: A new gateway is added

- **WHEN** a new gateway folder exists and the build runs again
- **THEN** the catalog file includes it with no list edit

#### Scenario: Gateway folder removed

- **WHEN** the live catalog lists `kirki-old` and `payments/kirki-old/` does
  not exist
- **THEN** the new catalog does not list it, and the output says that it was
  removed

### Requirement: Publish uploads in a safe order

The publish command SHALL build the gateways, then upload the zip, logo and
`meta.json` of each gateway that the build wrote, and upload the `payments`
catalog last with `Content-Type: application/json` and a short
`Cache-Control`. It SHALL NOT upload the folders of gateways that the build
kept, and it SHALL NOT delete objects from the bucket, so the zips of older
versions stay available. The bucket and endpoint SHALL come from environment
values, so the same command targets a local S3 or a real one.

#### Scenario: Upload order

- **WHEN** the publish command runs
- **THEN** the catalog object is written only after all zips, logos and
  `meta.json` files are uploaded

#### Scenario: Only changed gateways

- **WHEN** the build wrote only `kirki-bkash` and `kirki-sslcommerz`
- **THEN** the command uploads only those two folders and the catalog

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

### Requirement: Build is incremental and driven by the version

Without `--full`, the build command SHALL read the live catalog from
`{ICON_BASE_URL}/payments`. For each gateway in `payments/`, it SHALL build
the gateway when the live catalog has no entry with its slug, or when the
plugin `Version` header differs from the live `version`. For each other
gateway it SHALL keep the live `sha256` and `source_sha256`, write no
folder, and keep the live `id`, `name`, `description`, `requires_kirki_ecommerce`,
`requires_wp` and `requires_php`, because these describe the live zip. Only the
sort order SHALL come from the source plugin header.
The command SHALL fail with a clear message, and SHALL tell the maintainer to
use `--full`, when the live catalog cannot be loaded, when a kept entry has no
`slug` or `source_sha256`, or when a kept `download_url` does not start with
`BASE_URL`.

#### Scenario: One gateway changed

- **WHEN** only `kirki-payfast` has a new `Version` and the build runs
- **THEN** only `gateways/kirki-payfast/` is written, and the catalog keeps the
  live `sha256` of all other gateways

#### Scenario: Header changed without a new version

- **WHEN** a gateway's `Requires Kirki eCommerce` header changes but its `Version` does not
- **THEN** the build keeps the live zip and the live `requires_kirki_ecommerce`, and prints
  the warning that the source changed but the version did not

#### Scenario: Live catalog unreachable

- **WHEN** the live catalog request fails
- **THEN** the command stops, writes no catalog, and says to use `--full`

#### Scenario: Live catalog from before this change

- **WHEN** a live entry has no `slug` or no `source_sha256`
- **THEN** the command stops and says to use `--full`

### Requirement: Build warns about a change without a version bump

The build command SHALL compute a `source_sha256` from the gateway source
files, without `vendor/`, `node_modules/` and system files. When a gateway is
kept and its `source_sha256` differs from the live value, the command SHALL
print a warning that names the gateway and says to change its version. The
command SHALL still finish.

#### Scenario: Code changed, version not changed

- **WHEN** a gateway file changed and its `Version` header is the same as the
  live `version`
- **THEN** the output warns that the gateway changed but its version did not,
  and the gateway is not built

### Requirement: Build prints the upload list

At the end, the build command SHALL print the folders that it wrote, the
gateways that it kept, the gateways that it removed, and a note to upload the
catalog file last.

#### Scenario: Manual upload

- **WHEN** the build finishes
- **THEN** the output lists each written `gateways/<slug>/` folder, then
  `gateways/payments` with the note "upload last"

