# order-list-filters Specification

## Purpose
Defines how a merchant narrows the order list by the order states they recognise, by
payment state, and by how the order is being delivered — bridging the gap between the merchant's
vocabulary and the fulfilment, payment and lifecycle state an order actually carries.
## Requirements
### Requirement: The order list offers status options in the merchant's vocabulary

The order list SHALL offer a status filter holding one value, whose options are the states a
merchant recognises, plus a default meaning no status filter. The offered options SHALL be: order
placed, order processing, order on hold, order shipped, order delivered, order returned, order
cancelled, payment failed, refund requested, refund in progress, refunded, and refund declined.

The order list SHALL NOT present the composite internal lifecycle states, which pair a fulfilment
state with a payment state and would offer the merchant several near-identical options for one
recognisable situation.

#### Scenario: The options presented

- **WHEN** a merchant opens the order status filter
- **THEN** the options are the merchant-facing states, each appearing once

#### Scenario: A situation with several internal states

- **WHEN** orders have been shipped but differ in whether they are paid
- **THEN** the merchant is offered a single order shipped option, not one per payment state

### Requirement: Each status option resolves to the condition that defines it

Selecting a status option SHALL narrow the list to the orders in that state, whichever underlying
value carries it. Options describing how far the order has progressed SHALL be resolved against the
order's fulfilment state; options describing money SHALL be resolved against its payment state; and
options that exist only as a lifecycle state SHALL be resolved against that lifecycle state.

An order SHALL be listed under a fulfilment-derived option regardless of whether it is paid.

#### Scenario: A fulfilment-derived option

- **WHEN** a merchant selects order shipped
- **THEN** the list holds every shipped order
- **AND** holds shipped orders that are paid and shipped orders that are unpaid alike

#### Scenario: A payment-derived option

- **WHEN** a merchant selects payment failed
- **THEN** the list holds only orders whose payment failed, at whatever stage of fulfilment

#### Scenario: A lifecycle-only option

- **WHEN** a merchant selects refund requested
- **THEN** the list holds only orders in the refund-requested lifecycle state

#### Scenario: No status selected

- **WHEN** no status is selected
- **THEN** status does not narrow the list

### Requirement: The order list filters by payment status

The order list SHALL offer a payment status filter holding one value, covering the payment states an
order can hold, plus a default meaning no filter. It SHALL be independent of the status filter and
SHALL combine with it.

#### Scenario: Filtering by payment status

- **WHEN** a merchant selects unpaid
- **THEN** the list holds only unpaid orders

#### Scenario: Combining status and payment status

- **WHEN** a merchant selects order shipped and unpaid
- **THEN** the list holds only orders that are both shipped and unpaid

### Requirement: The order list filters by delivery method

The order list SHALL offer a delivery method filter holding one value, plus a default meaning no
filter. Its options SHALL be the enabled shipping methods defined across the store's shipping zones,
presented by name and offered once each. An order SHALL be listed when it was placed with the
selected shipping method.

#### Scenario: Filtering by delivery method

- **WHEN** a merchant selects a delivery method
- **THEN** the list holds only orders placed with that method

#### Scenario: A disabled shipping method

- **WHEN** a shipping method is disabled in settings
- **THEN** it is not offered as a delivery method option

#### Scenario: Combining delivery method with status

- **WHEN** a merchant selects a delivery method and order delivered
- **THEN** the list holds only delivered orders placed with that method

#### Scenario: No delivery method selected

- **WHEN** no delivery method is selected
- **THEN** orders are listed whatever method they were placed with, including orders with none

### Requirement: Unrecognised order list filter values are rejected

The order list SHALL reject a status, payment status or delivery method it does not recognise with a
validation error naming the offending field, rather than accepting it and returning an empty list.

#### Scenario: An unrecognised status

- **WHEN** the order list is requested with a status outside the offered set
- **THEN** the request is rejected with a validation error

#### Scenario: A recognised status matching nothing

- **WHEN** the order list is requested with an offered status that no order currently satisfies
- **THEN** the request succeeds and returns an empty list

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
