# payment-gateway-updates Specification

## Purpose
Lets a store find and install new versions of its payment gateway plugins,
which are not in the wp.org directory, through the WordPress update screens
and the Payments settings, with the same package check as a first install.
## Requirements
### Requirement: Gateway updates are found from the catalog

The system SHALL treat a gateway as having an update when all of these are
true: a plugin is installed at `<slug>/<slug>.php` for a catalog entry's
`slug`, and the catalog `version` is greater than the installed plugin's
`Version` header, compared as version strings. The system SHALL NOT offer an
update when the catalog version is equal to or lower than the installed one.
Only plugins that match a catalog `slug` SHALL be affected.

#### Scenario: Newer version in the catalog

- **WHEN** `kirki-payfast/kirki-payfast.php` has `Version: 1.0.0` and the
  catalog entry with slug `kirki-payfast` has `version` `1.0.1`
- **THEN** the system reports an update to `1.0.1` for that gateway

#### Scenario: Same or older version in the catalog

- **WHEN** the installed version is `1.0.1` and the catalog version is
  `1.0.1` or `1.0.0`
- **THEN** the system reports no update for that gateway

#### Scenario: Plugin that is not in the catalog

- **WHEN** an installed plugin has no catalog entry with its folder name as
  `slug`
- **THEN** the system does not change the update data of that plugin

#### Scenario: Catalog cannot be loaded

- **WHEN** the catalog request fails and no cached copy exists
- **THEN** the system reports no gateway updates and the WordPress update
  check continues without an error

### Requirement: Updates respect the gateway requirements

The system SHALL compare the catalog `requires_kirki_ecommerce`, `requires_wp` and
`requires_php` values with the running kirki-ecommerce, WordPress and PHP
versions. An empty or missing value SHALL mean no requirement. When a
requirement is not met, the update SHALL be blocked: the system SHALL NOT add
it to the WordPress update list, SHALL NOT install it, and SHALL report the
first requirement that is not met.

#### Scenario: Core too old

- **WHEN** an update has `requires_kirki_ecommerce` `1.1.0` and kirki-ecommerce is
  `1.0.0`
- **THEN** the update is blocked with the reason "This update needs Kirki eCommerce 1.1.0 or newer (you have 1.0.0). Update Kirki eCommerce first, then update this gateway."
  and it does not show in the WordPress update list

#### Scenario: All requirements met

- **WHEN** the running versions meet all three values
- **THEN** the update is offered

#### Scenario: No requirements given

- **WHEN** the catalog entry has no `requires_*` values
- **THEN** the update is offered

### Requirement: Updates show in the WordPress update screens

For each update that is offered, the system SHALL add an entry to the
WordPress plugin update data, with the plugin basename, slug, new version,
the catalog `download_url` as the package, and the `requires_wp` and
`requires_php` values. Thus the update SHALL show on the Plugins page and on
Dashboard > Updates, and WordPress auto-updates SHALL work for the gateway.
When a gateway has no update, the system SHALL list it as having no update, so
that WordPress shows the auto-update control for it.

#### Scenario: Update on the Plugins page

- **WHEN** an admin opens the Plugins page and an update to `1.0.1` is offered
  for `kirki-payfast`
- **THEN** the page shows the "new version available" notice with an
  "update now" link for that plugin

#### Scenario: Auto-update enabled

- **WHEN** auto-updates are on for the gateway plugin and WordPress runs its
  scheduled update
- **THEN** WordPress installs the catalog version through the package check

#### Scenario: Blocked update

- **WHEN** the update is blocked by a requirement
- **THEN** the Plugins page shows no update notice for that plugin

### Requirement: Gateway details popup

The system SHALL answer the WordPress plugin information request for a
catalog gateway slug with the name, version, requirements, description,
download link and changelog. The changelog SHALL come from the gateway's
`meta.json` on the catalog server. When `meta.json` cannot be loaded or has
no changelog, the popup SHALL still show the other values. Requests for slugs
that are not in the catalog SHALL be left to WordPress.

#### Scenario: View details

- **WHEN** an admin clicks "View version 1.0.1 details" for a gateway
- **THEN** the popup shows the gateway name, version 1.0.1, its requirements,
  its description and a Changelog section

#### Scenario: meta.json missing

