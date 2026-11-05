## Purpose

Defines the MCP tools that change the catalog: product text, draft products,
copies, product status, stock and prices. Each tool keeps the product data
that it does not name, and never deletes a product for good.

## ADDED Requirements

### Requirement: Money arguments are decimal amounts in the store currency

Each catalog write tool that accepts money SHALL take a decimal amount in the
store's base currency, for example `19.99`, with no more decimals than the
currency has. A negative amount SHALL be rejected. Previews and results SHALL
show money as decimal amounts with a display string and a currency code.

#### Scenario: Too many decimals

- **WHEN** `base_price` is `19.999` in a store with USD as the base currency
- **THEN** the tool returns a tool error that names `base_price`

### Requirement: Update product content

`kirki-ecommerce-update-product-content` SHALL change only these fields of
one product: `description`, `short_description`, `additional_info` (a list of
`title` and `description` pairs), `seo_title`, `seo_description`,
`seo_keywords`, `og_title`, `og_description`, `ribbon` and `ribbon_color`. It
SHALL require `product_id` and at least one of these fields. The preview SHALL
show the current and the new value of each named field. The product's other
data, its variants, media, categories and status SHALL NOT change.

#### Scenario: New description

- **WHEN** a confirmed call sends `product_id` 12 and a new `description`
- **THEN** only the description of product 12 changes, and the result shows the stored description

#### Scenario: No field

- **WHEN** only `product_id` is sent
- **THEN** the tool returns a tool error that lists the fields that it can change

### Requirement: Create a draft product

`kirki-ecommerce-create-draft-product` SHALL create a product with the
`draft` status, in one call. It SHALL require `title` and SHALL accept the
text and SEO fields of `update-product-content`, `category_ids`, `tag_ids`
and `brand_id`. By default it SHALL create a simple product with one variant
from `sku`, `base_price`, `base_sale_price`, `base_cost_of_goods`,
`track_inventory` and `available_quantity`. When `attributes` (each with an
attribute `id` and a list of attribute value IDs) and `variants` (each with
its `attribute_values` and the same variant fields) are sent, it SHALL create
a product with those variants. A sale price higher than the price, a SKU that
exists, or an unknown category, tag, brand, attribute or attribute value SHALL
be rejected with a tool error.

#### Scenario: Simple product

- **WHEN** the tool is called with `title` `"Linen shirt"`, `base_price` `49` and `available_quantity` `20`
- **THEN** a draft product with one variant is created and returned with its ID and admin edit link

#### Scenario: Product with variants

- **WHEN** the tool is called with an attribute "Size" and 3 variants for S, M and L
- **THEN** a draft product with 3 variants is created

#### Scenario: Status is ignored

- **WHEN** the arguments also have `status` `"published"`
- **THEN** the product is created as a draft

### Requirement: Duplicate a product

`kirki-ecommerce-duplicate-product` SHALL copy one product, with its variants,
as a new draft product, in one call. It SHALL return the new product's ID and
admin edit link.

#### Scenario: Copy

- **WHEN** the tool is called with `product_id` 12
- **THEN** a new draft product that copies product 12 is returned

### Requirement: Change product status

`kirki-ecommerce-change-product-status` SHALL change the status of one product
to `draft`, `published`, `scheduled` or `trashed`. For `scheduled`,
`scheduled_at` SHALL be required and SHALL be a future ISO 8601 date-time.
Publishing or scheduling SHALL be rejected when a variant of the product has
no price, that is a price of 0. Moving a product out of the trash SHALL be done with `draft` or
`published`. The tool SHALL NOT delete a product for good. The preview SHALL
show the current and the new status and the storefront effect, for example
"the product will be visible in the shop".

#### Scenario: Publish

- **WHEN** a confirmed call sets a draft product with priced variants to `published`
- **THEN** the product is published and its published date is set

#### Scenario: Schedule in the past

- **WHEN** `status` is `"scheduled"` and `scheduled_at` is yesterday
- **THEN** the tool returns a tool error that names `scheduled_at`

#### Scenario: Trash

- **WHEN** a confirmed call sets a product to `trashed`
- **THEN** the product moves to the trash and can be restored in the admin

### Requirement: Adjust stock by a relative amount

`kirki-ecommerce-adjust-stock` SHALL change the available quantity of one
variant by `quantity_change`, a non-zero integer. It SHALL require
`expected_quantity`, the quantity that the merchant thinks is in stock now.
The tool SHALL reject the change when the current quantity is not
`expected_quantity`, when the variant does not track inventory, or when the
new quantity is less than 0. The check and the change SHALL be one atomic
database operation, so that an order placed at the same time cannot be lost.

#### Scenario: Delivery arrived

- **WHEN** a confirmed call sends `quantity_change` 24 and `expected_quantity` 6 for a variant with 6 in stock
- **THEN** the variant has 30 in stock

#### Scenario: Stock changed

- **WHEN** an order takes 1 unit after the preview, so the variant has 5, and then the token is sent
- **THEN** the call returns a tool error that asks for a new preview, and the quantity stays 5

#### Scenario: Below zero

- **WHEN** `quantity_change` is -10 for a variant with 6 in stock
- **THEN** the tool returns a tool error and gives no token

### Requirement: Update prices

`kirki-ecommerce-update-prices` SHALL change `base_price`, `base_sale_price`
or `base_cost_of_goods` of 1 to 100 variants in one call. `base_sale_price`
SHALL be sent as null to remove a sale price. A sale price higher than the
price SHALL be rejected. The preview SHALL show each variant with its product
title, SKU, current and new prices. All variants SHALL change in one
transaction; when one fails, none SHALL change.

#### Scenario: Summer sale

- **WHEN** a confirmed call sets `base_sale_price` on 12 variants
- **THEN** the 12 variants have the new sale prices, and the result shows the stored prices

#### Scenario: Sale price over the price

- **WHEN** one variant gets `base_sale_price` 60 and its price is 50
- **THEN** the tool returns a tool error that names that variant, and gives no token

#### Scenario: Too many variants

- **WHEN** 101 variants are sent
- **THEN** the tool returns a tool error that names `variants`
