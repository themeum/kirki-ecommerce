## MODIFIED Requirements

### Requirement: Shipping and billing addresses are created for the new customer
When a `Customer` record is auto-provisioned during checkout, the system SHALL also create `Address` record(s) of type `home` for that customer from the request's shipping and billing fields. When the checkout request indicates billing is the same as shipping, a single `Address` record is created from the shipping fields with both `is_default_shipping` and `is_default_billing` set to true. Otherwise, two `Address` records are created: one from the shipping fields with `is_default_shipping` true, and one from the billing fields with `is_default_billing` true.

#### Scenario: Addresses created from checkout payload with different shipping and billing
- **WHEN** a new `Customer` record is provisioned during checkout and the request's shipping and billing fields differ
- **THEN** a `home` `Address` record with `is_default_shipping` true is created for that customer from the request's shipping fields
- **AND** a separate `home` `Address` record with `is_default_billing` true is created for that customer from the request's billing fields

#### Scenario: Addresses created from checkout payload with billing same as shipping
- **WHEN** a new `Customer` record is provisioned during checkout and the checkout request indicates billing is the same as shipping
- **THEN** a single `home` `Address` record is created for that customer from the shipping fields
- **AND** that address has both `is_default_shipping` and `is_default_billing` set to true

#### Scenario: Existing customer's addresses are kept in sync via default flags, not type
- **WHEN** checkout resolves to an existing `Customer` record and updates or creates their shipping and/or billing address
- **THEN** the shipping address written or updated is the one with `is_default_shipping` true for that customer
- **AND** the billing address written or updated is the one with `is_default_billing` true for that customer
