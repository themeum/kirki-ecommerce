## ADDED Requirements

### Requirement: A payment-completed activity names the provider
The system SHALL record the payment provider's name on a payment-completed activity, taken from the order's provider snapshot at the time of payment, together with the provider id. The activity description SHALL show the provider name. For an activity that has no recorded name, the description SHALL show the provider id.

#### Scenario: Paid with a provider
- **WHEN** an order is marked as paid with a provider whose name is "Bank transfer"
- **THEN** the payment-completed activity description reads "Payment of <amount> completed via Bank transfer."

#### Scenario: Provider changed while marking paid
- **WHEN** an order placed with one provider is marked as paid with another provider
- **THEN** the payment-completed activity names the new provider, not the provider the order was placed with

#### Scenario: Provider renamed later
- **WHEN** a provider is renamed after an order was paid with it
- **THEN** the payment-completed activity of that order still shows the name recorded at the time of payment

#### Scenario: Older activity without a name
- **WHEN** a payment-completed activity was recorded with a provider id and no provider name
- **THEN** its description shows the provider id

#### Scenario: Paid with no provider known
- **WHEN** an order is marked as paid and has no payment provider
- **THEN** the payment-completed activity description does not mention a provider
