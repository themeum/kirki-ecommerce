# onboarding-seed-data Specification

## Purpose
Provisions a newly installed store with a usable baseline — currency, category
tree, attribute presets, product schema profiles, demo products with real imagery,
and sensible default settings — so that a merchant activating the plugin for the
first time lands on a working store rather than an empty one, without ever
overwriting configuration that already exists.
## Requirements
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

### Requirement: Seeding is idempotent and never destroys existing data

Each seeded concern SHALL verify its own target before writing and SHALL make no
changes when that target is already populated. A seeding run that fails partway
SHALL be safely resumable, with already-completed concerns skipped rather than
repeated.

#### Scenario: Re-run after a completed seed

- **WHEN** the onboarding seed is triggered again on a store that has already been seeded
- **THEN** no duplicate rows are created and no error is raised

#### Scenario: Resume after partial failure

- **WHEN** a seeding run fails after some concerns have been written but before others
- **AND** the seed is triggered again
- **THEN** the concerns that already completed are skipped and only the outstanding ones are written

#### Scenario: Merchant has pre-existing data

- **WHEN** the seed runs on a store that already has categories, products, or a configured setting
- **THEN** that existing data is left untouched

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

### Requirement: Colour and material attribute presets are available

The store SHALL be seeded with a colour attribute whose values each carry a hex
code, and a material attribute needed by the demo catalog.

#### Scenario: Colour attribute is seeded

- **WHEN** the seed runs on a store with no colour attribute
- **THEN** a colour-type attribute is created with a named preset value and hex code for each colour in the preset library

#### Scenario: Material attribute is seeded

- **WHEN** the seed runs on a store with no material attribute
- **THEN** a list-type material attribute is created with the values required by the demo products

#### Scenario: One attribute already exists

- **WHEN** the seed runs on a store that already has the colour attribute but not the material attribute
- **THEN** the colour attribute is left untouched and only the material attribute is created

### Requirement: Product schema profiles are available and editable

The store SHALL be seeded with product schema profiles, exactly one of which is
the default. Every seeded profile SHALL contain only fields the product form's
schema picker can render, so that opening and saving a profile does not silently
discard data.

#### Scenario: Schema profiles are seeded

- **WHEN** the seed runs on a store with no product schema rows
- **THEN** profiles are created, exactly one is marked as default, and each includes the required product name and offer price fields

#### Scenario: A merchant edits a seeded profile

- **WHEN** a merchant opens a seeded schema profile in the product form and saves it without changes
- **THEN** the stored profile is unchanged

#### Scenario: Schema profiles already exist

- **WHEN** the seed runs on a store that already has a product schema row
- **THEN** no profiles are created

### Requirement: Store settings have onboarding defaults

The seed SHALL establish default values for the general, product, payment, and
checkout settings, writing a settings group only when that group has not already
been configured.

#### Scenario: Selling location

- **WHEN** general settings have not been configured
- **THEN** the selling location is set to all countries

#### Scenario: Reviews are off by default

- **WHEN** product settings have not been configured
- **THEN** product reviews and star ratings on reviews are both disabled

#### Scenario: Guest checkout is off by default

- **WHEN** checkout settings have not been configured
- **THEN** guest checkout is disabled

#### Scenario: Cash on Delivery is offered

- **WHEN** payment settings have not been configured
- **THEN** an enabled offline payment method named "Cash on Delivery" is available with descriptive instructions and no icon

#### Scenario: A settings group is already configured

- **WHEN** a merchant has already saved one of these settings groups
- **THEN** that group is left exactly as the merchant configured it

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

### Requirement: Sample images are downloaded together

When the merchant loads sample data, the import SHALL download the images of all
the products that it will create before it creates the first product. It SHALL
send the image requests at the same time, with at most 25 requests in flight, and
not one after the other. Each image URL SHALL be requested at most one time for
each load, also when a product and one of its variants use the same image. The
import SHALL NOT request an image that an earlier load already imported from the
same URL, an image from an untrusted URL, or an image of a product that it skips
because the store already has one of its SKUs. A failed image request SHALL affect
only that image: the other images are imported, and every product is still
created.

#### Scenario: All images in one batch

- **WHEN** the merchant loads the sample data of an industry whose five products name 22 different images, and no image was imported before
- **THEN** the 22 image requests are sent together in one batch, before any product is created, and each image URL is requested one time

#### Scenario: Shared product and variant image

- **WHEN** a product names `linen-shirt-coral.jpg` as an image, and one of its variants names the same file
- **THEN** that image URL is requested one time, and the product and the variant use the same media library item

#### Scenario: Image imported by an earlier load

- **WHEN** the merchant loads sample data again, and an earlier load imported every image of the industry
- **THEN** no image is requested, and the products use the existing media library items

#### Scenario: Skipped product

- **WHEN** the store already has a variant with the SKU of a sample product
- **THEN** that product is skipped, and its images are not requested

#### Scenario: One image fails in the batch

- **WHEN** one image request in the batch times out, and the other images return 200
- **THEN** the other images are imported, and the product with the failed image is created without that image

#### Scenario: More images than the limit

- **WHEN** the products to create name 30 different images that were not imported before
- **THEN** no more than 25 image requests are in flight at the same time, and all 30 images are requested
