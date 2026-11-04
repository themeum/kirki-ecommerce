# Spec Delta

## Purpose

Defines the schema.org Product structured data (JSON-LD) printed on the single product page, so search engines can show price, availability and brand in rich results.

## ADDED Requirements

### Requirement: Product JSON-LD block
The single product page SHALL print one `application/ld+json` script that holds a schema.org `Product`, with `@context`, `@type` and `url` always present. Other fields follow the selected schema profile. Values MUST use the same fallbacks as the visible tags, and the script MUST be valid JSON that cannot close its own script tag.

#### Scenario: Published product
- **WHEN** a visitor opens a published product page
- **THEN** the head contains one JSON-LD script with `@type` `Product`, and its name and url match the product

#### Scenario: Markup in product text
- **WHEN** a product title or description contains `</script>` or HTML
- **THEN** the JSON-LD stays valid and the text cannot end the script element

### Requirement: Schema profile selection
The page SHALL use the schema profile assigned to the product. When the product has none, it MUST use the profile marked as default. When no usable profile exists, it MUST use a built-in field set.

#### Scenario: Product profile
- **WHEN** a product has a schema profile assigned
- **THEN** the JSON-LD uses the fields of that profile

#### Scenario: Default profile
- **WHEN** a product has no profile and a default profile exists
- **THEN** the JSON-LD uses the fields of the default profile

#### Scenario: No usable profile
- **WHEN** a product has no profile, no default profile exists or the profile data is invalid
- **THEN** the JSON-LD uses the built-in field set

### Requirement: Profile limits the printed fields
The JSON-LD SHALL print only the groups and fields that the selected profile lists. A group missing from the profile MUST NOT be printed. A listed field with no data, an unknown group and an unknown field MUST be skipped.

#### Scenario: Offer group missing
- **WHEN** the profile lists `Product` fields but no `Offer` group
- **THEN** the JSON-LD has no `offers` key

#### Scenario: Field listed without data
- **WHEN** the profile lists `Brand.logo` and the brand has no logo
- **THEN** the JSON-LD has no logo value and no empty key

#### Scenario: Unknown field
- **WHEN** the profile lists a field that the plugin does not know
- **THEN** that field is not printed

### Requirement: Product identifiers, brand and category
When the profile lists the SKU, the Product SHALL include `sku` and, for a valid 8, 12, 13 or 14 digit barcode, `gtin`, taken from the default variant or the first visible variant that has them. When the profile lists them, the Product SHALL also include a `brand` with the brand name (and logo when set), and a `category` built from the deepest assigned category path. A missing value MUST be left out, not printed as empty.

#### Scenario: Brand and SKU
- **WHEN** a product has a brand and a default variant with an SKU
- **THEN** the JSON-LD has `brand.name` and `sku`

#### Scenario: No brand
- **WHEN** a product has no brand
- **THEN** the JSON-LD has no `brand` key

### Requirement: Offer data
When the profile lists the `Offer` group, the Product SHALL include `offers`. A product with one visible variant MUST produce an `Offer`. A product with several visible variants MUST produce an `AggregateOffer` with `lowPrice`, `highPrice`, `offerCount` and `priceCurrency`. Prices MUST be plain decimal strings in the store base currency, using the sale price when one is set. Hidden variants MUST NOT be included.

#### Scenario: Single variant
- **WHEN** a product has one visible variant with a price
- **THEN** `offers` is an `Offer` with `price`, `priceCurrency`, `availability` and `url`

#### Scenario: Several variants
- **WHEN** a product has three visible variants with different prices
- **THEN** `offers` is an `AggregateOffer` with the lowest and highest price and `offerCount` 3

#### Scenario: No visible variant
- **WHEN** a product has no visible variant
- **THEN** the JSON-LD has no `offers` key

#### Scenario: Sale price
- **WHEN** a variant has an active sale price
- **THEN** the offer price is the sale price

### Requirement: Availability mapping
Each offer SHALL set `availability` to a schema.org value from the product availability: `InStock`, `BackOrder` or `OutOfStock`. A variant that is in stock or low on stock MUST be `InStock`, a variant out of stock that allows back orders MUST be `BackOrder`, and any other or unknown state MUST be `OutOfStock`. An aggregate offer MUST be `InStock` when any visible variant is `InStock`, else `BackOrder` when any is `BackOrder`, else `OutOfStock`.

#### Scenario: Out of stock
- **WHEN** no visible variant is in stock and none allows back orders
- **THEN** `availability` is `https://schema.org/OutOfStock`

#### Scenario: Back order
- **WHEN** a variant has no stock but allows back orders
- **THEN** its availability is `https://schema.org/BackOrder`

### Requirement: No invented data
The JSON-LD SHALL NOT include `aggregateRating` or `review`, even when the profile lists the `AggregateRating` or `Review` group, because the plugin stores no reviews. It MUST NOT include any value that is not shown to or set by the merchant.

#### Scenario: Reviews
- **WHEN** a profile lists `AggregateRating`
- **THEN** the JSON-LD still has no `aggregateRating` and no `review` key

### Requirement: Extensible and disable-able output
The plugin SHALL let site code change the final JSON-LD data before printing, and SHALL print nothing when the SEO head output is disabled.

#### Scenario: Data filtered
- **WHEN** site code adds a field to the structured data
- **THEN** the printed JSON-LD contains that field
