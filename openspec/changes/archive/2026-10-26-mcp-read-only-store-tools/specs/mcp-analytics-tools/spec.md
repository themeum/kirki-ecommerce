## Purpose

Defines the MCP tools that give sales over time, the best-selling products and
categories, and sales split by one dimension, with the same numbers as the
Analytics page, so that an AI client can answer trend and "what sells"
questions.

## ADDED Requirements

### Requirement: Analytics tools use the sales report range arguments

`kirki-ecommerce-sales-trend`, `kirki-ecommerce-product-performance` and
`kirki-ecommerce-sales-breakdown` SHALL accept the same `range`, `from`, `to`,
`compare`, `compare_from` and `compare_to` arguments as the sales report tool,
with the same default (`last_30`), the same validation, and the same days for
each preset. There SHALL be no comparison when `compare` is left out. Each
result SHALL have `range`, `compare`, `time_zone`, `currency` and
`has_orders`. The `kirki-ecommerce` server SHALL list the three tools.

#### Scenario: Same range as the sales report

- **WHEN** today is Oct 26, 2026 and `kirki-ecommerce-sales-trend` is called with `range` `last_7`
- **THEN** the result range is Oct 20 – Oct 26, 2026 and `compare` is null

#### Scenario: End date after today

- **WHEN** `kirki-ecommerce-product-performance` is called with `range` `custom`, `from` 2026-10-01 and `to` 2026-11-01, and today is Oct 26, 2026
- **THEN** the call returns a tool error that names `to` and no query runs

### Requirement: Sales trend tool

`kirki-ecommerce-sales-trend` SHALL return `granularity` and a `series` with
one point for each day, week or month of the range, by the Analytics page
rules. Each point SHALL have `date`, `label`, `total_sales`, `orders` and
`average_order_value`. With a comparison, each point SHALL also have
`previous_date`, `previous_total_sales`, `previous_orders` and
`previous_average_order_value`. The result SHALL also have the range totals
of total sales, orders and average order value, with `previous` and `change`.
The numbers SHALL equal the Total sales, Orders and Average order value cards
of the Analytics page for the same range and time zone.

#### Scenario: Daily series

- **WHEN** `kirki-ecommerce-sales-trend` is called with `range` `last_7`
- **THEN** `granularity` is `day` and the series has 7 points, one for each day from Oct 20 to Oct 26, 2026

#### Scenario: Same numbers as the Analytics page

- **WHEN** paid orders of 100.00 on Oct 21 and 50.00 on Oct 23 exist and the tool is called with `range` `last_7`
- **THEN** the point for Oct 21 has `total_sales` 100.0 and `orders` 1, and the range total sales is 150.00

### Requirement: Product performance tool

`kirki-ecommerce-product-performance` SHALL accept `by` with the value
`product` (default) or `category`, and `limit`, an integer from 1 to 25. When
`limit` is left out, it SHALL be 5 for products and 6 for categories, as on
the Analytics page. For products, each row SHALL have the product ID, name,
units sold, net sales, availability status, and `is_deleted` for a product
that no longer exists. For categories, each row SHALL have the category name
and net sales. With a comparison, each row SHALL have the previous net sales
and the change. Rows SHALL be in the Analytics page order (highest net sales
first). The Analytics page SHALL keep its fixed limits.

#### Scenario: Top 10 products

- **WHEN** 12 products have sales in the range and the tool is called with `limit` 10
- **THEN** the result has 10 product rows, highest net sales first

#### Scenario: Default category limit

- **WHEN** 8 categories have sales and the tool is called with `by` `category` and no `limit`
- **THEN** the result has 6 category rows

#### Scenario: Limit over the maximum

- **WHEN** the tool is called with `limit` 100
- **THEN** the call returns a tool error that names `limit`

### Requirement: Sales breakdown tool

`kirki-ecommerce-sales-breakdown` SHALL need `by` with one of these values:
`coupon`, `payment_method`, `shipping_method`, `country`, `region`,
`tax_region`. When `by` is `region`, the tool SHALL need `country` as an
ISO 3166-1 alpha-2 code and SHALL return the regions of that country. The
tool SHALL accept `limit` from 1 to 25 for `coupon`, `payment_method`,
`shipping_method` and `tax_region`, with a default of 5. Each row SHALL have
the same values as the matching Analytics page card (for example, orders and
discount given for a coupon; sales, orders and customers for a country). With
a comparison, each row SHALL have its previous value and change where the
Analytics page card has them.

#### Scenario: Sales by coupon

- **WHEN** the codes SAVE10 and WELCOME were used on paid orders in the range and the tool is called with `by` `coupon`
- **THEN** the result has one row for each code with its order count and discount given

#### Scenario: Regions need a country

- **WHEN** the tool is called with `by` `region` and no `country`
- **THEN** the call returns a tool error that names `country`

#### Scenario: Regions of one country

- **WHEN** the tool is called with `by` `region` and `country` `US`
- **THEN** each row is a state of the United States with its sales, orders and customers
