# mcp-sales-report Specification

## Purpose

Defines the MCP tool that gives the sales of the store for a date range, so an
AI client can answer questions such as "give me sales for the last 7 days"
with the same numbers as the Analytics page.

## Requirements

### Requirement: Tool identity

The tool SHALL be named `kirki-ecommerce-sales-report` for MCP clients. It
SHALL be marked read-only and idempotent. Its description SHALL tell the
client how to map phrases such as "last 7 days" or "this month" to the range
argument. It SHALL be reachable only through the `kirki-ecommerce` server,
not through the MCP Adapter's default server or the Abilities REST API.

#### Scenario: Tool annotations

- **WHEN** a client lists the tools of the `kirki-ecommerce` server
- **THEN** the sales report tool has `readOnlyHint` true and `idempotentHint` true

### Requirement: Only administrators can run the tool

The tool SHALL run only for a user with the `manage_options` capability, over
HTTP and over STDIO.

#### Scenario: Editor is rejected

- **WHEN** a user with the `editor` role calls the tool
- **THEN** the call is rejected with a permission error and no query runs

#### Scenario: No signed-in user is rejected

- **WHEN** the tool is called with no signed-in user
- **THEN** the call is rejected with a permission error

#### Scenario: Not offered to other servers

- **WHEN** a client lists the abilities of the MCP Adapter's default server
- **THEN** the sales report ability is not in the list

### Requirement: Range argument

The tool SHALL accept a `range` argument with one of these values: `today`,
`yesterday`, `last_7`, `last_30`, `last_90`, `last_12_months`,
`month_to_date`, `year_to_date`, `custom`. When `range` is missing, it SHALL
be `last_30`. When `range` is `custom`, the tool SHALL need `from` and `to`
in the `Y-m-d` format. Each preset SHALL resolve to the same first and last
day as the Analytics page (spec `analytics-metrics`, "Date range presets").

#### Scenario: Last 7 days

- **WHEN** today is Oct 26, 2026 in the site time zone and the tool is called with `range` `last_7`
- **THEN** the report range is Oct 20 – Oct 26, 2026 and `days` is 7

#### Scenario: No range

- **WHEN** today is Oct 26, 2026 and the tool is called with no arguments
- **THEN** the report range is Sep 27 – Oct 26, 2026

#### Scenario: Custom range

- **WHEN** the tool is called with `range` `custom`, `from` `2026-09-01` and `to` `2026-09-30`
- **THEN** the report range is Sep 1 – Sep 30, 2026

### Requirement: Comparison is opt-in

The tool SHALL accept an optional `compare` argument with one of these values:
`previous_period`, `previous_year`, `custom`, `none`. When `compare` is
missing, there SHALL be no comparison. When `compare` is `custom`, the tool
SHALL need `compare_from` and `compare_to` in the `Y-m-d` format. A
comparison range SHALL be resolved as on the Analytics page (spec
`analytics-metrics`, "Comparison range").

#### Scenario: No comparison by default

- **WHEN** the tool is called with `range` `last_7` and no `compare`
- **THEN** `compare` in the report is null, and every `previous` value and every `change` is null

#### Scenario: Previous period when asked

- **WHEN** today is Oct 26, 2026 and the tool is called with `range` `last_7` and `compare` `previous_period`
- **THEN** the comparison range is Oct 13 – Oct 19, 2026, and each total has its previous value and its change

### Requirement: Argument validation

The tool SHALL reject a call, with a tool error that names the wrong argument
and does not run any query, when:

- `range` or `compare` has a value that is not in its list;
- `range` is `custom` and `from` or `to` is missing or is not a valid `Y-m-d` date;
- `to` is after today in the site time zone;
- `from` is after `to`;
- `compare` is `custom` and `compare_from` or `compare_to` is missing or is not a valid `Y-m-d` date;
- `compare_from` is after `compare_to`.

#### Scenario: Future end date

- **WHEN** today is Oct 26, 2026 and the tool is called with `range` `custom`, `from` `2026-10-01` and `to` `2026-10-30`
- **THEN** the tool returns an error that says the end date cannot be after today

#### Scenario: Missing custom dates

- **WHEN** the tool is called with `range` `custom` and no `from`
- **THEN** the tool returns an error that asks for a start date

#### Scenario: Unknown preset

- **WHEN** the tool is called with `range` `last_week`
- **THEN** the tool returns an error and no report

### Requirement: Report content

A successful call SHALL return structured content with:

- `range`: `preset`, `from`, `to`, `days`;
- `compare`: `from` and `to`, or null;
- `granularity`: `day`, `week` or `month`, chosen as on the Analytics page;
- `time_zone`: the time zone used to put orders on days;
- `currency`: the store base currency code;
- `has_orders`: whether the store has any order at all;
- `totals`: `gross_sales`, `discounts`, `returns`, `net_sales`, `shipping`,
  `taxes`, `total_sales`, `average_order_value` as money values, and
  `orders`, `items_ordered`, `customers`, `new_customers` as counts. Each
  total SHALL have `current`, `previous` and `change`;
- `series`: one point for each day, week or month of the range, with `date`,
  `label`, `total_sales` and `orders`, and with `previous_date`,
  `previous_total_sales` and `previous_orders` when there is a comparison.

Each money value SHALL be the decimal amount, a formatted display string, and
the currency code. Every number SHALL follow the rules of the
`analytics-metrics` spec, so for the same range and comparison it SHALL be
equal to the number on the Analytics page.

#### Scenario: Same as the Analytics page

- **WHEN** the tool is called with `range` `last_30` and the Analytics page shows Last 30 days in the same time zone
- **THEN** every total in the report is equal to the matching number on the page

#### Scenario: Only sales orders count

- **WHEN** in the range there is one paid order with `base_total` 5000 and one unpaid order with `base_total` 3000
- **THEN** `total_sales.current` is 50.00 and `orders.current` is 2

#### Scenario: Empty range

- **WHEN** the store has orders but none in the range
- **THEN** every money total is 0, every count is 0, `has_orders` is true, and the series has one point for each bucket with zero values

### Requirement: Site time zone

The tool SHALL put orders on days in the site time zone. Only when the HTTP
request carries a valid `X-Kecom-Timezone` header SHALL that time zone be used
instead, as for the admin REST API.

#### Scenario: Late order

- **WHEN** the site time zone is Asia/Dhaka, the request has no `X-Kecom-Timezone` header, and an order is paid at 2026-10-01 20:30 UTC
- **THEN** the report counts it on Oct 2 and `time_zone` is Asia/Dhaka
