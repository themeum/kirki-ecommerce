# storefront-seo-meta Specification

## Purpose
Defines the search-engine head output of the single product page: title, description, keywords, canonical link and robots directive. Merchants control these values from the product SEO fields, with safe defaults.

## Requirements

### Requirement: Meta description and keywords
The single product page SHALL print a meta description and a meta keywords tag. The description MUST use the product SEO description, then the product short description as plain text. A tag with no value MUST NOT be printed.

#### Scenario: SEO description set
- **WHEN** a published product has an SEO description
- **THEN** the page head contains a meta description with that text

#### Scenario: SEO description empty
- **WHEN** a product has no SEO description but has a short description
- **THEN** the meta description holds the short description with HTML tags removed

#### Scenario: Nothing to print
- **WHEN** a product has no SEO description, no short description and no keywords
- **THEN** no meta description tag and no meta keywords tag are printed

### Requirement: Document title
The single product page SHALL use the product SEO title as the document title. When the SEO title is empty, it SHALL use the product title followed by the site name.

#### Scenario: SEO title set
- **WHEN** a product has an SEO title
- **THEN** the document title is that SEO title

#### Scenario: SEO title empty
- **WHEN** a product has no SEO title
- **THEN** the document title is the product title and the site name

### Requirement: Canonical link
The single product page SHALL print exactly one canonical link. Its value MUST be the absolute product URL built from the product slug, without query string or preview parameters.

#### Scenario: Normal visit
- **WHEN** a visitor opens a published product page
- **THEN** the head contains one canonical link equal to the product URL

#### Scenario: Preview or tracking parameters
- **WHEN** the request URL has preview, nonce or tracking query parameters
- **THEN** the canonical link still holds the clean product URL

### Requirement: Robots directive
The single product page SHALL tell search engines not to index a product whose status is not published or that is opened through a preview link. A published product opened normally MUST NOT receive a `noindex` directive from this plugin.

#### Scenario: Preview of a draft product
- **WHEN** a draft product is opened with a valid preview link
- **THEN** the robots directive contains `noindex`

#### Scenario: Published product
- **WHEN** a published product is opened normally
- **THEN** the plugin adds no `noindex` directive

### Requirement: Output can be changed or disabled
The plugin SHALL let themes and other plugins change the printed values and switch off the SEO head output, so that an SEO plugin does not cause duplicate tags.

#### Scenario: Output disabled
- **WHEN** a site code disables the SEO head output
- **THEN** the product page prints none of the tags of this capability, of `storefront-social-meta`, or of `product-structured-data`
