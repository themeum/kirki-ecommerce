## Purpose

Defines how the plugin reads the list of installable payment gateways from a
remote server and installs one safely, so that a change of the server base URL
is the only step needed to switch servers.

## ADDED Requirements

### Requirement: Catalog comes from one configurable base URL

The system SHALL read the installable gateway list from `{base}/payments`,
where `{base}` is defined in exactly one place in the code. The response SHALL
be cached for a short time. All other URLs used by the feature SHALL be
derived from the catalog response or from `{base}`.

#### Scenario: Listing installable gateways

- **WHEN** a client requests the installable online providers
- **THEN** the backend returns each remote gateway with `id`, `name`,
  `description`, `version`, `icon`, and `is_installed`

#### Scenario: Catalog is a static object

- **WHEN** the store requests `{base}/payments`
- **THEN** the response is a JSON object stored in the S3 bucket, with no
  server code between the store and the bucket

#### Scenario: Switching servers

- **WHEN** the base URL value changes
- **THEN** the list, logos, and downloads come from the new server with no
  other code change

#### Scenario: Remote server unreachable

- **WHEN** the catalog request fails and no cached list exists
- **THEN** the endpoint returns an error and the dialog shows an error state
  with a retry action

### Requirement: Install uses only a gateway id

`POST /online-payments/install` SHALL accept a gateway id and no URL. The
backend SHALL resolve the `download_url` from the catalog.

#### Scenario: Client sends a URL

- **WHEN** a request includes a `download_url` field
- **THEN** the field is ignored and the catalog URL is used

#### Scenario: Unknown id

- **WHEN** the id is not in the catalog
- **THEN** the request fails with a not-found error and nothing is installed

#### Scenario: Already installed

- **WHEN** the gateway is already installed
- **THEN** the request fails and nothing is downloaded

### Requirement: Downloads are restricted and verified

The system SHALL install a package only if its `download_url` starts with the
base URL and uses HTTPS (HTTP is allowed only for local development hosts). It
SHALL compare the SHA-256 of the downloaded zip with the catalog `sha256` and
SHALL NOT install on a mismatch.

#### Scenario: URL outside the base URL

- **WHEN** the catalog `download_url` is on a different host than the base URL
- **THEN** the install fails and nothing is installed

#### Scenario: Checksum mismatch

- **WHEN** the downloaded zip hash differs from `sha256`
- **THEN** the install fails, the file is deleted, and nothing is installed

### Requirement: Installed gateways are activated

After a verified download the system SHALL install the plugin and activate it
through the framework `Extension` API, and the new provider SHALL be
registered in the same request.

#### Scenario: Successful install

- **WHEN** a verified install finishes
- **THEN** the plugin is active, the provider is returned in the response, and
  the dialog shows "Added"

### Requirement: Dialog reflects catalog state

The dialog SHALL show a loading state, an error state with retry, and an empty
state, and SHALL show the remote logo for each gateway.

#### Scenario: Install in progress

- **WHEN** the user presses "Add"
- **THEN** that button is disabled until the request ends, and other rows stay
  usable
