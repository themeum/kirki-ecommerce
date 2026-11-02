## Purpose

The server side of onboarding: turning the merchant's wizard answers into a configured
store (settings, base currency, tax switches, storefront pages and baseline catalog
data), and loading optional sample data afterwards.

## ADDED Requirements

### Requirement: Store setup is restricted to store managers

Store setup and sample data loading SHALL only be available to authenticated users who
can manage the store, and SHALL require a valid request nonce.

#### Scenario: Unauthorized user

- **WHEN** a logged-in user without the store management capability submits store setup
- **THEN** the request is rejected and no data is written

### Requirement: Store setup input is validated

Store setup SHALL require a non-empty store name, a country code that exists in the
country reference data, and a currency code that exists in the bundled currency list.
The industry SHALL be optional and default to "other". Every address field (line 1,
line 2, city, state, postcode) SHALL be optional. When tax collection is not enabled,
tax pricing and Tax ID values SHALL be ignored.

#### Scenario: Missing store name

- **WHEN** store setup is submitted without a store name
- **THEN** the request fails with a validation error on the store name and nothing is written

#### Scenario: Unknown country or currency

- **WHEN** store setup is submitted with a country or currency code that is not recognised
- **THEN** the request fails with a validation error on that field and nothing is written

#### Scenario: Address omitted

- **WHEN** store setup is submitted with no address fields
- **THEN** setup succeeds and the store address holds only the country

#### Scenario: Tax values sent while tax is off

- **WHEN** store setup is submitted with tax collection off but a Tax ID and "included in price" set
- **THEN** no Tax ID is saved and tax-inclusive pricing is left off

### Requirement: Store identity and address are saved to general settings

Store setup SHALL save the store name, industry, and Tax ID to the general settings.
It SHALL also save the store address there, with its country set to the selected
country and its other fields set from the submitted address. General settings values
that the wizard does not collect SHALL be preserved.

#### Scenario: Name, industry, and address saved

- **WHEN** setup succeeds with store name "Acme", industry "food-and-drink", country "BD", and city "Dhaka"
- **THEN** general settings show store name "Acme", industry "food-and-drink", store address country "BD", and city "Dhaka"

#### Scenario: Other general settings preserved

- **WHEN** setup succeeds on a store whose general settings already hold a store email
- **THEN** the store email is unchanged

### Requirement: Tax ID is editable from General settings

The general settings SHALL hold an optional store Tax ID, and the General settings page
SHALL let the merchant view and change it.

#### Scenario: Tax ID entered during onboarding

- **WHEN** the merchant entered Tax ID "VAT-123" during onboarding with tax collection on
- **THEN** the General settings page shows "VAT-123" in its Tax ID field

#### Scenario: Tax ID cleared in settings

- **WHEN** the merchant clears the Tax ID on the General settings page and saves
- **THEN** the store has no Tax ID

### Requirement: Selected currency becomes the base currency

Store setup SHALL make the selected currency the store's only base currency. The
currency SHALL be active and have an exchange rate of 1.

- If no stored currency has the selected code, one SHALL be created from the bundled
  currency definition.
- If one already exists, it SHALL be reused rather than duplicated.
- Any previously base currency SHALL stop being the base.

#### Scenario: No currencies exist

- **WHEN** setup succeeds with currency "BDT" on a store with no currencies
- **THEN** a single Bangladeshi Taka currency exists, marked base and active, with exchange rate 1

#### Scenario: Currency already stored

- **WHEN** setup succeeds with currency "EUR" on a store that already has a non-base EUR currency and a base USD currency
- **THEN** EUR becomes the base currency, USD is no longer the base, and no second EUR row is created

### Requirement: Tax switches follow the merchant's answer

Store setup SHALL turn tax calculation on when the merchant chose to collect sales tax,
and off otherwise. When tax collection is on, prices SHALL be treated as
tax-inclusive only if the merchant chose "Tax included in price". When tax collection
is off, tax-inclusive pricing SHALL be off.

#### Scenario: Collect tax, added at checkout

- **WHEN** setup succeeds with tax collection on and "Tax added at checkout"
- **THEN** tax calculation is enabled and prices are not tax-inclusive

#### Scenario: Collect tax, included in price

- **WHEN** setup succeeds with tax collection on and "Tax included in price"
- **THEN** tax calculation is enabled and prices are tax-inclusive

#### Scenario: Not collecting tax

- **WHEN** setup succeeds with "No, not yet"
- **THEN** tax calculation is disabled

### Requirement: Storefront pages are created

Store setup SHALL ensure that published Shop, Cart, Checkout and Account pages exist
and are assigned in the advanced settings. Pages that are already assigned SHALL be
reused and published, not duplicated.

#### Scenario: Fresh store

- **WHEN** setup succeeds on a store with no storefront pages assigned
- **THEN** Shop, Cart, Checkout, and Account pages are created, published, and assigned in advanced settings

#### Scenario: Pages already assigned

- **WHEN** setup runs on a store whose Cart page is already assigned
- **THEN** that page is kept and published, and only the missing pages are created

### Requirement: Setup is safe to retry

Every part of store setup SHALL be safe to run again after a failure. A retried setup
SHALL NOT create duplicate currencies, pages, or baseline catalog data. Once onboarding
is complete, further store setup requests SHALL be rejected without changing any data.

#### Scenario: Retry after a partial failure

- **WHEN** a setup request fails after the currency was created and is then submitted again
- **THEN** setup completes with exactly one currency of that code and one set of storefront pages

#### Scenario: Setup after completion

- **WHEN** a store setup request is submitted on a store that has completed onboarding
- **THEN** the request is rejected and no settings, currencies, or pages change

### Requirement: Industry and location presets hook

After every other part of store setup has been applied, the system SHALL run its
industry- and location-based preset step with the chosen industry and country. It SHALL
then announce that the store was created through a public extension hook that receives
the submitted setup values. The preset step SHALL currently make no changes.

#### Scenario: Extension listens for store creation

- **WHEN** an add-on has subscribed to the store-created hook and setup succeeds
- **THEN** the add-on is notified once with the store name, industry, country, currency, and tax answers

#### Scenario: Setup fails before presets

- **WHEN** setup fails before the preset step is reached
- **THEN** the store-created hook is not fired

### Requirement: Sample data can be loaded after onboarding

The system SHALL expose a sample data loading action. It SHALL only be available once
onboarding is complete. Loading sample data SHALL add the bundled demo products to the
store, following the demo product rules of the onboarding seed data.

#### Scenario: Loading sample data on a new store

- **WHEN** an onboarded merchant requests sample data on a store with no products
- **THEN** the demo products are created, priced in the store's base currency

#### Scenario: Loading before onboarding

- **WHEN** sample data is requested on a store that has not completed onboarding
- **THEN** the request is rejected and nothing is created

#### Scenario: Store already has products

- **WHEN** sample data is requested on a store that already has products
- **THEN** no demo products are created and the request still succeeds
