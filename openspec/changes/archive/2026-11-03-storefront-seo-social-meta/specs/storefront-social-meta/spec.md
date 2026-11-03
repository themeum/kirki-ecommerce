# Spec Delta

## Purpose

Defines the Open Graph and Twitter Card tags of the single product page, so that a shared product link shows the correct title, description and image on social platforms and chat apps.

## ADDED Requirements

### Requirement: Open Graph core tags
The single product page SHALL print `og:type` with value `product`, `og:url` with the canonical product URL, `og:site_name` with the site name, and `og:locale` with the site locale.

#### Scenario: Core tags present
- **WHEN** a visitor opens a published product page
- **THEN** the head contains `og:type`, `og:url`, `og:site_name` and `og:locale` with the expected values

### Requirement: Open Graph title and description fallbacks
The page SHALL print `og:title` and `og:description` with the same fallbacks as the admin Social Share preview. The title MUST use the product Open Graph title, then the product title. The description MUST use the product Open Graph description, then the short description as plain text.

#### Scenario: Open Graph values set
- **WHEN** a product has an Open Graph title and description
- **THEN** `og:title` and `og:description` hold those values

#### Scenario: Fallback to product values
- **WHEN** a product has no Open Graph values but has a title and a short description
- **THEN** `og:title` holds the product title and `og:description` holds the short description as plain text

#### Scenario: SEO values are not used
- **WHEN** a product has an SEO title but no Open Graph title
- **THEN** `og:title` holds the product title

### Requirement: Open Graph image
The page SHALL print `og:image` with an absolute image URL, never an object or an empty value. The image MUST be the product Open Graph image, then the product featured image, then the store fallback image. The page MUST also print the image width and height when they are known.

#### Scenario: Open Graph image chosen
- **WHEN** a product has an Open Graph image
- **THEN** `og:image` holds the URL of that image

#### Scenario: Featured image fallback
- **WHEN** a product has no Open Graph image but has a featured image
- **THEN** `og:image` holds the URL of the featured image

#### Scenario: Store fallback image
- **WHEN** a product has no Open Graph image and no media
- **THEN** `og:image` holds the store fallback image URL

### Requirement: Product price tags
When a product has a sellable price, the page SHALL print `product:price:amount` and `product:price:currency`. The amount MUST be a plain decimal number in the store base currency, using the lowest sale price when one is active.

#### Scenario: Price present
- **WHEN** a product has at least one visible variant with a price
- **THEN** both price tags are printed with a plain decimal amount and a three-letter currency code

#### Scenario: No price
- **WHEN** a product has no visible variant price
- **THEN** no price tag is printed

### Requirement: Twitter Card tags
The page SHALL print `twitter:card`, `twitter:title`, `twitter:description` and `twitter:image`. The card type MUST be `summary_large_image` when an image exists, and `summary` otherwise. The values MUST match the Open Graph values.

#### Scenario: Card with image
- **WHEN** the page has an `og:image`
- **THEN** `twitter:card` is `summary_large_image` and `twitter:image` equals `og:image`

### Requirement: Safe output
Every tag value SHALL be escaped for its HTML attribute. A value with quotes or markup MUST NOT break out of the tag.

#### Scenario: Title with quotes
- **WHEN** a product Open Graph title contains a double quote, an ampersand and a less-than sign
- **THEN** the printed tag stays one valid tag and the characters are escaped
