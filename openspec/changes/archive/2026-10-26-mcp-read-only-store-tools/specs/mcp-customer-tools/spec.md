## Purpose

Defines the MCP tool that finds customers with their order count, total spent
and last order date, so that an AI client can find a customer or a group of
customers fast.

## ADDED Requirements

### Requirement: Find customers tool

`kirki-ecommerce-find-customers` SHALL accept `search` (name, email or phone,
as in the admin customer list), `country` and `city` (of the default shipping
address, as in the admin customer list), `sort_by` (`created_at`,
`orders_count`, `base_amount_spent` or `last_order_date`, default
`created_at`), `sort_order` (`asc` or `desc`, default `desc`), `page` and
`per_page`. Each
customer SHALL have the customer ID, masked email, first name, country, order
count, total spent in the base currency, last order date, `accepts_marketing`
and creation date. The total spent SHALL count the same orders as the admin
customer list. The `kirki-ecommerce` server SHALL list the tool.

#### Scenario: Best customers first

- **WHEN** the tool is called with `sort_by` `base_amount_spent`
- **THEN** the customer with the highest total spent is first

#### Scenario: Customers in one country

- **WHEN** the tool is called with `country` `DE`
- **THEN** the result has only customers whose default shipping address is in Germany

#### Scenario: Masked data

- **WHEN** the tool returns the customer Jane Doe, `jane@example.com`, phone `+15550100`
- **THEN** the customer shows `j***@example.com` and `Jane`, and the result has no phone number
