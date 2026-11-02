## ADDED Requirements

### Requirement: Short money display

Every money object in an Analytics metric response SHALL have a
`short_display` string next to `display`. `short_display` SHALL use the store's
currency symbol, symbol position, decimal separator and thousand separator, as
`display` does. When the absolute amount is less than 1,000, `short_display`
SHALL be the same as `display`. From 1,000, `short_display` SHALL divide the
amount by the largest unit that is not more than the absolute amount (1,000 is
`K`, 1,000,000 is `M`, 1,000,000,000 is `B`, 1,000,000,000,000 is `T`), round
it to one decimal, remove a decimal that is 0, and add the unit letter. When the
rounding gives 1,000 of a unit and a larger unit exists, it SHALL use the larger
unit. The unit letters SHALL be the same in every language. A negative amount
SHALL keep its sign in the same place as in `display`. Money objects of other
APIs SHALL NOT change.

#### Scenario: Thousands

- **WHEN** a money amount is 20,345.00 USD and the symbol is before the amount
- **THEN** `display` is `$20,345.00` and `short_display` is `$20.3K`

#### Scenario: Decimal that is 0

- **WHEN** a money amount is 20,000.00 USD
- **THEN** `short_display` is `$20K`

#### Scenario: Less than 1,000

- **WHEN** a money amount is 850.00 USD
- **THEN** `short_display` is `$850.00`

#### Scenario: Rounding moves to the next unit

- **WHEN** a money amount is 999,950.00 USD
- **THEN** `short_display` is `$1M`

#### Scenario: Larger units

- **WHEN** the money amounts are 1,234,567.00, 3,000,000,000.00 and 1,000,000,000,000.00 USD
- **THEN** their `short_display` values are `$1.2M`, `$3B` and `$1T`

#### Scenario: Store separators and position

- **WHEN** the store uses `,` as the decimal separator, puts the symbol after the amount, and an amount is 20,345.00 EUR
- **THEN** `short_display` is `20,3K€`

#### Scenario: Other APIs

- **WHEN** another API, such as the dashboard overview, returns a money object
- **THEN** that money object has no `short_display`

### Requirement: Amount example in meta

The `meta` of every Analytics metric response SHALL contain `amount_example`, a
money object of 20,345 in the base currency, with `display` and
`short_display`.

#### Scenario: Example in USD

- **WHEN** the base currency is USD and the client calls any metric key
- **THEN** `meta.amount_example.display` is `$20,345.00` and `meta.amount_example.short_display` is `$20.3K`
