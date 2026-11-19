# Spec Delta

## MODIFIED Requirements

### Requirement: The admin order payload exposes both invoiced and base-currency amounts

The admin order payload SHALL expose, for every monetary figure, both the
order's own invoiced-currency amount and the base-currency amount in the
base currency the order was placed in, each as a money object. It SHALL NOT
expose a bare scalar amount key alongside a money object for the same figure.

#### Scenario: Order placed in a non-base currency

- **WHEN** a merchant views the details of an order placed in a currency
  other than the store's base currency
- **THEN** every monetary figure in the payload carries both its invoiced
  money object and its base-currency money object

#### Scenario: A monetary figure never exposes a bare scalar

- **WHEN** any monetary figure is rendered in the payload
- **THEN** it appears only as a money object, with no separate bare numeric
  key duplicating that same amount
