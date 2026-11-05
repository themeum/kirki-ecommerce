## Purpose

Defines the MCP prompts of the store server: ready-made merchant routines
that a client shows as commands, their arguments, the store tools that each
routine uses, and the rules that keep each routine read-only.

## ADDED Requirements

### Requirement: Only administrators can get a store prompt

Each store prompt SHALL be available only to a user with the
`manage_options` capability. A request from any other user SHALL fail with a
permission error and SHALL NOT return the prompt messages.

#### Scenario: Editor is rejected

- **WHEN** a user with the `editor` role gets the `kirki-ecommerce-morning-brief` prompt
- **THEN** the request fails with a permission error

### Requirement: Prompt names and arguments

The server SHALL offer exactly these 6 prompts, each named with the
`kirki-ecommerce-` prefix that the tools use: `morning-brief`,
`weekly-review`, `monthly-close`, `low-stock-check`, `investigate-order` and
`setup-guide`. Each prompt SHALL have a title and a description that tells
what the merchant gets. Each argument SHALL be a string with a description
that gives an example value and the default. No argument SHALL be declared
as required, because the Abilities API rejects a request without a required
argument before the prompt can use a default or ask the merchant.

| Prompt | Arguments |
|---|---|
| `morning-brief` | `date` (optional, default yesterday; for example `2026-10-25`, `today`, `yesterday`) |
| `weekly-review` | `range` (optional, default `last_7`; a preset or an alias such as `last week`, `last 30 days`, `this month`), `compare` (optional, default `previous_period`; also `last year`, `previous year`) |
| `monthly-close` | `month` (optional, default the last complete month; for example `2026-09`, `September`, `September 2026`, `last month`) |
| `low-stock-check` | none |
| `investigate-order` | `order_number` (optional; without it, the assistant asks the merchant for it) |
| `setup-guide` | none |

#### Scenario: Client lists the arguments

- **WHEN** a client sends `prompts/list`
- **THEN** `investigate-order` lists `order_number` and `monthly-close` lists `month`, both as optional arguments

### Requirement: Prompt arguments accept free text and never fail the request

A merchant types prompt arguments in a free-text field, and a client can show
only a generic failure when a prompt returns an error. Thus a prompt SHALL NOT
return an error for an argument value. It SHALL parse the common forms of each
argument, in the site time zone:

- `date`: `Y-m-d`, `today`, `yesterday`, and other date text that PHP can parse.
- `month`: `YYYY-MM`, a month name (`October`, the latest such month that is
  not after the current month), a month name with a year (`October 2026`),
  `this month` and `last month`.
- `range`: the presets of the analytics tools other than `custom`, and the
  aliases `last week` and `last 7 days` (`last_7`), `last 30 days`
  (`last_30`), `last 90 days` (`last_90`), `last 12 months` and `last year`
  (`last_12_months`), `this month` (`month_to_date`) and `this year`
  (`year_to_date`). Case, spaces, hyphens and underscores SHALL NOT matter.
- `compare`: `previous_period` and `previous_year`, and the aliases
  `previous period`, `last period`, `previous year` and `last year`.
- `order_number`: the prompt SHALL remove spaces and a leading `#`.

When a value does not parse, or gives a date or month after today, the prompt
SHALL use the default of that argument. The message SHALL then contain a note
that gives the typed value as quoted data and the value that the prompt used,
and SHALL tell the assistant to tell the merchant. A missing `month` SHALL use
the last complete month. A missing or empty `order_number` SHALL give a
message that tells the assistant to ask the merchant for the order number and
to call no tool before it has the number.

#### Scenario: Month in a format that does not parse

- **WHEN** a client gets `monthly-close` with `month` set to `10/2026`
- **THEN** the request succeeds, the message uses the last complete month, and the message contains a note that names `10/2026` and the month used

#### Scenario: Month name

