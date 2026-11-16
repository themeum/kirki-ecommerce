# currency-lookup-caching Specification

## Purpose

Keeps money and currency work cheap and consistent inside one request. The store reads its currency data a bounded number of times, and a change to the currencies is visible at once to the rest of the same request.

## Requirements

### Requirement: Currency data is read at most once per request
The store SHALL read the stored currencies from the database at most once in a request, however many money conversions, formats or currency lookups the request makes. The read SHALL happen on the first need, not at start-up.

#### Scenario: Many minor-unit conversions
- **WHEN** a request converts 50 amounts to or from minor units with the base currency
- **THEN** the store runs at most one query on the currencies table

#### Scenario: Many display-currency conversions
- **WHEN** a request converts 20 amounts to the same display currency
- **THEN** the store runs at most one query on the currencies table, including the lookup of the exchange rate and the check that the display currency is active

#### Scenario: Request that uses no money
- **WHEN** a request does not convert, format or look up any currency
- **THEN** the store runs no query on the currencies table because of money code

### Requirement: Money helpers do not create a manager per call
Static money helpers that convert or build amounts SHALL reuse the single shared money manager of the request. A helper call SHALL NOT create a new manager and SHALL NOT query the database only to find the base currency when the caller gives a currency.

#### Scenario: Helper called with an explicit currency
- **WHEN** code converts an amount to minor units and names the currency
- **THEN** the call returns the converted value without a currency query that is not already cached

#### Scenario: Helper called without a currency
- **WHEN** code converts an amount to minor units and names no currency
- **THEN** the call uses the base currency from the cached currency data

### Requirement: Currency changes are visible in the same request
After any create, update, delete, bulk delete, base change or seed of currencies, the store SHALL serve the new data to every later money or currency read in the same request. It SHALL NOT return a base currency, symbol, exchange rate or active state from before the change.

#### Scenario: Base currency changes in the request
- **WHEN** a request reads the base currency, then makes another currency the base, then reads the base currency again
- **THEN** the second read returns the new base currency

#### Scenario: Exchange rate changes in the request
- **WHEN** a request converts an amount to a display currency, then updates that currency's rate, then converts again
- **THEN** the second conversion uses the new rate

#### Scenario: Currency deleted in the request
- **WHEN** a request deletes a currency and then looks it up by code
- **THEN** the lookup finds no currency

#### Scenario: Currencies seeded after a read
- **WHEN** the currency seeder runs after the request already read the currencies
- **THEN** later reads in the same request include the seeded currencies

### Requirement: Cached lookups do not change money output
Caching SHALL NOT change any amount, formatted string, symbol, exchange rate conversion or error that the store returns. A lookup of an unknown or inactive currency SHALL give the same result as before.

#### Scenario: Same output as before
- **WHEN** an amount is converted, formatted, or built as a money object
- **THEN** the raw value, display string and currency code equal what the store returned before this change

#### Scenario: Unknown currency requested by cookie
- **WHEN** a visitor requests a display currency that is not stored
- **THEN** the store shows amounts in the base currency

#### Scenario: Inactive currency requested by cookie
- **WHEN** a visitor requests a display currency that is stored but inactive
- **THEN** the store shows amounts in the base currency

#### Scenario: Conversion to a currency that is not stored
- **WHEN** code converts an amount to a currency code that is not stored and gives no exchange rate
- **THEN** the store fails with the same "currency not found" error as before
