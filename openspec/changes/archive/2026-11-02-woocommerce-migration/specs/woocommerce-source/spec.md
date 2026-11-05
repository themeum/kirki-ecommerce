## Purpose
Defines how WooCommerce and its extension plugins are detected, which versions and storage layouts are supported, and how WooCommerce data maps to Kirki records.

## ADDED Requirements

### Requirement: WooCommerce detection

The system SHALL offer migration only when WooCommerce is installed and has data in its tables. The detection SHALL NOT depend on WooCommerce being active.

#### Scenario: WooCommerce missing

- **WHEN** WooCommerce is not installed
- **THEN** no migration entry point is shown

### Requirement: Minimum supported version

The system SHALL define a minimum supported WooCommerce version. If the installed version is lower, the system SHALL NOT offer migration and SHALL tell the merchant to update WooCommerce first. For a supported version, the system SHALL choose how to read data from the tables and columns that exist, not from the version number.

#### Scenario: Old version

- **WHEN** the installed WooCommerce version is lower than the minimum
- **THEN** the merchant sees a message that names the minimum version and no groups are offered

### Requirement: Both order storage layouts are supported

The system SHALL read orders from legacy post storage and from high-performance order storage. It SHALL use the layout that WooCommerce uses as the source of truth. Both layouts SHALL give the same mapped result for the same order.

#### Scenario: HPOS store

- **WHEN** the store uses high-performance order storage as the source of truth
- **THEN** orders are read from the order tables and the order count in the scan matches

#### Scenario: Legacy store

- **WHEN** the store uses post storage for orders
- **THEN** orders are read from posts and meta and the order count in the scan matches

### Requirement: Extension plugins are detected and reported

The system SHALL detect known WooCommerce extension plugins and list them in the scan. Each listed extension SHALL show whether its data is migrated or not migrated. Extensions with no matching Kirki feature SHALL be shown as not migrated, and their data SHALL be ignored.

#### Scenario: Subscriptions installed

- **WHEN** WooCommerce Subscriptions is installed
- **THEN** the scan lists it as not migrated and subscription records are not imported

### Requirement: SEO plugin fields

When a supported SEO plugin is detected, the system SHALL map its product title and description fields to the Kirki product SEO fields.

#### Scenario: Yoast SEO data

- **WHEN** a product has a Yoast SEO title and description
- **THEN** the migrated product has the same SEO title and description

### Requirement: Catalog mapping

The system SHALL migrate product categories (with their parent relation), tags, brands, global attributes with their values, and products. Simple and variable products SHALL be migrated, with variations as variants. Product fields SHALL include name, slug, description, status, SKU, prices, sale price and sale dates, stock settings, weight and dimensions, images, categories, tags and brand. Product images SHALL point to the existing WordPress attachments and SHALL NOT be copied.

#### Scenario: Variable product

- **WHEN** a variable product has 6 variations
- **THEN** one Kirki product with 6 variants is created, each with its own SKU, price, stock and attribute values

#### Scenario: Category tree

- **WHEN** a category has a parent category
- **THEN** the migrated category has the migrated parent as its parent

#### Scenario: Unsupported product type

- **WHEN** a product has a type that Kirki cannot represent
- **THEN** the product is skipped and appears in the report with the reason

### Requirement: Customer mapping

The system SHALL migrate registered customers with billing and shipping addresses and link each to the existing WordPress user. Guest customers SHALL be created from order billing data by email.

#### Scenario: Registered customer

- **WHEN** a customer has a WordPress account
- **THEN** the Kirki customer is linked to that same account and no password is read

#### Scenario: Guest order

- **WHEN** an order has no customer account
- **THEN** a guest customer is created from the order billing email, once for each email

### Requirement: Coupon mapping

The system SHALL migrate coupons with code, discount type and amount, expiry, usage limits, minimum and maximum spend, product and category restrictions, and email restrictions. A discount type that Kirki cannot represent SHALL cause the coupon to be skipped and reported.

#### Scenario: Percentage coupon

- **WHEN** a percentage coupon with a limit of 100 uses is migrated
- **THEN** the Kirki coupon has the same code, percentage and usage limit

### Requirement: Order mapping

The system SHALL migrate orders with status, currency, totals, tax and shipping amounts, billing and shipping addresses, payment method and transaction id, customer note, original dates, line items, fee lines, shipping lines, tax lines, coupon lines, order notes and refunds. Source order statuses SHALL be mapped to the nearest Kirki status. The original order number SHALL be kept.

#### Scenario: Order with product and variation

- **WHEN** an order has one line for a simple product and one for a variation
- **THEN** both lines are created and point to the migrated product and the migrated variant

#### Scenario: Unknown status

- **WHEN** an order has a status with no Kirki equivalent
- **THEN** the order is created with the closest Kirki status and the mapping is shown in the report

### Requirement: Settings mapping

The system SHALL migrate currency, store address, tax rates and shipping zones with their methods where Kirki has a matching setting. It SHALL NOT overwrite a Kirki setting that the merchant has already set during onboarding without showing it as a change in the report.

#### Scenario: Tax rates

- **WHEN** WooCommerce has tax rates for several countries
- **THEN** Kirki tax regions with the same rates are created
