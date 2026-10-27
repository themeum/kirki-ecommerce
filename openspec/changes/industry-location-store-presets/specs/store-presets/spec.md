## Purpose

Gives a newly set up store a working starting configuration based on the
merchant's industry and country: categories, shipping zones and methods,
shipping and tax profiles, a tax region with its rules, attributes, a product
schema profile, and legal pages and consents. The merchant then reviews this
data instead of creating all of it by hand.

## ADDED Requirements

### Requirement: Presets come from the bundled data file

The system SHALL build the presets of one store from the preconfigured data
file bundled with the plugin, `resources/data/preconfigured-data.json`, using
the industry, the country, the store address state, the base currency and
whether the merchant collects tax. The file SHALL have a common section, an
industry section with one entry per onboarding industry slug, and a country
section with one entry per ISO 3166-1 alpha-2 code. Each country entry that
holds tax data SHALL record its legal source and the date it was last
verified. The system SHALL NOT send any external request to get the presets.

Merchant-facing text in the presets SHALL be English and SHALL be written to the
store as it is.

#### Scenario: Presets from the bundled file

- **WHEN** presets are applied with industry "fashion-and-apparel" and country "GB"
- **THEN** the presets are built from the common, "fashion-and-apparel" and "GB" entries of the bundled data file, and no external request is made

#### Scenario: Country with no entry

- **WHEN** presets are applied with a country that has no entry in the country section
- **THEN** the common presets and the industry presets are applied, and a Domestic zone with the generic methods, disabled, is created

### Requirement: Presets are skipped silently when the data file cannot be read

When the bundled data file is missing or cannot be decoded, the system SHALL
write no presets, SHALL log the failure, and store setup SHALL still succeed. A
record of a known kind that is malformed SHALL be skipped, and the other records
SHALL still be written.

#### Scenario: Data file is missing

- **WHEN** store setup runs and the bundled data file cannot be read
- **THEN** no preset data is written, the failure is logged, and store setup succeeds

#### Scenario: Malformed record

- **WHEN** the presets hold a shipping zone with no known destination country
- **THEN** that zone is not written and the other preset kinds are written

### Requirement: Presets are applied once, during store setup

Store setup SHALL apply the presets after the settings, the base currency, the
tax switches and the storefront pages are saved. The context SHALL come from
the saved store settings. The presets SHALL be applied at most once per store:
when store setup runs again after the presets were applied, whether presets were
written or skipped, the presets SHALL change nothing.

#### Scenario: Presets during setup

- **WHEN** store setup succeeds with industry "food-beverage-and-gourmet", country "DE", currency "EUR" and tax collection on
- **THEN** the presets for that industry, country, currency and tax answer are written

#### Scenario: Setup runs again

- **WHEN** store setup runs again on a store where the presets were already applied
- **THEN** no preset data is written or changed

### Requirement: The "other" industry skips industry presets

When the merchant chose the industry "other", or an industry with no entry in
the industry data, the system SHALL apply no industry presets. The common
presets and the country presets SHALL still apply.

#### Scenario: Industry is "other"

- **WHEN** presets are applied with industry "other" and country "DE"
- **THEN** no categories, industry attributes, industry shipping profiles or industry tax profiles are created
- **AND** the Color attribute, the default shipping and tax profiles, the schema profile, the legal pages and consents, and the "DE" shipping and tax presets are created

### Requirement: Categories are preset by industry

The store SHALL receive the industry's category tree, up to two levels deep.
Every category SHALL have a unique slug, and a child category SHALL reference
its parent. When the store already has at least one category, no category SHALL
be created.

#### Scenario: Fashion store

- **WHEN** presets are applied with industry "fashion-and-apparel" on a store with no categories
- **THEN** the fashion category tree is created, with each child linked to its parent

#### Scenario: Categories already exist

- **WHEN** presets are applied on a store that already has a category
- **THEN** no categories are created

### Requirement: Shipping zones follow the store's country

The system SHALL create shipping zones in this order, each enabled:

1. A Domestic zone whose only destination is the store's country.
2. A Regional zone, only when the country belongs to a trade bloc in the preset
   data. Its destinations SHALL be the other members of that bloc.

No zone SHALL be created for the rest of the world. Every zone SHALL have a
title and at least one destination, so that the merchant can open and save it
without changes.

#### Scenario: Country in a trade bloc

- **WHEN** presets are applied with country "DE"
- **THEN** two zones exist in order: Domestic with destination "DE", and Regional with the other 26 EU member countries

#### Scenario: Country with no trade bloc

- **WHEN** presets are applied with a country that belongs to no trade bloc, or that has no entry
- **THEN** only the Domestic zone exists

