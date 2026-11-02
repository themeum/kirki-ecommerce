## ADDED Requirements

### Requirement: Defaults endpoint
The system SHALL provide an admin-only endpoint that returns onboarding defaults read from WooCommerce. It SHALL return an empty result when WooCommerce is not installed or its version is not supported.

#### Scenario: Supported WooCommerce
- **WHEN** WooCommerce is installed and supported
- **THEN** the endpoint returns store name, industry, country, address lines, city, postal code, currency, tax collected and prices include tax

#### Scenario: No WooCommerce or old version
- **WHEN** WooCommerce is missing or below the minimum version
- **THEN** the endpoint returns no defaults and the wizard behaves as before

### Requirement: Prefill of wizard fields
The wizard SHALL set each field from the defaults when the field has a value, and SHALL keep today's behavior for each field without a value. The state of the address SHALL NOT be prefilled.

#### Scenario: Country from WooCommerce
- **WHEN** WooCommerce has a default country
- **THEN** the Country field shows it and browser detection is not used

#### Scenario: No WooCommerce country
- **WHEN** WooCommerce has no country
- **THEN** the Country field uses the browser country

#### Scenario: Industry without match
- **WHEN** the WooCommerce industry has no match in the Kirki list
- **THEN** the Industry field stays empty

#### Scenario: Tax answers
- **WHEN** WooCommerce has tax calculation on
- **THEN** "Collect sales tax" is Yes, and the Tax step shows "Including tax" or "Excluding Tax" as WooCommerce has it

### Requirement: Draft wins over prefill
A saved session draft SHALL take precedence over prefilled values.

#### Scenario: Reload mid-wizard
- **WHEN** the merchant edited a prefilled field and reloads the page
- **THEN** the edited value shows, not the WooCommerce value
