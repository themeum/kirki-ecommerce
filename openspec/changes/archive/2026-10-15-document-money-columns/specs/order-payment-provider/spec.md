# Spec Delta

## MODIFIED Requirements

### Requirement: Base-currency payment provider fee is derived and stored
When a payment provider fee is recorded on an order in the order's transaction currency, the system SHALL also derive and store the equivalent fee in the store's base currency, using the exchange rate captured on that order at creation time. The conversion SHALL divide the fee by that stored rate exactly and round half-up to the base currency's minor unit, so the result does not depend on floating-point approximation of the reciprocal rate.

#### Scenario: Gateway reports a transaction fee
- **WHEN** a payment gateway reports its fee for an order's transaction
- **THEN** the order stores the fee in the transaction currency and the equivalent fee in the store's base currency, computed using that order's own stored exchange rate

#### Scenario: Fee at an exact half-unit boundary
- **WHEN** an order has a stored exchange rate of `2.896` and the gateway reports a fee of `256115` minor units
- **THEN** the stored base-currency fee is `88438`

#### Scenario: Fee reported in a currency other than the order's invoiced currency
- **WHEN** a payment gateway reports a fee alongside a currency that does not match the order's invoiced currency
- **THEN** the system does not store that fee as the order's payment provider fee
