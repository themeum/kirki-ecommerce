## MODIFIED Requirements

### Requirement: Shipping and billing addresses are created for the new customer
When a `Customer` record is auto-provisioned during checkout, the system SHALL also create two `Address` records of type `home` for that customer: one populated from the request's shipping fields with `is_default_shipping` set to true, and one populated from the request's billing fields with `is_default_billing` set to true. The request's submitted billing fields are used as-is — if the shopper chose "same as shipping" at checkout, the request is expected to already carry the shipping values in its billing fields; the system does not branch on or persist any such flag itself.

#### Scenario: Addresses created from checkout payload
- **WHEN** a new `Customer` record is provisioned during checkout
- **THEN** a `home` `Address` record with `is_default_shipping` true is created for that customer from the request's shipping fields
- **AND** a `home` `Address` record with `is_default_billing` true is created for that customer from the request's billing fields, whatever values the request submitted for them

#### Scenario: Existing customer's addresses are kept in sync via default flags, not type
- **WHEN** checkout resolves to an existing `Customer` record and updates or creates their shipping and/or billing address
- **THEN** the shipping address written or updated is the one with `is_default_shipping` true for that customer
- **AND** the billing address written or updated is the one with `is_default_billing` true for that customer
