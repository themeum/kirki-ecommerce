# product-structured-data Specification

## Purpose
Defines the schema.org Product structured data (JSON-LD) printed on the single product page, so search engines can show price, availability and brand in rich results.
## Requirements
### Requirement: Product JSON-LD block
The single product page SHALL print one `application/ld+json` script that holds a schema.org `Product`, with `@context`, `@type` and `url` always present. Other fields are the fixed field set filled from the product data. Values MUST use the same fallbacks as the visible tags, and the script MUST be valid JSON that cannot close its own script tag.

#### Scenario: Published product
- **WHEN** a visitor opens a published product page
- **THEN** the head contains one JSON-LD script with `@type` `Product`, and its name and url match the product

#### Scenario: Markup in product text
- **WHEN** a product title or description contains `</script>` or HTML
- **THEN** the JSON-LD stays valid and the text cannot end the script element

### Requirement: Product identifiers, brand and category
The Product SHALL include `sku` and, for a valid 8, 12, 13 or 14 digit barcode, `gtin`, taken from the default variant or the first visible variant that has them. The Product SHALL also include a `brand` with the brand name, and the brand logo when one is set, and a `category` built from the deepest assigned category path, for example `Lighting > Lamps`. A missing value MUST be left out, not printed as empty.

#### Scenario: Brand and SKU
- **WHEN** a product has a brand and a default variant with an SKU
- **THEN** the JSON-LD has `brand.name` and `sku`

#### Scenario: Brand logo
- **WHEN** a product has a brand with a logo
- **THEN** the JSON-LD has `brand.logo` with the logo URL

#### Scenario: No brand
- **WHEN** a product has no brand
- **THEN** the JSON-LD has no `brand` key

#### Scenario: Category path
- **WHEN** a product is assigned to the category "Lamps", whose parent is "Lighting"
- **THEN** the JSON-LD has `category` `Lighting > Lamps`

#### Scenario: Barcode that is not a GTIN
- **WHEN** the variant barcode has 9 digits or contains letters
- **THEN** the JSON-LD has no `gtin` key

### Requirement: Offer data
The Product SHALL include `offers` when it has at least one visible variant. A product with one visible variant MUST produce an `Offer`. A product with several visible variants MUST produce an `AggregateOffer` with `lowPrice`, `highPrice`, `offerCount` and `priceCurrency`. Prices MUST be plain decimal strings in the store base currency, using the sale price when one is set. Hidden variants MUST NOT be included. Each offer SHALL include `availability`, `itemCondition` `https://schema.org/NewCondition`, `url`, and a `seller` of `@type` `Organization` whose name is the site name.

#### Scenario: Single variant
- **WHEN** a product has one visible variant with a price
- **THEN** `offers` is an `Offer` with `price`, `priceCurrency`, `availability`, `itemCondition`, `seller` and `url`

#### Scenario: Several variants
- **WHEN** a product has three visible variants with different prices
- **THEN** `offers` is an `AggregateOffer` with the lowest and highest price and `offerCount` 3

#### Scenario: No visible variant
- **WHEN** a product has no visible variant
- **THEN** the JSON-LD has no `offers` key

#### Scenario: Sale price
- **WHEN** a variant has an active sale price
- **THEN** the offer price is the sale price

#### Scenario: Seller name
- **WHEN** the WordPress site name is "Lamp House"
- **THEN** `offers.seller.name` is "Lamp House"

### Requirement: Availability mapping
Each offer SHALL set `availability` to a schema.org value from the product availability: `InStock`, `BackOrder` or `OutOfStock`. A variant that is in stock or low on stock MUST be `InStock`, a variant out of stock that allows back orders MUST be `BackOrder`, and any other or unknown state MUST be `OutOfStock`. An aggregate offer MUST be `InStock` when any visible variant is `InStock`, else `BackOrder` when any is `BackOrder`, else `OutOfStock`.

#### Scenario: Out of stock
- **WHEN** no visible variant is in stock and none allows back orders
- **THEN** `availability` is `https://schema.org/OutOfStock`

#### Scenario: Back order
- **WHEN** a variant has no stock but allows back orders
- **THEN** its availability is `https://schema.org/BackOrder`

### Requirement: No invented data
The JSON-LD SHALL NOT include `aggregateRating` or `review`, because the plugin stores no reviews. It MUST NOT include any value that is not shown to or set by the merchant, except the fixed `itemCondition` `NewCondition`.

#### Scenario: Reviews
- **WHEN** any product page is printed
- **THEN** the JSON-LD has no `aggregateRating` and no `review` key

### Requirement: Extensible and disable-able output
The plugin SHALL let site code change the final JSON-LD data before printing, and SHALL print nothing when the SEO head output is disabled.

#### Scenario: Data filtered
- **WHEN** site code adds a field to the structured data
- **THEN** the printed JSON-LD contains that field

### Requirement: Fixed field set from product data
The JSON-LD SHALL print the same field set for every product: Product `name`, `description`, `image`, `sku`, `gtin`, `category`, `brand` and `offers`, as the other requirements define. Each value SHALL come from the product data, its variants, brand, categories, the resolved SEO values, or the site name. A field with no data MUST be left out, not printed as empty. No store setting or per-product setting SHALL change which fields are printed; site code changes the output only through the structured data filter.

#### Scenario: All data present
- **WHEN** a product has a title, description, image, a default variant with an SKU and a 13 digit barcode, a brand with a logo, a category, and one visible variant with a price
- **THEN** the JSON-LD has `name`, `description`, `image`, `sku`, `gtin`, `category`, `brand.name`, `brand.logo` and an `Offer`

#### Scenario: Field without data
- **WHEN** a product has no image and no category
- **THEN** the JSON-LD has no `image` key and no `category` key

