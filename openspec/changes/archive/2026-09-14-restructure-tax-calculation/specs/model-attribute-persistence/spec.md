## MODIFIED Requirements

### Requirement: Array/JSON attributes persist on save
Assigning an array value to `Customer.tags`, `OrderItem.product_data`,
`ProductSchema.schema`, `Product.additional_info`, `Product.seo_keywords`,
`Coupon.target_countries`, or `Coupon.combinations` SHALL result in that
value being written to the corresponding database column when the model is
saved, and reading the model back SHALL return an equivalent array.

`OrderItem.tax_breakdown` is no longer a covered field: the column is
removed, and an order item's tax breakdown is read from its recorded tax
lines instead of an array/JSON attribute on `OrderItem`.

#### Scenario: Creating a customer with tags
- **WHEN** a `Customer` is created with `tags` set to a non-empty array
- **THEN** the saved row's `tags` column contains the JSON-encoded array
- **AND** re-fetching the customer returns `tags` as the same array

#### Scenario: Updating an order item's product data
- **WHEN** an existing `OrderItem` has `product_data` reassigned to a new
  non-empty array and saved
- **THEN** the updated row reflects the new array, not the previous value or
  `NULL`

#### Scenario: Creating a product schema
- **WHEN** a `ProductSchema` is created with `schema` set to a non-empty array
- **THEN** the saved row's `schema` column contains the JSON-encoded array

#### Scenario: Creating a product with additional info and SEO keywords
- **WHEN** a `Product` is created with `additional_info` and `seo_keywords` set to non-empty arrays
- **THEN** both columns are persisted and readable back as arrays

#### Scenario: Creating a coupon with target countries and combinations
- **WHEN** a `Coupon` is created with `target_countries` and `combinations` set to non-empty arrays
- **THEN** both columns are persisted and readable back as arrays
