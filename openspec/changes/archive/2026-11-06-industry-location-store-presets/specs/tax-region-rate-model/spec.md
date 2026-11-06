## ADDED Requirements

### Requirement: A micro-business EU region charges the rate of its one country

An EU region of type micro-business SHALL hold exactly one country: the member
country whose VAT the business charges. When the EU region's type is
micro-business, the system SHALL apply the VAT rate of that one country to
every shopper whose address is in an EU member country. When the type is OSS,
the rate configured for the shopper's member country SHALL apply. When a
micro-business region has no country, product tax SHALL be zero. Region-level
rules SHALL apply in both types.

#### Scenario: Micro-business, shopper in another member country

- **WHEN** the EU region type is micro-business, its one country is "DE" with a rate of 19, and a shopper's address is in "FR"
- **THEN** the shopper's items are taxed at 19

#### Scenario: Micro-business country differs from the store address

- **WHEN** the store's address country is "AT", the EU region type is micro-business, and its one country is "DE" with a rate of 19
- **THEN** an EU shopper's items are taxed at 19

#### Scenario: OSS, shopper in another member country

- **WHEN** the store's country is "DE", the EU region type is OSS, and a shopper's address is in "FR" with a configured rate of 20
- **THEN** the shopper's items are taxed at 20

#### Scenario: Micro-business region without a country

- **WHEN** the EU region type is micro-business and the region has no country
- **THEN** product tax for an EU shopper is zero
