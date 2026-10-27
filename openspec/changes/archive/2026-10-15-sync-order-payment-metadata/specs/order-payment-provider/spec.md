## ADDED Requirements

### Requirement: The provider snapshot follows the provider used to mark an order paid
When an order is marked as paid with a payment provider that differs from the provider in the order's snapshot, the system SHALL replace the order's payment metadata with the snapshot of the new provider and set the order's payment provider to it, in the same update. The old provider's gateway data SHALL be removed.

#### Scenario: Paid with a different provider
- **WHEN** an order placed with an offline provider is marked as paid with another provider
- **THEN** the order's payment provider is the new provider
- **AND** the order details and the order list show the new provider's name, icon and offline flag

#### Scenario: Gateway data of the old provider is dropped
- **WHEN** an order that holds an online gateway's payment data is marked as paid with a different provider
- **THEN** the order keeps no gateway data of the old provider

#### Scenario: Paid with the same provider
- **WHEN** an order is marked as paid with the provider that is already in its snapshot
- **THEN** the order's payment metadata, including any gateway data, is unchanged

#### Scenario: Paid without a provider
- **WHEN** an order is marked as paid and no provider is given, as an online gateway webhook does
- **THEN** the order's payment provider and payment metadata are unchanged

#### Scenario: Manual order created without a provider
- **WHEN** a manual order that has no payment provider is marked as paid with a provider
- **THEN** the order stores that provider and a snapshot of it

### Requirement: Marking an order paid requires a registered provider
The system SHALL reject a mark-as-paid request whose payment provider id is not registered, and SHALL leave the order unchanged. A registered provider that is disabled SHALL still be accepted.

#### Scenario: Unknown provider id
- **WHEN** an order is marked as paid with a provider id that is not registered
- **THEN** the request fails with a validation error
- **AND** the order stays unpaid and its payment provider and metadata are unchanged

#### Scenario: Disabled provider
- **WHEN** an order is marked as paid with a registered provider that is disabled
- **THEN** the order is marked as paid with that provider
