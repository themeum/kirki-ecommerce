## Purpose

Defines where the plugin reads its industry and location presets and its sample
products from: a remote, static S3 location instead of a file bundled in the plugin,
with a fixed layout, a trusted-host rule, and defined behavior when a read fails.

## ADDED Requirements

### Requirement: Preset data is read from a remote base URL

The plugin SHALL read the preset data and the sample product data from one remote
base URL. The base URL SHALL have a default that the plugin defines, and a site
SHALL be able to override it with a constant in `wp-config.php`. The plugin SHALL NOT
read preset data from a file inside its own directory.

#### Scenario: Default base URL

- **WHEN** `wp-config.php` does not define the base-URL constant
- **THEN** the plugin reads the preset data from the default base URL

#### Scenario: Override in wp-config.php

- **WHEN** `wp-config.php` defines the base-URL constant
- **THEN** the plugin reads the preset data from that URL, and not from the default

#### Scenario: No bundled data file

- **WHEN** the plugin applies the store presets
- **THEN** it makes a request to the base URL and reads no preset file from the plugin directory

### Requirement: Remote layout

The data under the base URL SHALL use this layout:

- `{base}/presets.json` holds the common presets, the trade blocs, the countries and
  the industries. Each industry holds its attributes, shipping profiles, shipping
  rules and tax profiles. It holds no categories and no tags.
- `{base}/{industry-slug}/products.json` holds the categories, the tags and the
  sample products of one industry.
- `{base}/other/products.json` holds the sample data for a store whose industry is
  "other" or has no products file.
- `{base}/{industry-slug}/images/{filename}` holds the images of that industry's
  products. A product names its images by filename only.

#### Scenario: Presets URL

- **WHEN** the base URL is `https://example.com/preconfigured-data`
- **THEN** the plugin reads the presets from `https://example.com/preconfigured-data/presets.json`

#### Scenario: Products URL

- **WHEN** the store industry is `pet-supplies` and sample data is loaded
- **THEN** the plugin reads the products from `{base}/pet-supplies/products.json`

#### Scenario: Image URL

- **WHEN** a product in `fashion-and-apparel` names the image `linen-shirt-coral.jpg`
- **THEN** the plugin downloads the image from `{base}/fashion-and-apparel/images/linen-shirt-coral.jpg`

### Requirement: Only trusted URLs are requested

The plugin SHALL request a URL only when it uses HTTPS, or when it uses plain HTTP
and its host is `localhost`, `127.0.0.1`, `host.docker.internal` or ends in `.test`.
A base URL that fails this rule SHALL be handled as a failed read.

#### Scenario: HTTPS base URL

- **WHEN** the base URL is an `https://` URL
- **THEN** the plugin makes the request

#### Scenario: Local HTTP base URL

- **WHEN** the base URL is `http://host.docker.internal:9000/kirki-ecommerce/preconfigured-data`
- **THEN** the plugin makes the request

#### Scenario: Remote HTTP base URL

- **WHEN** the base URL is `http://example.com/preconfigured-data`
- **THEN** the plugin makes no request and handles the read as failed

### Requirement: Data version

`presets.json` and each `products.json` SHALL carry a `version` number. The plugin
SHALL accept only the versions that it supports. A file with a missing or an
unsupported version SHALL be handled as a failed read.

#### Scenario: Supported version

- **WHEN** `presets.json` has a version that the plugin supports
- **THEN** the plugin uses the data

#### Scenario: Newer version

- **WHEN** `presets.json` has a version that the plugin does not support
- **THEN** the plugin handles the read as failed and writes no preset

### Requirement: Failed preset read during store setup

When the presets cannot be read during store setup (network error, non-success
status, invalid JSON, untrusted URL or unsupported version), the plugin SHALL log a
warning, write no preset record, mark the presets as applied, and complete store
setup. The plugin SHALL NOT try to read the presets again for that store.

#### Scenario: S3 is not reachable

- **WHEN** the merchant completes the onboarding wizard and the presets request times out
- **THEN** store setup succeeds, no attributes, profiles, zones, tax regions or legal pages are created from presets, and a warning is logged

#### Scenario: No retry after a failed read

- **WHEN** the presets read failed during store setup and store setup runs again
- **THEN** the plugin makes no presets request, because the presets count as applied

### Requirement: Failed product read during sample data loading

Sample data loading reads the products file and `presets.json` (for the attribute
definitions). When either cannot be read, the sample data request SHALL fail with an
error message and SHALL create no category, tag, product or coupon. When one image
cannot be downloaded, the product SHALL still be created, without that image.

#### Scenario: Products file not reachable

- **WHEN** the merchant loads sample data and the products request fails
- **THEN** the response is an error, and no category, tag, product or coupon is created

#### Scenario: One image fails

- **WHEN** one of the four images of a product returns a 404
- **THEN** the product is created with the other three images
