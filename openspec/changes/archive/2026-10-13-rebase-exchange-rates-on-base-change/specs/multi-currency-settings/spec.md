## ADDED Requirements

### Requirement: Changing the base currency recalculates exchange rates

Every stored exchange rate SHALL mean "units of this currency per 1 unit of the base
currency". When a currency that is not the base becomes the base, the store SHALL, in
one atomic operation:

- set the new base currency's exchange rate to 1;
- set every other stored currency's exchange rate to its previous rate divided by the
  previous rate of the new base, rounded to 6 decimal places.

This SHALL apply whatever way the base changes: a currency update, or a currency
created as the base while another base exists. When the new base had no stored rate
against the previous base, or that rate was not a positive number, the other rates
SHALL stay unchanged and only the new base's rate SHALL be set to 1.

#### Scenario: Setting a non-base currency as the base

- **WHEN** USD is the base at rate 1, EUR has rate 0.5 and GBP has rate 0.25, and the
  administrator sets EUR as the base
- **THEN** EUR has rate 1 and is the only base
- **AND** USD has rate 2
- **AND** GBP has rate 0.5

#### Scenario: Rates sent in the same request after the base changes

- **WHEN** a single `PUT /currencies` request first makes a currency the base and then
  sends a later item for another currency with an explicit rate
- **THEN** the later item's rate is stored as sent, because items are applied in
  request order

#### Scenario: Creating a currency as the base

- **WHEN** USD is the base at rate 1 and EUR has rate 0.5, and a `POST /currencies`
  request creates GBP as the base with rate 0.25
- **THEN** GBP has rate 1 and is the only base
- **AND** USD has rate 4
- **AND** EUR has rate 2

#### Scenario: Creating the first currency as the base

- **WHEN** the store has no base currency and a currency is created as the base with
  any positive rate
- **THEN** that currency has rate 1

#### Scenario: Recalculation fails

- **WHEN** the base change fails part of the way through
- **THEN** no currency's base flag or exchange rate is changed

### Requirement: The base currency rate is always 1

The base currency's stored exchange rate SHALL be 1. A request that updates the
current base with a different rate SHALL still store 1 for it.

#### Scenario: Updating the base with another rate

- **WHEN** a `PUT /currencies` request updates the current base currency with rate 3
- **THEN** the response and the stored currency show rate 1
- **AND** the other currencies' rates do not change

## MODIFIED Requirements

### Requirement: Row actions live in a three-dot menu behind confirmation

Each non-base currency row SHALL offer a three-dot (overflow) menu containing exactly
"Set as default" and "Delete". Selecting either SHALL open a confirmation dialog, and
the action SHALL run only when the administrator confirms. The base currency row SHALL
show no overflow menu. Deleting a currency SHALL NOT be blocked by products that exist
in the store, including products created while that currency was the base.

#### Scenario: Setting the base currency

- **WHEN** the administrator chooses "Set as default" on a non-base currency and
  confirms the dialog
- **THEN** that currency becomes the base currency and the previous base is demoted
- **AND** the list shows the new base at rate 1 and every other currency at its
  recalculated rate
- **AND** the update request contains only the row of the new base currency
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency

- **WHEN** the administrator chooses "Delete" on a non-base currency and confirms the
  dialog
- **THEN** the currency is removed and the list refreshes
- **AND** dismissing the dialog makes no change

#### Scenario: Deleting a currency that was previously the base

- **WHEN** the administrator switches the store's base currency, and then chooses
  "Delete" on the currency that was previously the base and confirms the dialog
- **THEN** that currency is removed even though products were created while it was the
  base
- **AND** those products keep their stored amounts, which are read in the store's
  current base currency