- **WHEN** the gateway's `meta.json` request fails
- **THEN** the popup shows the values from the catalog and no changelog

#### Scenario: Other plugin

- **WHEN** WordPress requests information for a slug that is not in the
  catalog
- **THEN** the system does not change the response

### Requirement: Every gateway package download is verified

When WordPress downloads a package whose URL equals the `download_url` of a
catalog entry, the system SHALL download the file itself, compare its SHA-256
with the catalog `sha256`, and give the verified file to WordPress. On a
failed download or a hash mismatch the system SHALL delete the file and the
install or update SHALL fail with an error. This SHALL apply to the dialog,
the Plugins page, Dashboard > Updates and auto-updates. Downloads of other
packages SHALL be left to WordPress.

#### Scenario: Update from the Plugins page

- **WHEN** an admin clicks "update now" for a gateway and the downloaded zip
  matches the catalog `sha256`
- **THEN** WordPress installs that verified file

#### Scenario: Hash mismatch

- **WHEN** the downloaded zip hash differs from the catalog `sha256`
- **THEN** the file is deleted, WordPress shows an integrity error, and the
  installed gateway is not changed

#### Scenario: Other plugin update

- **WHEN** WordPress downloads a package that is not a catalog `download_url`
- **THEN** the system does not change the download

### Requirement: Update one gateway from Payments settings

`POST /online-payments/update` SHALL accept a gateway id and no URL. The
backend SHALL drop the cached catalog, read the entry again, and install the
catalog version over the installed plugin. The gateway SHALL stay active, its
saved settings SHALL stay, and the response SHALL return the provider with
the new version.

#### Scenario: Successful update

- **WHEN** an admin updates an installed gateway that has an offered update
- **THEN** the plugin has the catalog version, it is active, its settings are
  the same as before, and the response returns the provider

#### Scenario: Gateway not installed

- **WHEN** the id is not an installed online provider
- **THEN** the request fails with a not-found error and nothing is downloaded

#### Scenario: No update

- **WHEN** the installed version is equal to or greater than the catalog
  version
- **THEN** the request fails with a conflict error and nothing is downloaded

#### Scenario: Blocked update

- **WHEN** the update is blocked by a requirement
- **THEN** the request fails with the requirement reason and nothing is
  downloaded

#### Scenario: Client sends a URL

- **WHEN** a request includes a `download_url` field
- **THEN** the field is ignored and the catalog URL is used

### Requirement: Payments settings show gateway updates

The available-gateways dialog SHALL show an "Update Available" badge, in place
of the "Added" badge, for each installed gateway with an offered update, and a
small secondary "Update" button on the right of that row. Pressing it SHALL call
the update endpoint. During the request a spinner SHALL show in place of that
button, and the other "Add" and "Update" buttons SHALL be disabled until the
request ends. After success the row SHALL show only "Added", and the payment
lists SHALL refresh. On failure the system SHALL show the error message. For a
blocked update the dialog SHALL show the "Update Available" badge and, in place
of the button, an info icon whose tooltip shows the reason. Each installed
gateway row in the Payments list SHALL show an "Update available" badge when a
newer version exists, offered or blocked, and pressing the badge SHALL open the
dialog.

#### Scenario: Update button

- **WHEN** the dialog lists an installed gateway with an offered update
- **THEN** the row shows the "Update Available" badge and an "Update" button, and no "Added" badge

#### Scenario: Update succeeds

- **WHEN** the admin presses "Update" and the request succeeds
- **THEN** the button goes away, the row shows "Added", and the lists refresh

#### Scenario: Update fails

- **WHEN** the request fails
- **THEN** the error message shows and the "Update" button shows again

#### Scenario: Requirement not met

- **WHEN** the update is blocked by `requires_kirki_ecommerce`
- **THEN** the row shows "Update Available" and an info icon whose tooltip shows
  the reason, which names the required version and what to do, and no "Update" button

#### Scenario: Badge on the installed list

- **WHEN** an installed gateway has an offered update
- **THEN** its row in the Payments list shows "Update available", and pressing
  it opens the available-gateways dialog

#### Scenario: Badge for a blocked update on the installed list

- **WHEN** an installed gateway has a newer version, but a requirement blocks the update
- **THEN** its row in the Payments list still shows "Update available"

