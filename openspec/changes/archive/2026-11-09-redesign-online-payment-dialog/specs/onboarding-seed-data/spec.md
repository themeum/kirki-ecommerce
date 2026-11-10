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

#### Scenario: Cash on Delivery is offered

- **WHEN** payment settings have not been configured
- **THEN** one disabled offline payment method "Cash on delivery" (id `cod`) is available, with the same instructions as its manual preset in the "Add a payment method" dialog, and no icon
- **AND** no other offline payment method is seeded

#### Scenario: A settings group is already configured

- **WHEN** a merchant has already saved one of these settings groups
- **THEN** that group is left exactly as the merchant configured it
