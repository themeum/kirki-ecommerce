## Context

- The scoped package is at `vendor/libraries/framework-mcp`, namespace
  `Kirki\Ecommerce\Ahamed\FrameworkMcp\`. Its provider is not registered yet.
- The package names an ability `{kebab(app prefix)}/{kebab(class name without
  Tool)}`. The app prefix is `kirki_ecommerce_`, so a `SalesReportTool` class
  becomes `kirki-ecommerce/sales-report`, which clients see as
  `kirki-ecommerce-sales-report`. The default category is `kirki-ecommerce`.
- The Analytics page gets its numbers from `AnalyticsQueryService::get_metric($key, $params)`.
  `$params` are the validated `range`, `from`, `to`, `compare`,
  `compare_from`, `compare_to`. The `kpis` key returns every window total with
  its series. The `total_sales_breakdown` key returns `returns` and `taxes`,
  which `kpis` does not have.
- `AnalyticsRangeResolver::today()` and the day buckets use
  `client_timezone()`. It reads the `X-Kecom-Timezone` header through
  `request()` and falls back to `wp_timezone()`.
- `AnalyticsMetricRequest` holds the range rules, the messages, and the date
  order checks (`to` not after today, `from` not after `to`). It is a framework
  HTTP request class. An MCP tool gets a different request class
  (`Kirki\Ecommerce\Ahamed\FrameworkMcp\Request`), which has `validate(array $rules)`
  with the same framework rule engine.
- The test environment has no MCP Adapter plugin, so no MCP route exists in
  tests.

## Goals / Non-Goals

**Goals:**

- One server and one tool, with the numbers from the existing analytics code.
- A compact report that an AI client can read in one call.

**Non-Goals:**

- Other tools (orders, products, customers), resources, or prompts.
- Any change to the analytics queries or the Analytics page.
- Write or destructive tools.
- Bundling the MCP Adapter plugin.

## Decisions

### 1. Classes and registration

- `app/Mcp/Servers/StoreServer.php` extends the scoped `Server`:
  `$name = 'Kirki eCommerce'`, a generic `$description` for the whole store
  (the server will get more tools than the sales report), and `$tools = [SalesReportTool::class]`. It has no `permission()`.
- `app/Mcp/Tools/SalesReportTool.php` extends the scoped `Tool`.
- `AppServiceProvider::boot()` calls
  `Mcp::server('kirki-ecommerce', StoreServer::class)->middleware(['throttle:60,1'])`.
- `bootstrap/providers.php` lists the package's `McpServiceProvider`.

Why `AppServiceProvider` and not a separate provider: one server is one line,
and a provider for one line adds a class with no other job. The servers are
read on the adapter hook, after every provider has booted, so the order of the
providers does not matter.

Why the server is named `StoreServer`: the id carries the plugin slug, and the
class can grow more tools later without a rename.

### 2. Permission in each tool

The server has no `permission()`, so the MCP Adapter's default transport gate
applies to HTTP requests. A server-level `manage_options` check would make
every later tool admin only, and the server is for the whole store. Each tool
defines `permission()` with the capability that it needs. The sales report
tool checks `manage_options`. This check also covers STDIO, which skips the
HTTP gate, and replaces the package's default for a component, which is only
`read`. `$public` and `$show_in_rest` stay false.

Trade-off: a signed-in user who passes the adapter's default gate can list the
tools and their schemas, but cannot run a tool without its capability.

### 3. Rate limit

`throttle:60,1` on the server. The framework's `ThrottleRequests` keys by the
user id when there is one, else by IP, so the limit is per user. Middleware
does not run for STDIO, which matches the spec.

### 4. Validation in the tool

`handle()` calls `$request->validate()` with the same rule strings as
`AnalyticsMetricRequest::rules()`, built from `AnalyticsRangeResolver::PRESETS`
and `::COMPARISONS`, with the same messages. Then it runs the two date order
checks and throws `ValidationException::with_errors()` on failure. The package
sends a `ValidationException` to the client as a tool error with the messages.

`schema()` also declares `range` and `compare` as enums and the dates as
strings with `format: date`, so the client sees the allowed values and
WordPress rejects a wrong enum before `handle()` runs. The framework rules are
still needed for `required_if` and for the date order checks, which a JSON
schema cannot express.

Alternative considered: move the rules and checks out of
`AnalyticsMetricRequest` into a shared class. Rejected for now: it changes a
working request class for one new caller. The trade-off is two copies of the
rule list (see Risks).

### 5. Comparison default

When `compare` is missing, the tool passes `compare = none` to the service.
The service default (`previous_period`) is left alone, so the Analytics page
does not change.

### 6. Building the report

`handle()` calls `get_metric('kpis', $params)` and
`get_metric('total_sales_breakdown', $params)`, then maps the two results to
the spec's shape:

- `range`, `compare`, `granularity`, `currency`, `has_orders` from `meta`.
- `time_zone` from `client_timezone()->getName()`.
- Money totals from the breakdown rows and from `kpis.average_order_value`.
  Each money value is the `MoneyDTO` short form the service already returns
  (decimal, display string, currency). The tool renames
  `current_money_object`/`previous_money_object` to `current`/`previous`.
- Count totals from `kpis.orders`, `items_ordered`, `customers`,
  `new_customers`.
- `series` from `kpis.total_sales.series` and `kpis.orders.series`, joined
  by index. `span_label` and the `previous_label` keys are dropped to keep the
  response small.

The tool returns `Response::structured($report)`. No `output_schema()` in this
change: WordPress would then validate the result against it, and a schema
mistake would turn a correct report into an error. It can be added later.

Alternative considered: a new public method on `AnalyticsQueryService` that
collects the window once and returns both parts. Rejected for now to keep the
service unchanged. The cost is a second window query for each call (see
Risks).

### 7. Time zone

No change. Over HTTP, `client_timezone()` reads the header if a client sends
one, else the site time zone. Over STDIO there is no header, so it is the
site time zone. The report says which time zone it used.

### 8. Tests

Integration tests call the tool directly: resolve `SalesReportTool` from the
container, build `new Request([...])`, call `handle()`, and assert on the
structured content. They reuse `SeedsAnalyticsData`. They cover each spec
scenario that does not need the adapter: presets, custom range, validation
errors, opt-in comparison, totals equal to `get_metric()`, empty range, and
the site time zone. Permission tests call the tool's `permission()` with
an administrator, an editor and no user, and check that the server has no
`permission()`. A registration test checks
that `Mcp::servers()` has `kirki-ecommerce`.

The HTTP route, application password sign-in, and the 429 rate limit need the
MCP Adapter plugin. They are checked by hand on a site that has it, and the
steps go in `docs/mcp.md`.

## Risks / Trade-offs

- [Two copies of the range rules] → The tool builds its rule list from the
  same `AnalyticsRangeResolver` constants, and both have tests for the same
  invalid inputs. If a third caller appears, move the rules to a shared class.
- [Two window queries per call] → Calls are rate limited and admin only, and
  `last_12_months` groups by month. If this becomes slow, add the single-pass
  service method from Decision 6.
- [`client_timezone()` depends on `request()` in a STDIO session] → A test
  calls the tool outside a REST request and asserts the site time zone. If
  `request()` is not usable there, guard the call in the tool and record a
  correction in this file.
- [The package `Response::structured()` result shape in the adapter] → Checked
  by hand with a real client as part of the doc's quick start.
- [Provider registered on sites without the adapter] → The package's hooks
  wait for the Abilities API and the adapter, so nothing runs. A test boots
  the app without the adapter and asserts no error.

## Migration Plan

Additive. Deploy with the plugin. Rollback: remove the two provider lines from
`bootstrap/providers.php`.

## Corrections during implementation

- **§4, messages.** The tool does not copy the messages of
  `AnalyticsMetricRequest`. Its messages name the argument (for example
  `Enter a start date "from" as Y-m-d.`), and `range`/`compare` errors list the
  allowed values. The package joins only the message texts into the tool
  error, not the field keys, so the spec's "names the wrong argument" needs the
  name in the text. The rules themselves are the same.
- **§4, date format in the schema.** WordPress schema validation does not know
  `format: date`, so the date arguments use `pattern: ^\d{4}-\d{2}-\d{2}$`.
  The framework `date` and `format:Y-m-d` rules still reject a date such as
  `2026-13-45`.
- **§1, §2, registration and permission.** The server is registered in
  `AppServiceProvider::boot()`, not in a separate provider. The server has no
  `permission()`. Each tool checks its own capability (see §2).
- **§6, money in the series.** The service series carry minor units. The tool
  converts `total_sales` and `previous_total_sales` to decimal amounts with
  `Money::prepare_amount_from_minor()`, the same unit as the totals.
