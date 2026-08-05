# form-schema-contract Specification

## Purpose

Defines how every form in the admin app declares its data: the values a merchant edits, the request body derived from those values, and the guarantee that the derived body is exactly what reaches the server.

## Requirements

### Requirement: Declared request payload

Every form SHALL declare its request body as an explicit transformation of its form values, naming each payload field individually. A form MUST NOT construct its request body by spreading its form values, so that adding a field to a form never silently adds a field to the request.

The request payload type SHALL be derived from the form declaration rather than written separately, so a payload field cannot drift from the form that produces it.

#### Scenario: UI-only field does not leak into the request

- **WHEN** a field is added to a form for presentation purposes and is not named in the payload declaration
- **THEN** the request body sent on submit does not contain that field

#### Scenario: Payload and form declaration drift apart

- **WHEN** a payload field is renamed or removed without updating the form that produces it
- **THEN** the project typecheck fails

### Requirement: Request body fidelity

The request body sent to the server MUST be exactly the payload the form declared. No layer between the form and the network SHALL alter, add, or remove field values.

Where a value requires conversion for transport — a blank input becoming null, a selected media item becoming its numeric identifier, a date becoming a formatted string — that conversion MUST happen inside the form's payload declaration and MUST be visible in the declared payload type.

#### Scenario: Blank optional text field

- **WHEN** the merchant leaves an optional text field empty and saves
- **THEN** the request body contains an explicit null for that field rather than an empty string

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

### Requirement: Required field validation

A field declared required SHALL be rejected when its value is null, undefined, a whitespace-only string, an empty array, or an object with no keys — regardless of the field's data type. Required-ness MUST be expressible for any field type, not only text fields.

A field that passes required validation SHALL be non-nullable in the declared payload type.

#### Scenario: Whitespace-only text

- **WHEN** the merchant submits a required text field containing only spaces
- **THEN** validation fails and the field displays its required message

#### Scenario: Required non-text field

- **WHEN** the merchant submits a required selection or list field with nothing chosen
- **THEN** validation fails and the field displays its required message

#### Scenario: Required field consumed as nullable

- **WHEN** code reads a required field from the request payload and handles it as possibly null
- **THEN** the project typecheck reports the null check as unnecessary

### Requirement: Conditional validation

A field that is required only when other fields hold particular values SHALL be validated against that condition, and the resulting error MUST be reported at that field's own path so the correct input is highlighted — including when the field is nested inside an object or list.

A conditional rule declared on one form MUST NOT affect validation of any other form, including forms that reuse the same shared field definition.

#### Scenario: Conditional rule on a nested field

- **WHEN** a field nested inside an address or list entry is required by a condition and left empty
- **THEN** validation fails and the error is displayed on that nested input rather than at the form root

#### Scenario: Shared field definition reused across forms

- **WHEN** two forms reuse the same shared field definition and only one declares a conditional rule on it
- **THEN** submitting the other form does not trigger that rule

### Requirement: Form hydration from stored records

Opening an existing record for editing SHALL populate the form from that record. Fields absent from the record MUST fall back to the form's declared default values rather than being left undefined.

Hydration MUST be driven generically from the form declaration wherever the mapping is mechanical; a bespoke mapping is permitted only where a value cannot be derived from the record by field name alone.

#### Scenario: Record missing an optional field

- **WHEN** the merchant opens a record that has no value stored for an optional field
- **THEN** the form displays that field's declared default value

#### Scenario: Form field added without touching hydration

- **WHEN** a field with a declared default is added to a form and no hydration code is changed
- **THEN** opening an existing record populates that field with its default

### Requirement: Editing values and submitted values are distinctly typed

The values a form holds while being edited and the payload produced on submit SHALL be separate types. Components reading form state MUST see the editing type; a submit handler MUST receive the payload type.

#### Scenario: Submit handler receives the payload

- **WHEN** a form is submitted and passes validation
- **THEN** the submit handler receives the transformed payload, not the raw editing values

#### Scenario: Component reads form state

- **WHEN** a child component reads a field from form context
- **THEN** it sees the editing value, including any pre-transform representation such as a selected media object

### Requirement: Payload regression coverage

Every form SHALL have an automated test asserting the exact request body produced from representative form values, so that a change to a payload declaration cannot silently alter what the server receives.

#### Scenario: Payload declaration changes

- **WHEN** a form's payload declaration is modified so a field's value or presence changes
- **THEN** that form's payload test fails
