## MODIFIED Requirements

### Requirement: Unavailable providers are listed as coming soon

The system SHALL report, for each installable online provider, whether it is
already registered (`is_installed`). The list SHALL contain the gateways the
remote catalog offers. The system SHALL NOT list a gateway that the catalog
does not offer, and the admin UI SHALL NOT show a "Coming Soon" indicator for
catalog entries.

#### Scenario: Listing installable providers

- **WHEN** a client requests the installable online providers
- **THEN** every catalog gateway is listed, each reporting `is_installed`

#### Scenario: An installed provider in the admin UI

- **WHEN** the available-providers dialog renders a provider whose
  `is_installed` is `true`
- **THEN** an "Added" indicator is shown in place of the add control

#### Scenario: A gateway not in the catalog

- **WHEN** a gateway plugin has not been built or uploaded
- **THEN** it is not listed
