# Spec Delta

## ADDED Requirements

### Requirement: A lost stock race is reported as a validation error
When a request fails because another request took the stock first, the system SHALL respond with HTTP 422 and the same insufficient-stock message as a request that fails the first stock check. The status MUST NOT depend on which check caught the shortage.

#### Scenario: Two checkouts compete for the last units
- **WHEN** two checkouts each ask for all the remaining units and both pass the first stock check
- **THEN** one checkout succeeds with 201 and the other returns 422 with an insufficient-stock message
- **AND** the available quantity is 0 and the committed quantity equals the winning order

#### Scenario: The losing checkout leaves no order behind
- **WHEN** a checkout returns 422 because of a lost stock race
- **THEN** no order, order item, or stock change from that request remains
