## Purpose

Guarantees that assigning a value to a model attribute — directly, through `fill()`, or through mass assignment on create/update — actually persists that value to the database, for every field on `Customer`, `OrderItem`, `ProductSchema`, `Product`, `Coupon`, and `Order` covered by this change.

## ADDED Requirements

### Requirement: Array/JSON attributes persist on save
Assigning an array value to `Customer.tags`, `OrderItem.product_data`, `OrderItem.tax_breakdown`, `ProductSchema.schema`, `Product.additional_info`, `Product.seo_keywords`, `Coupon.target_countries`, or `Coupon.combinations` SHALL result in that value being written to the corresponding database column when the model is saved, and reading the model back SHALL return an equivalent array.

#### Scenario: Creating a customer with tags
- **WHEN** a `Customer` is created with `tags` set to a non-empty array
- **THEN** the saved row's `tags` column contains the JSON-encoded array
- **AND** re-fetching the customer returns `tags` as the same array

#### Scenario: Updating an order item's product data
- **WHEN** an existing `OrderItem` has `product_data` (or `tax_breakdown`) reassigned to a new non-empty array and saved
- **THEN** the updated row reflects the new array, not the previous value or `NULL`

#### Scenario: Creating a product schema
- **WHEN** a `ProductSchema` is created with `schema` set to a non-empty array
- **THEN** the saved row's `schema` column contains the JSON-encoded array

#### Scenario: Creating a product with additional info and SEO keywords
- **WHEN** a `Product` is created with `additional_info` and `seo_keywords` set to non-empty arrays
- **THEN** both columns are persisted and readable back as arrays

#### Scenario: Creating a coupon with target countries and combinations
- **WHEN** a `Coupon` is created with `target_countries` and `combinations` set to non-empty arrays
- **THEN** both columns are persisted and readable back as arrays

### Requirement: Empty array assignment persists as an empty JSON array
Assigning an empty array (`[]`) to any field listed in "Array/JSON attributes persist on save" SHALL persist as a valid empty JSON array, and reading the model back SHALL return an empty array (`[]`), not `null`.

#### Scenario: Assigning an empty array
- **WHEN** any of the array/JSON fields listed above is assigned `[]` and the model is saved
- **THEN** the field reads back as `[]` on the next fetch (not `null`)

### Requirement: Order flags persist on save
Assigning an array or string value to `Order.flags` SHALL result in that value being written to the `flags` column when the order is saved, and reading the order back SHALL expose the same set of flags.

#### Scenario: Creating an order with flags
- **WHEN** an `Order` is created with `flags` set to a non-empty array of strings
- **THEN** the saved row's `flags` column is non-null
- **AND** re-fetching the order returns the same flags

#### Scenario: Clearing an order's flags
- **WHEN** an existing `Order` with flags has `flags` reassigned to an empty array or `null` and saved
- **THEN** the saved row's `flags` column is `null`
