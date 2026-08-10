## Purpose

Defines what a fresh install of the plugin provisions before a merchant touches anything —
the default rows other features hold references to, the storefront pages and how they are
mapped in settings, and the guarantee that activating, deactivating, and reactivating the
plugin never duplicates or overwrites that data.

## ADDED Requirements

### Requirement: A fresh install is functional without onboarding

Activating the plugin SHALL leave the store in a state where every feature that depends on
default data works, without the merchant completing or even opening the onboarding flow.
Onboarding SHALL only customize values the install already provisioned.

#### Scenario: Placing an order immediately after activation

- **WHEN** the plugin is activated on a site that has never had it installed, and a checkout
  request is made without a currency code in the request or headers
- **THEN** the order is created using the base currency, and no fatal error occurs from an
  unresolved base currency

#### Scenario: Merchant never opens onboarding

- **WHEN** the plugin is activated and the merchant navigates directly to the products,
  shipping, and tax settings screens without submitting onboarding
- **THEN** every screen loads with its default options populated, and no screen reports an
  empty required list

### Requirement: Install provisions a base currency

The install SHALL create currency records and SHALL designate exactly one of them as the base
currency. Setting a different base currency later MUST be possible without first creating the
currency by hand.

#### Scenario: Base currency resolves after activation

- **WHEN** the base currency is requested after activation
- **THEN** exactly one currency record is returned and it is marked as the base

#### Scenario: Onboarding switches the base currency

- **WHEN** onboarding is submitted with a supported currency code other than the installed
  default
- **THEN** that currency becomes the base currency, the previous base is no longer marked as
  base, and no not-found error is raised

### Requirement: Install provisions default catalog and fulfilment records

The install SHALL create the default records that products and orders reference: shipping
profiles, tax profiles, shipping boxes, and a product schema template. Exactly one product
schema template MUST be marked as the default, and exactly one shipping box MUST be marked as
the default.

#### Scenario: Assigning a shipping profile to a product

- **WHEN** a product is created after activation and a shipping profile is requested
- **THEN** at least one shipping profile is available to select

#### Scenario: Default product schema is unambiguous

- **WHEN** the product schema templates are listed after activation
- **THEN** at least one template exists and exactly one of them is marked as the default

### Requirement: Install provisions storefront pages and records their IDs

The install SHALL create published pages for the shop, cart, checkout, and account views, and
SHALL record the mapping from each view to its page ID in the advance settings so a storefront
renderer can resolve a page to the view it represents.

#### Scenario: Pages exist and are mapped

- **WHEN** the advance settings are read after activation
- **THEN** they contain a page mapping with an entry for each of shop, cart, checkout, and
  account, and each entry holds the ID of an existing published page

#### Scenario: A mapped page is deleted by the merchant

- **WHEN** a merchant deletes one of the created pages and the plugin is reactivated
- **THEN** a replacement page for that view is created and the mapping is updated to the new
  ID, while the mappings for the pages that still exist are left untouched

### Requirement: Page selection lives only in the advance settings

The mapping from a storefront view to its page SHALL be held in exactly one settings section —
advance settings. No other settings section may carry a page reference, so that a merchant and
a renderer never disagree about which page backs a view.

#### Scenario: Product settings carry no page reference

- **WHEN** the product settings are read on a fresh install
- **THEN** they contain no shop page value

#### Scenario: A page reference submitted to another section is not persisted

- **WHEN** a settings section other than advance is saved with a page reference in its payload
- **THEN** the page reference is not stored, and the section's other values save normally

### Requirement: Install is idempotent across repeated activations

The install SHALL be safe to run more than once. Repeating it MUST NOT duplicate any record it
previously created, MUST NOT fail on a unique constraint, and MUST NOT overwrite a value the
merchant has since changed.

#### Scenario: Deactivate and reactivate

- **WHEN** the plugin is deactivated and activated again
- **THEN** the counts of currencies, shipping profiles, tax profiles, shipping boxes, product
  schema templates, and created pages are unchanged from before the reactivation

#### Scenario: Merchant edits a default, then reactivates

- **WHEN** a merchant renames a default shipping profile, changes the base currency, or points
  the shop page at a different page, and the plugin is then reactivated
- **THEN** each of those merchant-set values is preserved, and no duplicate of the original
  default is created alongside it

#### Scenario: Merchant deletes a default record

- **WHEN** a merchant deletes a default shipping profile and the plugin is reactivated
- **THEN** the deleted record is not silently recreated within the same installed version

### Requirement: Install records the version it provisioned

The install SHALL record which plugin version it last provisioned data for, so that a later
version can add new defaults on upgrade without re-adding the defaults an earlier version
already supplied.

#### Scenario: Activation at the same version

- **WHEN** the plugin is activated and the recorded install version matches the current plugin
  version
- **THEN** no new default records are created

#### Scenario: Activation after a version bump that adds a default

- **WHEN** the plugin is upgraded to a version that ships an additional default record, and
  the plugin is activated
- **THEN** the new default record is created, the recorded install version is updated, and the
  defaults from the earlier version are not duplicated

### Requirement: Shipped settings defaults are neutral for a real store

The settings defaults a fresh install resolves SHALL NOT contain placeholder contact details
or tax collection that is switched on for jurisdictions the merchant has not chosen. Every
settings section MUST still resolve to a complete value with no stored option present.

#### Scenario: Store email on a fresh install

- **WHEN** the general settings are read on a fresh install
- **THEN** the store email is empty rather than a placeholder address belonging to the plugin
  vendor

#### Scenario: Tax collection on a fresh install

- **WHEN** the tax settings are read on a fresh install
- **THEN** taxed pricing is not enabled and no tax region is enabled

#### Scenario: Settings resolve with no stored option

- **WHEN** any settings section is read on an install where no corresponding option has ever
  been written
- **THEN** the section resolves to its complete shipped default rather than an empty or partial
  value

### Requirement: Settings defaults have a single source

Default settings values SHALL be resolved from one source. No install-time process may write a
competing copy of those defaults into stored settings. Where the install has to persist a value
it computed, it MUST store only that value, so that defaults added in a later version still
reach an install provisioned by an earlier one.

#### Scenario: Stored settings after activation

- **WHEN** the plugin is activated and no settings have been saved by the merchant
- **THEN** the only settings values stored are the page IDs the install created, and every
  other value in every section still resolves from the shipped defaults

#### Scenario: Merchant saves a partial settings section

- **WHEN** a merchant saves one settings section and a later plugin version adds a new key to
  that section's shipped defaults
- **THEN** reading the section returns the merchant's saved values plus the new key at its
  default
