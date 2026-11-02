# Spec Delta

## ADDED Requirements

### Requirement: A country's tax logic decides and reports the address its tax is based on

The tax logic resolved for a cart SHALL report which address it used: shipping, billing or store. A country that bases tax on a different address SHALL report it without any change to the tax logic of another country. A country that does not choose SHALL report the address it received.

#### Scenario: A country without its own rule

- **WHEN** the resolved tax logic does not choose an address
- **THEN** the result reports the address the calculation gave it

#### Scenario: A country that taxes by billing address

- **WHEN** the resolved tax logic taxes by the billing address
- **THEN** the result reports `billing`, and no other country's reported address changes

### Requirement: The tax destination setting names the address tax is calculated from

The calculation SHALL receive the shipping, billing and store addresses. It SHALL use the address named by the tax destination setting (`shipping`, `billing` or `store`). A missing or unknown setting SHALL mean `shipping`. When the named address has no country, the calculation SHALL use the store address and report `store`.

#### Scenario: Default setting

- **WHEN** the tax destination setting is not set and the cart has a shipping address with a country
- **THEN** the tax logic is resolved from the shipping address and the result reports `shipping`

#### Scenario: Billing setting

- **WHEN** the tax destination setting is `billing` and the cart has a billing address with a country
- **THEN** the tax logic is resolved from the billing address and the result reports `billing`

#### Scenario: Store setting

- **WHEN** the tax destination setting is `store` and the store address has a country
- **THEN** the tax logic is resolved from the store address and the result reports `store`

#### Scenario: Named address has no country

- **WHEN** the named address has no country and the store address has a country
- **THEN** the tax logic is resolved from the store address and the result reports `store`

#### Scenario: No usable address

- **WHEN** neither the named address nor the store address has a country
- **THEN** no tax is calculated and no destination is reported

### Requirement: A fixed-rate regime reports the store as the tax destination

When a region taxes every sale at one fixed rate of the seller's own country, the shopper's address does not set the tax. The result SHALL report `store` for such a region.

#### Scenario: EU micro business

- **WHEN** the EU region is set up as a micro business with one fixed country rate
- **THEN** the result reports `store`, whatever address the cart has

#### Scenario: EU one-stop-shop

- **WHEN** the EU region uses the shopper's member country rate
- **THEN** the result reports the address the calculation gave it
