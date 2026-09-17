## MODIFIED Requirements

### Requirement: A region can be enabled or disabled without losing its configuration

The merchant SHALL be able to toggle a tax region between enabled and disabled
from the region list, via that region's row action menu. The action SHALL name the
state it moves the region to, and SHALL take effect without the merchant having to
save the tax settings page separately. Disabling SHALL preserve the region's
configured rates and rules for when it is re-enabled.

#### Scenario: Disabling a region

- **WHEN** the merchant disables a region from its row action menu
- **THEN** the region stops applying at checkout and is shown as inactive, with
  its rates and rules retained

#### Scenario: Re-enabling a region

- **WHEN** the merchant re-enables a previously disabled region
- **THEN** its previously configured rates and rules apply again with no re-entry
