## Purpose

Keeps each settings group's API response limited to that group's own data, so formatting done for one group never adds fields to another.

## ADDED Requirements

### Requirement: A settings response contains only its own group's data

The settings API SHALL return, for a given settings group, that group's values formatted for that group only. Formatting that belongs to one group (for example the email template logo and shortcodes) SHALL NOT be applied to, or add fields to, the response of another group.

#### Scenario: Currency settings response

- **WHEN** a client requests the currency settings
- **THEN** the response contains the currency settings fields
- **AND** it contains no email template fields such as `default_template` or `customer_emails`

#### Scenario: Email settings response

- **WHEN** a client requests the email settings
- **THEN** the response includes the resolved header logo and the order confirmation shortcodes

#### Scenario: Other groups unchanged

- **WHEN** a client requests the general, shipping, advanced or legal settings
- **THEN** each response is formatted exactly as before