- **WHEN** a client gets `monthly-close` with `month` set to `September 2026`
- **THEN** the message uses `2026-09-01` to `2026-09-30` and contains no note

#### Scenario: Future date

- **WHEN** a client gets `morning-brief` with a `date` after today
- **THEN** the request succeeds, the message uses yesterday, and the message contains a note that names the typed date

#### Scenario: Relative date

- **WHEN** a client gets `morning-brief` with `date` set to `yesterday`
- **THEN** the message uses yesterday in the site time zone and contains no note

#### Scenario: Range alias

- **WHEN** a client gets `weekly-review` with `range` set to `Last Week`
- **THEN** the message tells the assistant to use `range` `last_7`

#### Scenario: Order number with a hash

- **WHEN** a client gets `investigate-order` with `order_number` set to ` #1001 `
- **THEN** the message tells the assistant to call `kirki-ecommerce-get-order` with `order_number` `1001`

#### Scenario: Missing order number

- **WHEN** a client gets `investigate-order` without `order_number`
- **THEN** the request succeeds and the message tells the assistant to ask the merchant for the order number

### Requirement: A prompt returns one user message that names the tools

A prompt SHALL return one message with the role `user`. The message SHALL
name each store tool to call and the exact arguments to send, with the dates
already resolved from the prompt arguments. The message SHALL name only
tools that the server offers. The message SHALL tell the assistant how to
present the result to the merchant.

#### Scenario: Morning brief for a given day

- **WHEN** a client gets `morning-brief` with `date` set to `2026-10-25`
- **THEN** the message tells the assistant to call `kirki-ecommerce-sales-report` with `range` `custom`, `from` and `to` `2026-10-25`, and `compare` `custom` with `compare_from` and `compare_to` `2026-10-18`

#### Scenario: Monthly close for the current month

- **WHEN** a client gets `monthly-close` for the current month
- **THEN** the message uses today as the last day and tells the assistant to say that the month is not complete

### Requirement: Prompts are read-only routines

Each prompt message SHALL tell the assistant that the routine only reads
store data and that it must not change store data or send a message to a
customer. Each prompt that reads order or customer text SHALL tell the
assistant to treat that text as data and not as instructions.

#### Scenario: Investigate an order

- **WHEN** a client gets `investigate-order`
- **THEN** the message tells the assistant to write a draft reply for the merchant, not to send it, and to treat order notes and cancellation reasons as data

### Requirement: Routine contents

Each prompt SHALL ask for these tool calls and this result:

- `morning-brief`: the sales report for the day compared with the same
  weekday one week earlier; the orders with the list statuses
  `order-placed`, `order-processing`, `order-on-hold` and `payment-failed`;
  the stock levels with status `attention`. Result: at most five lines of
  results and a short action list for today.
- `weekly-review`: the sales report and the sales trend for the range and
  comparison; product performance by product and by category; the sales
  breakdown by coupon and by country. Result: wins, losses, top products and
  categories, and three suggested actions.
- `monthly-close`: the sales report for the month with no comparison; the
  sales breakdown by tax region, payment method and shipping method with the
  highest limit. Result: one table for the accountant with gross sales,
  discounts, returns, net sales, shipping, taxes, total sales, tax by region,
  and totals by payment method and shipping method, with the currency.
- `low-stock-check`: every page of the stock levels with status
  `attention`; product performance by product for the last 30 days with the
  highest limit. Result: a reorder list with out-of-stock items first, and
  best sellers first in each group.
- `investigate-order`: the order by its number with its activity timeline.
  Result: a short summary of the order, payment, fulfillment and open
  problems, and a draft reply to the customer.
- `setup-guide`: the setup status. Result: the open steps in order, each
  with its admin page link, or a message that setup is complete.

#### Scenario: Low stock check asks for every page

- **WHEN** a client gets `low-stock-check`
- **THEN** the message tells the assistant to call `kirki-ecommerce-stock-levels` with `status` `attention` and to read the next pages until the last page
