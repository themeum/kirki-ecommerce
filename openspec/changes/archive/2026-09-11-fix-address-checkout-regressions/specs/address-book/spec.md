## MODIFIED Requirements

### Requirement: Customer can update an existing address
`PUT /account/addresses/{id}` SHALL update the address's `type`, `label`, contact/location fields, and optionally `is_default_shipping`/`is_default_billing`, when the id belongs to the authenticated customer, using the same field requirements as creation. `is_default_shipping` and `is_default_billing` are optional booleans; when the request omits one, that address's current value for it SHALL remain unchanged — updating an address's details (e.g. its city) without mentioning default status never has the side effect of unsetting it. When the request explicitly submits `is_default_shipping` and/or `is_default_billing` as `true`, that flag SHALL be set the same way `PATCH /account/addresses/{id}/set-default` sets it (unsetting the previous default of that purpose for the same customer).

#### Scenario: Updating address details does not change default status
- **WHEN** an authenticated customer updates an address that is currently their default billing address, changing only its city and not mentioning `is_default_billing`
- **THEN** the address's fields are updated
- **AND** it remains the default billing address

#### Scenario: Explicitly setting default status via update
- **WHEN** an authenticated customer updates an address they own, submitting `is_default_shipping` as `true`
- **THEN** that address becomes their default shipping address
- **AND** any other address that was previously their default shipping address no longer is

#### Scenario: Successful update
- **WHEN** an authenticated customer submits a valid update to an address they own
- **THEN** the address record is updated with the submitted fields

#### Scenario: Invalid update
- **WHEN** an authenticated customer submits an update to an address they own that is missing a required field or has an invalid `type`
- **THEN** the request is rejected with a validation error and the address is unchanged

### Requirement: Customer can delete an address
`DELETE /account/addresses/{id}` SHALL delete the address when the id belongs to the authenticated customer. When the deleted address was the default shipping and/or default billing address, the system SHALL promote one of the customer's remaining addresses (if any) to default for each purpose the deleted address held.

#### Scenario: Successful deletion
- **WHEN** an authenticated customer requests deletion of an address they own
- **THEN** the address record is deleted

#### Scenario: Deleting a default address promotes another
- **WHEN** an authenticated customer deletes an address that was their default billing address, and they have at least one other address remaining
- **THEN** the address is deleted
- **AND** one of their remaining addresses becomes the new default billing address

#### Scenario: Deleting the customer's only address leaves no default
- **WHEN** an authenticated customer deletes an address that was their default billing and/or shipping address, and it was their only address
- **THEN** the address is deleted
- **AND** no default exists for the purpose(s) it held, since none remain to promote
