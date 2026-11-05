# order-selling-location-validation Specification

## Purpose

Keeps orders inside the store's selling locations. An order is accepted only when its shipping and billing countries are countries the store sells to, whether a shopper, an admin, or an edit supplies the address.

## Requirements

### Requirement: Shipping country must be a selling location

The system SHALL reject an order whose shipping country is not a selling location. The rejection SHALL be a validation error on the shipping country field, and no order SHALL be created or changed.

#### Scenario: Storefront checkout with an unsupported shipping country

- **WHEN** a shopper submits checkout with a shipping country that is not a selling location
- **THEN** the request is rejected with a validation error on the shipping country
- **AND** no order is created

#### Scenario: Saved address whose country was removed from selling locations

- **WHEN** a shopper checks out with a saved address whose country was a selling location when it was saved but is not one now
- **THEN** the request is rejected with a validation error on the shipping country

#### Scenario: Supported shipping country

- **WHEN** a shopper submits checkout with a shipping country that is a selling location
- **THEN** the shipping country passes validation

#### Scenario: Store sells to all countries

- **WHEN** the selling location setting is all countries
- **THEN** every country passes the shipping country check

### Requirement: Billing country must be a selling location

The system SHALL reject an order whose billing country is not a selling location, when billing is entered separately from shipping. The rejection SHALL be a validation error on the billing country field.

#### Scenario: Separate billing address with an unsupported country

- **WHEN** an order is submitted with a billing address that differs from shipping and its country is not a selling location
- **THEN** the request is rejected with a validation error on the billing country
- **AND** no order is created

#### Scenario: Billing is the same as shipping

- **WHEN** an order is submitted with billing the same as shipping and the shipping country is a selling location
- **THEN** the order passes the country checks

#### Scenario: Both countries are unsupported

- **WHEN** an order is submitted with unsupported shipping and billing countries
- **THEN** the request is rejected with a validation error on each of the two country fields

### Requirement: Admin manual orders follow the same rule

The system SHALL apply the shipping and billing country checks to orders an admin creates manually. An admin MUST NOT be able to bypass the selling locations.

#### Scenario: Manual order with an unsupported country

- **WHEN** an admin creates a manual order whose shipping country is not a selling location
- **THEN** the request is rejected with a validation error on the shipping country

### Requirement: Order edit always validates both countries

The system SHALL validate the shipping country and the billing country on every order edit, including an edit that leaves both countries as stored. An edit SHALL NOT be saved while either country is not a selling location.

#### Scenario: Edit that changes the country to an unsupported one

- **WHEN** an admin edits an order and sets the shipping country to a country that is not a selling location
- **THEN** the edit is rejected with a validation error on the shipping country
- **AND** the order is unchanged

#### Scenario: Unrelated edit on an order whose stored country is no longer supported

- **WHEN** an admin edits only the order's items or note, and the stored shipping country is no longer a selling location
- **THEN** the edit is rejected with a validation error on the shipping country
- **AND** the order is unchanged

#### Scenario: Edit that fixes an unsupported country

- **WHEN** an admin edits an order whose stored country is no longer a selling location and changes it to a selling location
- **THEN** the edit is accepted

### Requirement: Storefront checkout shows a country rejection as a toast

The storefront checkout SHALL show the selling-location error as a toast, so a shopper sees it even when no country field is on the page, such as when a saved address is selected. When both countries fail with the same message, one toast SHALL show.

#### Scenario: Saved address with an unsupported country

- **WHEN** a shopper places an order with a saved address whose country is not a selling location
- **THEN** a toast shows "We do not sell to this country."

#### Scenario: Both countries are unsupported

- **WHEN** the shipping and billing countries are both rejected
- **THEN** one toast shows
