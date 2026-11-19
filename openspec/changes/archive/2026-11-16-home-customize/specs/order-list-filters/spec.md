## ADDED Requirements

### Requirement: The order list filters by attention

The order list SHALL accept an attention filter with the values "to ship" and
"to collect", plus a default meaning no attention filter. "To ship" SHALL hold
exactly the orders that the Home "Orders to ship" check counts, and "To
collect" SHALL hold exactly the orders that the Home "Payments to collect"
check counts. The attention filter SHALL combine with the other filters. The
filter SHALL be set from the address, SHALL show as a removable chip ("To ship"
or "To collect") on the order list, and SHALL NOT be offered as a filter
control. Removing the chip SHALL remove the filter from the list and the
address. An unrecognised attention value SHALL be rejected with a validation
error, as for the other filters.

#### Scenario: Open from Home

- **WHEN** Home shows Orders to ship 3 and the merchant selects that row
- **THEN** the order list shows those 3 orders and a "To ship" chip

#### Scenario: Remove the chip

- **WHEN** the merchant removes the "To ship" chip
- **THEN** the list shows all orders and the address has no attention filter

#### Scenario: Combine with search

- **WHEN** the attention filter is "to collect" and the merchant searches for a customer name
- **THEN** the list holds only orders to collect from that customer

#### Scenario: Unknown value

- **WHEN** the order list is requested with attention "late"
- **THEN** the request is rejected with a validation error on attention
