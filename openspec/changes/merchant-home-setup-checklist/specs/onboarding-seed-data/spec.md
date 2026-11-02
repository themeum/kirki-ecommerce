## MODIFIED Requirements

### Requirement: Store settings have onboarding defaults

The seed SHALL establish default values for the general, product, payment, and
checkout settings, writing a settings group only when that group has not already
been configured.

#### Scenario: Selling location

- **WHEN** general settings have not been configured
- **THEN** the selling location is set to all countries

#### Scenario: Reviews are off by default

- **WHEN** product settings have not been configured
- **THEN** product reviews and star ratings on reviews are both disabled

#### Scenario: Guest checkout is off by default

- **WHEN** checkout settings have not been configured
- **THEN** guest checkout is disabled

#### Scenario: Offline payment methods are offered disabled

- **WHEN** payment settings have not been configured
- **THEN** two offline payment methods, "Cash on Delivery" and "Direct bank transfer", are available, each with descriptive instructions and no icon
- **AND** both are disabled, so the store has no enabled payment method until the merchant enables one

#### Scenario: A settings group is already configured

- **WHEN** a merchant has already saved one of these settings groups
- **THEN** that group is left exactly as the merchant configured it
