## ADDED Requirements

### Requirement: Floating customize sheet

The "Customize analytics" sheet SHALL turn on the floating option of the Sheet,
so the merchant can drag it away from the right edge and dock it again. Its
floating state and position SHALL be remembered separately from the "Customize
home" sheet.

#### Scenario: Float the Analytics sheet

- **WHEN** the merchant drags the header of the "Customize analytics" sheet
- **THEN** the panel floats and the merchant can still see and scroll the Analytics page

#### Scenario: Separate memory

- **WHEN** the Analytics sheet was left floating and the merchant opens the Customize home sheet for the first time
- **THEN** the Customize home sheet opens docked at the right
