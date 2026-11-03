## MODIFIED Requirements

### Requirement: Baseline seed runs during store setup

The baseline onboarding dataset SHALL be seeded as part of the merchant's store setup
in the onboarding wizard. That dataset is the attribute presets, product schema
profiles and settings defaults. Store setup SHALL NOT create categories or tags. The
baseline dataset SHALL NOT be seeded on plugin activation, on a version update, by the
developer seeding command, or by the demo seeder set. Settings defaults SHALL be
seeded before the merchant's wizard answers are applied, so the answers take
precedence.

#### Scenario: Fresh install before onboarding

- **WHEN** the plugin is activated and no store setup has been submitted yet
- **THEN** no categories, tags, attributes, schema profiles, or settings defaults have been seeded

#### Scenario: Store setup

- **WHEN** the merchant's store setup succeeds and the presets can be read
- **THEN** the attribute presets, product schema profiles, and settings defaults are seeded, and no categories or tags are created

#### Scenario: Wizard answers win over defaults

- **WHEN** store setup seeds the general settings defaults on a store with no general settings
- **THEN** the store name, address, and tax switch from the wizard are what the general settings hold afterwards

#### Scenario: Developer seeding command is unaffected

- **WHEN** a developer runs the plugin's database seeding command
- **THEN** only the existing demo seeders run, and no onboarding seeder is executed

### Requirement: A category tree is available

The store SHALL receive the category tree of its sample products when the merchant
loads sample data. The tree SHALL come from the same products file as the products.
Each category SHALL be found by its slug. When the store has no category with that
slug, it SHALL be created with that slug, linked to its parent, and with a level one
greater than its parent's. An existing category SHALL be reused and SHALL NOT be
changed.

#### Scenario: Categories are created with the sample data

- **WHEN** sample data is loaded on a store with no categories
- **THEN** every category of the products file is created with its slug, each child linked to its parent, and each level numbered from 1

#### Scenario: A category with the same slug exists

- **WHEN** sample data is loaded and the store already has a category with the slug `notebooks`
- **THEN** that category is reused unchanged, the sample products link to it, and no second `notebooks` category is created

#### Scenario: Store setup creates no categories

- **WHEN** the merchant's store setup succeeds
- **THEN** no categories are created

### Requirement: Demo products are available with imagery

The store SHALL receive demo products only when the merchant loads sample data. The
products SHALL be the sample products of the store's industry. When the industry is
"other", or the industry has no products file, they SHALL be the products of the
`other` set. Each product SHALL be created as published, with the slug, title,
descriptions, ribbon, images and variants of the products file, and each variant with
its SKU, price, sale price, cost, stock, low-stock threshold, backorder setting, order
limit, weight in grams and unit pricing. Prices SHALL be used as numbers in the
store's base currency, with no conversion.

The tags of the products file SHALL be found by slug, or created with their name and
slug when the store has no tag with that slug. Existing tags SHALL be reused and SHALL
NOT be changed. A product SHALL link to the categories and tags that it names.

The attribute definitions SHALL be the common preset attributes and the attributes
of the products set's industry, merged by slug, with the values of both. When a
variant needs an attribute or an attribute value that the store does not have, it
SHALL be created from that definition, with the hex code of a color value. Existing
attributes and values SHALL be reused and SHALL NOT be changed.

Each product SHALL be created on its own. A product SHALL be skipped when the store
already has a variant with one of its SKUs, so a load that was cut off can be run
again and creates only the products that are missing. The starter coupon SHALL be
created inactive, only when no coupon with its code exists.

#### Scenario: Store setup does not add products

- **WHEN** the merchant's store setup succeeds
- **THEN** no demo products are created

#### Scenario: Industry products are loaded

- **WHEN** sample data is loaded on a Fashion store
- **THEN** the Fashion sample products are created, each with a priced default variant

#### Scenario: Industry "other"

- **WHEN** sample data is loaded on a store whose industry is "other"
- **THEN** the products, categories and tags of the `other` set are created

#### Scenario: Category and tag links

- **WHEN** a sample product names the category `pens` and the tags `writing` and `gift-idea`
- **THEN** the product is linked to that category and those tags

#### Scenario: Missing tag

- **WHEN** a sample product names the tag `gift-idea` and the store has no tag with that slug
- **THEN** the tag "Gift Idea" is created with the slug `gift-idea`, and the product is linked to it

#### Scenario: Existing tag

- **WHEN** the store already has a tag with the slug `bestseller`
- **THEN** that tag is reused unchanged, and no second `bestseller` tag is created

#### Scenario: Missing attribute value

- **WHEN** a Fashion variant uses Color "Marigold", the store's Color attribute has no "Marigold" value, and the Fashion presets define "Marigold" in their `color` entry
- **THEN** the value "Marigold" is created with its preset hex code, and the variant is linked to it

#### Scenario: Price in another currency

- **WHEN** the store's base currency is EUR and a sample variant has the price 38.00
- **THEN** the variant's price is 38.00 EUR

#### Scenario: Weight in grams

- **WHEN** a sample variant has a weight of 450
- **THEN** the variant's weight is 450 with the unit gram

#### Scenario: Unit pricing

- **WHEN** a sample variant has the unit price 100 g per 350 g
- **THEN** the variant is stored with the base unit amount 100, the base unit g, the total unit amount 350 and the total unit g

#### Scenario: Images become media library items

- **WHEN** the demo products are created
- **THEN** each product image is downloaded into the WordPress media library and referenced by the product or variant that uses it

#### Scenario: An image is imported twice

- **WHEN** an image from the same source URL was already imported by a previous load
- **THEN** the existing media library item is reused rather than duplicated

#### Scenario: Media import is not possible

- **WHEN** images cannot be downloaded or written to the media library
- **THEN** the demo products are still created, without imagery, and the load does not fail

#### Scenario: Load cut off and run again

- **WHEN** a load created three of five products before the request ended, and the merchant loads sample data again
- **THEN** only the two missing products are created

#### Scenario: Store has its own products

- **WHEN** sample data is loaded on a store that has products whose SKUs differ from the sample SKUs
- **THEN** the sample products are created next to the merchant's products

#### Scenario: Coupon already exists

- **WHEN** sample data is loaded and a coupon with the starter code exists
- **THEN** that coupon is left unchanged and no second coupon is created

## REMOVED Requirements

### Requirement: Bundled product images stay in the plugin

**Reason**: Sample product images are no longer bundled in the plugin. They are
downloaded from the remote preset location when sample data is loaded, so there is
no bundled image directory to keep.

**Migration**: None for merchants. Images that earlier versions imported stay in the
media library. Developers put product images into the preset source folder, and the
publish command uploads them.
