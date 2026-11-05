# mcp-catalog-tools Specification

## Purpose

Defines the MCP tools that find products and list stock levels by variant, so
that an AI client can answer "which shoes are out of stock?" and "what must I
reorder?".

## Requirements

### Requirement: Find products tool

`kirki-ecommerce-find-products` SHALL accept `search`, `status` (`draft`,
`published`, `scheduled`, `trashed`), `availability_status` (`in_stock`,
`low_stock`, `out_of_stock`, `partially_stocked`), `category_ids`,
`brand_id`, `collection_id`, `page` and `per_page`, with the same filter
rules as the admin product list. When `status` is left out, trashed products
SHALL NOT be in the result. Each product SHALL have its ID, title, status,
availability status, price range in the base currency, variant count, total
available quantity of tracked variants, and categories by name. The
`kirki-ecommerce` server SHALL list the tool.

#### Scenario: Out-of-stock published products

- **WHEN** the tool is called with `status` `published` and `availability_status` `out_of_stock`
- **THEN** the result has only published products whose availability status is out of stock

#### Scenario: Trashed products are hidden by default

- **WHEN** one product is trashed and the tool is called with no `status`
- **THEN** the trashed product is not in the result

### Requirement: Stock levels tool

`kirki-ecommerce-stock-levels` SHALL accept `status` with the value
`out_of_stock`, `low_stock` or `attention` (default, which means both),
`page` and `per_page`. It SHALL return the counts of out-of-stock, low-stock
and in-stock variants, and a list of the variants with the requested status,
lowest available quantity first. Each variant SHALL have the variant ID,
product ID, product name, variant name, SKU, available quantity, low-stock
threshold that applies, and status. The status and the threshold SHALL follow
the rules of the Inventory health card: a variant threshold overrides the
store default, and a variant that does not track inventory is never low or
out of stock by quantity. The Inventory health card SHALL keep showing its 4
lowest variants. The `kirki-ecommerce` server SHALL list the tool.

#### Scenario: Full low-stock list

- **WHEN** 9 tracked variants are low on stock and the tool is called with `status` `low_stock`
- **THEN** the result has the 9 variants, lowest quantity first, and the counts match the Inventory health card

#### Scenario: Variant threshold overrides the store default

- **WHEN** the store default threshold is 5, a variant has threshold 10 and 8 in stock
- **THEN** the tool lists the variant as low on stock with threshold 10

#### Scenario: Unknown status

- **WHEN** the tool is called with `status` `empty`
- **THEN** the call returns a tool error that names `status`
