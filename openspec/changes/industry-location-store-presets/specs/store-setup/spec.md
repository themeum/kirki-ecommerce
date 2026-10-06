## MODIFIED Requirements

### Requirement: Industry and location presets hook

After every other part of store setup has been applied, the system SHALL apply
the industry and location presets, as the store-presets capability defines. It
SHALL then record in the Home setup checklist which steps the presets
preconfigured, and SHALL announce that the store was created through a public
extension hook that receives the submitted setup values.

#### Scenario: Extension listens for store creation

- **WHEN** an add-on has subscribed to the store-created hook and setup succeeds
- **THEN** the add-on is notified once with the store name, industry, country, currency, and tax answers

#### Scenario: Setup fails before presets

- **WHEN** setup fails before the preset step is reached
- **THEN** the store-created hook is not fired

#### Scenario: Setup writes the presets

- **WHEN** store setup succeeds with industry "fashion-and-apparel" and country "GB"
- **THEN** the store has the preset categories, shipping zones, profiles, attributes, schema profile, legal pages and consents for that industry and country when the setup response is sent

#### Scenario: Preset tax and shipping are marked preconfigured

- **WHEN** store setup created an enabled tax region with a product rate and an enabled zone with an enabled method from the presets
- **THEN** the Home setup checklist shows the tax and shipping steps as preconfigured, waiting for the merchant to confirm them

### Requirement: Sample data can be loaded after onboarding

The system SHALL expose a sample data loading action. It SHALL only be available once
onboarding is complete. Loading sample data SHALL add the bundled demo products to the
store, following the demo product rules of the onboarding seed data. When it creates
the demo products, it SHALL also create one code coupon with code "WELCOME50" that
takes 50% off the order, applies to all products and every customer, and has no end
date. The coupon SHALL be created inactive. The store presets SHALL NOT create a
coupon.

#### Scenario: Loading sample data on a new store

- **WHEN** an onboarded merchant requests sample data on a store with no products
- **THEN** the demo products are created, priced in the store's base currency
- **AND** a coupon with code "WELCOME50" exists, gives 50% off the order, and has the status inactive

#### Scenario: Loading before onboarding

- **WHEN** sample data is requested on a store that has not completed onboarding
- **THEN** the request is rejected and nothing is created

#### Scenario: Store already has products

- **WHEN** sample data is requested on a store that already has products
- **THEN** no demo products and no coupon are created, and the request still succeeds

#### Scenario: Coupon code already used

- **WHEN** sample data is loaded on a store with no products that already has a coupon with code "WELCOME50"
- **THEN** the demo products are created, no second coupon is created, and the existing coupon is unchanged

#### Scenario: Presets create no coupon

- **WHEN** store setup has applied the presets and sample data has not been loaded
- **THEN** the store has no coupon