#### Scenario: Shopper in the home country

- **WHEN** a shopper with a shipping address in the store's country reaches checkout
- **THEN** the Domestic zone's methods are offered

### Requirement: Shipping method amounts apply only in the matching currency

Each preset zone SHALL receive the shipping methods its country entry defines,
or the generic method set when the country has no method data. A method amount
is in the country's local currency. When the store's base currency is that
currency, the methods SHALL be created enabled with those amounts. When the
store's base currency is different, or the country has no method data, the
methods SHALL be created disabled with a rate of zero, so that no wrong amount
is charged.

#### Scenario: Base currency matches the country's currency

- **WHEN** presets are applied with country "GB" and currency "GBP"
- **THEN** the Domestic zone's methods are enabled with the amounts from the "GB" entry

#### Scenario: Base currency differs from the country's currency

- **WHEN** presets are applied with country "GB" and currency "USD"
- **THEN** the Domestic zone has the same methods as the "GB" entry, each disabled with a rate of zero

#### Scenario: Home setup checklist

- **WHEN** the presets created at least one enabled method in an enabled zone
- **THEN** the Home shipping step shows as preconfigured and waits for the merchant to confirm it

### Requirement: Shipping profiles and their rules are preset by industry

The system SHALL create a default shipping profile named "General" for every
store, plus each shipping profile in the industry entry. An industry entry MAY
attach rules to the preset methods for its profiles. Those rules SHALL use only
actions that do not contain a money amount: multiply the shipping cost, or
disable the method. Each rule SHALL reference the created profile by its stored
id.

#### Scenario: Fragile profile raises the cost

- **WHEN** presets are applied with an industry whose entry has a "Fragile" profile with a ×1.25 rule on the Domestic standard method
- **THEN** a "Fragile" shipping profile exists, and that method has a rule "shipping profile is Fragile → multiply shipping cost by 1.25" that references the profile's id

#### Scenario: Perishable profile is not shipped to the region

- **WHEN** presets are applied with country "DE" and an industry whose entry disables Regional methods for a "Perishable" profile
- **THEN** a cart that holds a Perishable item and ships to another EU country is not offered the Regional methods

#### Scenario: Default profile

- **WHEN** presets are applied
- **THEN** exactly one shipping profile is marked default, and it is named "General"

### Requirement: The tax region is preset only when the merchant collects tax

When the merchant chose to collect tax, the system SHALL create one enabled tax
region for the store's country:

- For an EU member country: one EU region of type micro-business that holds
  one country, the store's country, with its standard VAT rate. A
  micro-business region holds exactly one country.
- For the United States and Canada: a per-state region. It SHALL contain the
  home state or province from the store address with its rates. For Canada it
  SHALL also contain the federal GST/HST rate for every other province. When
  the store address has no state, no region SHALL be created for that country.
- For every other country whose preset entry holds tax data: a country-wide
  region with the standard rate as both the product rate and the shipping rate.
- For a country with no tax data: no region. A national VAT or GST rate is added
  to the data only with a source that confirms it.

When the merchant chose not to collect tax, no tax region SHALL be created.

#### Scenario: EU store collecting tax

- **WHEN** presets are applied with country "FR" and tax collection on
- **THEN** one enabled EU region of type micro-business exists, and its only country is "FR" with the standard French VAT rate

#### Scenario: US store with a home state

- **WHEN** presets are applied with country "US", state "TX" and tax collection on
- **THEN** one enabled per-state region for "US" exists with exactly one state, "TX", at the Texas state base rate

#### Scenario: US store with no state

- **WHEN** presets are applied with country "US", no state and tax collection on
- **THEN** no tax region is created

#### Scenario: Country-wide VAT country

- **WHEN** presets are applied with country "BD" and tax collection on
- **THEN** one enabled country-wide region for "BD" exists, with the standard VAT rate as both its product and shipping rate

#### Scenario: Not collecting tax

- **WHEN** presets are applied with tax collection off
- **THEN** no tax region is created

### Requirement: Tax profiles and their rules are preset

The system SHALL create a default tax profile named "Standard" for every store,
plus each tax profile in the industry entry. Tax profiles SHALL be created
whether or not the merchant collects tax. When a tax region is created and the
home country taxes a created profile at a rate other than its standard rate,
the region SHALL get a rule with the condition "tax profile is <profile>". The
rate MAY be lower or higher than the standard rate. The rule's action SHALL
set the product tax rate to that rate, or mark the product exempt when the
profile is exempt. A rule SHALL be added only when the preset data has a source
for it.

