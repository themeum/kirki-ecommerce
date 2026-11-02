## ADDED Requirements

### Requirement: The provider snapshot survives gateway payment data

The system SHALL keep an order's payment provider snapshot (id, name, icon and
offline flag) intact when a gateway's payment data is later saved on the order.
The gateway's data SHALL be stored alongside the snapshot under its own key, not
in place of it.

#### Scenario: A gateway reports a completed payment

- **WHEN** a gateway webhook saves its payment data on an order that was placed
  with an online provider
- **THEN** the order still reports that provider's name, icon and offline flag
  in the order details and order list

#### Scenario: Gateway data is retained

- **WHEN** a gateway webhook saves its payment data on an order
- **THEN** that data is stored on the order under a gateway key

#### Scenario: A second gateway write

- **WHEN** a gateway saves payment data on an order twice
- **THEN** the provider snapshot is still present and the gateway key holds the
  latest data
