## MODIFIED Requirements

### Requirement: Selected currency becomes the base currency

Store setup SHALL make the selected currency the store's only base currency. The
currency SHALL be active and have an exchange rate of 1.

- If no stored currency has the selected code, one SHALL be created from the bundled
  currency definition.
- If one already exists, it SHALL be reused rather than duplicated.
- Any previously base currency SHALL stop being the base.
- If the selected currency already existed with a positive rate against the previous
  base, every other stored currency's rate SHALL be recalculated against the new base
  (previous rate divided by the selected currency's previous rate). If the selected
  currency is created during setup, the other rates SHALL stay unchanged.

#### Scenario: No currencies exist

- **WHEN** setup succeeds with currency "BDT" on a store with no currencies
- **THEN** a single Bangladeshi Taka currency exists, marked base and active, with exchange rate 1

#### Scenario: Currency already stored

- **WHEN** setup succeeds with currency "EUR" on a store that already has a non-base EUR currency and a base USD currency
- **THEN** EUR becomes the base currency, USD is no longer the base, and no second EUR row is created

#### Scenario: Stored currency rates are recalculated

- **WHEN** setup succeeds with currency "EUR" on a store where USD is the base at rate 1 and EUR has rate 0.5
- **THEN** EUR has rate 1 and USD has rate 2

#### Scenario: Selected currency is new

- **WHEN** setup succeeds with currency "BDT" on a store where USD is the base at rate 1 and BDT is not stored
- **THEN** BDT is created as the base with rate 1 and USD keeps rate 1