Rules SHALL cover the home country only. In a per-state region, a rule that
applies country-wide SHALL be placed on every listed state, and a rule for one
state SHALL be placed on that state only and SHALL replace the country-wide
rule for the same profile.

#### Scenario: Reduced rate for food

- **WHEN** presets are applied with industry "food-beverage-and-gourmet", country "DE" and tax collection on
- **THEN** a food tax profile exists, and the EU region has a rule "tax profile is food → set product tax rate 7"

#### Scenario: Higher rate for a profile

- **WHEN** presets are applied for a home state whose data charges a profile above the state's standard rate
- **THEN** that state has a rule "tax profile is <profile> → set product tax rate <higher rate>"

#### Scenario: Country-wide rule in a per-state region

- **WHEN** presets are applied with country "CA", a home province and tax collection on, and the "CA" data zero-rates a created profile country-wide
- **THEN** every province in the region has a rule for that profile with rate 0

#### Scenario: No rate data for a profile

- **WHEN** the home country's data has no rate for a created tax profile
- **THEN** the profile exists and no rule references it

#### Scenario: Not collecting tax

- **WHEN** presets are applied with tax collection off
- **THEN** the tax profiles exist and no tax rule is created

### Requirement: Attributes are preset by industry

Every store SHALL receive a color-type "Color" attribute whose values each have
a name and a hex code. The store SHALL also receive each attribute in the
industry entry, with its values. An attribute whose slug already exists SHALL
be left unchanged.

#### Scenario: Fashion store

- **WHEN** presets are applied with industry "fashion-and-apparel"
- **THEN** the Color attribute and the fashion attributes, including Size, exist with their preset values

#### Scenario: Industry "other"

- **WHEN** presets are applied with industry "other"
- **THEN** Color is the only attribute created

### Requirement: A default product schema profile is preset

Every store SHALL receive one product schema profile, marked default, that
contains every field the product form's schema picker supports. The profile
does not depend on the industry.

#### Scenario: Schema profile after presets

- **WHEN** presets are applied on a store with no schema profiles
- **THEN** exactly one schema profile exists, it is the default, and it holds every field the schema picker can show

#### Scenario: Schema profiles already exist

- **WHEN** presets are applied on a store that already has a schema profile
- **THEN** no schema profile is created

### Requirement: Legal pages and consents are preset

Every store SHALL have published Terms & Conditions, Privacy Policy, and Refund
& Returns Policy pages. A page SHALL be created only when no page with its slug
exists. A new page SHALL contain short placeholder text that tells the merchant
to replace it, and SHALL NOT contain generated legal text. When the WordPress
privacy policy page is set and published, the Privacy Policy consent SHALL link
to it, and no second privacy page SHALL be created.

The store SHALL receive these consents, each enabled, with messages that link
to the pages through page tokens:

- Terms: at checkout, mandatory checkbox.
- Privacy: at signup and checkout. Mandatory checkbox when the country has a
  GDPR-style privacy law. Display text only in other countries.
- Marketing: at signup and checkout, optional checkbox.

#### Scenario: Consents for an EU store

- **WHEN** presets are applied with country "DE"
- **THEN** the Privacy consent is a mandatory checkbox at signup and checkout

#### Scenario: Consents for a country with no GDPR-style law

- **WHEN** presets are applied with a country whose entry does not mark a GDPR-style privacy law
- **THEN** the Privacy consent is display text only at signup and checkout

#### Scenario: Consent links resolve

- **WHEN** a shopper views the checkout after presets were applied
- **THEN** the Terms consent message links to the published Terms & Conditions page

#### Scenario: Merchant already has consents

- **WHEN** presets are applied on a store that already has at least one consent
- **THEN** no consents are created

### Requirement: Order and invoice numbering are not preset

The presets SHALL NOT change the order number or invoice number settings.

#### Scenario: Numbering after presets

- **WHEN** presets are applied for any industry and country
- **THEN** the order number and invoice number settings keep their default values

### Requirement: Presets never overwrite merchant data

Each preset kind SHALL check its own target before it writes, and SHALL write
nothing when that target already holds data: categories, shipping zones, the
tax region list, profiles with the same name, attributes with
the same slug, schema profiles, pages with the same slug, and consents. A
preset kind that fails while it writes SHALL be logged and SHALL NOT stop the
other kinds.

#### Scenario: Existing shipping zone

- **WHEN** presets are applied on a store that already has a shipping zone
- **THEN** no preset zone is created and the existing zone is unchanged

#### Scenario: One kind fails

- **WHEN** writing the shipping zones throws an error during store setup
- **THEN** the error is logged, the remaining preset kinds are written, and store setup succeeds
