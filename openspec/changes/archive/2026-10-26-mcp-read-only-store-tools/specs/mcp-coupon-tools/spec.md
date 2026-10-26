## Purpose

Defines the MCP tool that lists coupons with their status, value and usage, so
that an AI client can tell which offers run now and which are near their
limit.

## ADDED Requirements

### Requirement: Find coupons tool

`kirki-ecommerce-find-coupons` SHALL accept `search` (code or title),
`status` (`active`, `scheduled`, `inactive`, `expired`), `method` (`code` or
`automatic`), `discount_type` (the admin coupon list values), `page` and
`per_page`, with the same filter rules as the admin coupon list. Each coupon
SHALL have its ID, code or title, method, discount type, value (a fixed
amount in the base currency or a percentage), status, start and end date,
usage count, usage limit and limit per customer. The `kirki-ecommerce` server
SHALL list the tool.

#### Scenario: Active coupons

- **WHEN** the store has 2 active and 1 expired coupons and the tool is called with `status` `active`
- **THEN** the result has the 2 active coupons

#### Scenario: Coupon near its limit

- **WHEN** a coupon has a usage limit of 100 and was used 97 times
- **THEN** the tool shows usage count 97 and usage limit 100 for that coupon

#### Scenario: Unknown method

- **WHEN** the tool is called with `method` `manual`
- **THEN** the call returns a tool error that names `method`
