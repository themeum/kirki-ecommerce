## MODIFIED Requirements

### Requirement: Request body fidelity

The request body sent to the server MUST be exactly the payload the form declared. No layer between the form and the network SHALL alter, add, or remove field values.

Where a value requires conversion for transport — a blank input becoming null, a selected media item becoming its numeric identifier, a date becoming a formatted string — that conversion MUST happen inside the form's payload declaration and MUST be visible in the declared payload type.

A numeric field that the merchant has left blank SHALL be sent as an explicit null. This applies to every numeric shape a form can hold — a whole-number count, a decimal quantity, and a monetary amount alike — and holds whether the field was never filled in or was filled in and then cleared. A blank numeric field MUST NOT be sent as an empty string, MUST NOT be omitted from the request body, and MUST NOT be substituted with zero or any other stand-in value, so that "the merchant set no value" and "the merchant set zero" remain distinguishable to the server.

A numeric value the merchant did supply SHALL be sent unchanged. The conversion applies only to the blank case; it MUST NOT re-round, re-scale, or otherwise reinterpret a supplied amount.

#### Scenario: Blank optional text field

- **WHEN** the merchant leaves an optional text field empty and saves
- **THEN** the request body contains an explicit null for that field rather than an empty string

#### Scenario: Cleared monetary field

- **WHEN** the merchant clears a price, sale price, cost, unit amount or weight and saves
- **THEN** the request body contains an explicit null for that field rather than an empty string

#### Scenario: Cleared whole-number field

- **WHEN** the merchant clears a count or limit field and saves
- **THEN** the request body contains an explicit null for that field rather than omitting the field

#### Scenario: Supplied monetary amount

- **WHEN** the merchant enters a monetary amount and saves
- **THEN** the request body carries that amount unchanged

#### Scenario: Zero is not treated as blank

- **WHEN** the merchant enters zero in a numeric field and saves
- **THEN** the request body contains zero rather than null

#### Scenario: Selected image

- **WHEN** the merchant selects an image in a form and saves
- **THEN** the request body contains the image's numeric identifier rather than the selected media object

#### Scenario: Selected video with a poster

- **WHEN** the merchant selects a video that carries a poster image and saves
- **THEN** the request body preserves both the video identifier and its poster identifier

#### Scenario: Unconverted value reaches the network layer

- **WHEN** a request is issued whose body still contains a date object, a media object, or an empty string
- **THEN** a development-build warning identifying the offending field is reported
- **AND** the value is transmitted unchanged, in development and production alike

### Requirement: Payload regression coverage

Every form SHALL have an automated test asserting the exact request body produced from representative form values, so that a change to a payload declaration cannot silently alter what the server receives.

A form that holds any numeric field SHALL additionally have coverage for the blank case, asserting the request body produced when those fields are left empty, so that a regression in blank-to-null conversion fails a test rather than reaching the server.

#### Scenario: Payload declaration changes

- **WHEN** a form's payload declaration is modified so a field's value or presence changes
- **THEN** that form's payload test fails

#### Scenario: Blank-to-null conversion regresses

- **WHEN** a numeric field stops converting a blank input to null
- **THEN** that form's payload test fails
