## 1. Server and registration

- [x] 1.1 Create `app/Mcp/Servers/StoreServer.php` (extends the scoped `Server`): `$name`, `$description`, `$tools = [SalesReportTool::class]`, and no `permission()` (design §1, §2)
- [x] 1.2 Register `Mcp::server('kirki-ecommerce', StoreServer::class)->middleware(['throttle:60,1'])` in `AppServiceProvider::boot()` (design §1, §3)
- [x] 1.3 Add the scoped `Kirki\Ecommerce\Ahamed\FrameworkMcp\McpServiceProvider` to `bootstrap/providers.php`
- [x] 1.4 Add `tests/Integration/McpServerTest.php`: `Mcp::servers()` has `kirki-ecommerce` mapped to `StoreServer`; the server has no `permission()`; the app boots with no error when the MCP Adapter is absent
- [x] 1.5 Verify: `composer test:integration` (filter `McpServerTest`), `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`
  - Note: McpServerTest 6/6, both PHPCS runs and typecheck pass. `npm test` has 9 failures, all in `features/list-page-empty-state.test.tsx`. They are not from this change: no frontend file is changed.

## 2. Sales report tool

- [x] 2.1 Create `app/Mcp/Tools/SalesReportTool.php` with `$description` (how to map "last 7 days", "this month" and similar to `range`), `$read_only = true`, `$idempotent = true`, and `permission()` that requires `manage_options` (spec: Tool identity; design §2)
- [x] 2.2 Add `schema()`: `range` and `compare` enums from `AnalyticsRangeResolver::PRESETS` / `::COMPARISONS`, `range` default `last_30`, and `from`, `to`, `compare_from`, `compare_to` as date strings (design §4)
- [x] 2.3 In `handle()`, validate with the same rules and messages as `AnalyticsMetricRequest`, then the date order checks (`to` not after today, `from` not after `to`, `compare_from` not after `compare_to`); throw `ValidationException::with_errors()` on failure (spec: Argument validation; design §4)
  - Note: same rules, but the messages name the argument. See "Corrections during implementation" in design.md.
- [x] 2.4 Pass `compare = none` when `compare` is missing (spec: Comparison is opt-in; design §5)
- [x] 2.5 Build the report from `get_metric('kpis')` and `get_metric('total_sales_breakdown')` in the spec's shape (`range`, `compare`, `granularity`, `time_zone`, `currency`, `has_orders`, `totals`, `series`) and return `Response::structured()` (spec: Report content; design §6)
- [x] 2.6 Add `tests/Integration/McpSalesReportToolTest.php` with `SeedsAnalyticsData`: `last_7` and no-argument ranges, custom range, every validation error in the spec, no comparison by default, `previous_period` when asked, totals equal to `get_metric()` for the same params, only sales orders in sales totals, empty range, site time zone outside a REST request, and `permission()` for administrator, editor and no user
- [x] 2.7 Verify: `composer test:integration` (filter `McpSalesReportToolTest`), `composer test:unit`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`
  - Note: full integration suite 1121/1121, unit 442/442, both PHPCS runs and typecheck pass. `npm test` has the same 9 failures in `features/list-page-empty-state.test.tsx`, which this change does not touch.

## 3. Documentation and manual check

- [x] 3.1 Write `docs/mcp.md` in the `docs/emails.md` structure: table of contents; 1. Quick start (install the MCP Adapter plugin, create an application password, connect Claude Code / Claude Desktop over HTTP, and `wp mcp-adapter serve --server=kirki-ecommerce`); server reference (id, endpoint, permission, rate limit); `sales-report` tool reference (arguments, presets, output fields, errors, examples such as "sales for the last 7 days"); time zone; "Where this differs from the Analytics page" (no comparison by default, site time zone unless the header is sent, no product/category/location breakdowns); adding more tools
- [x] 3.2 Add one line for `vendor/libraries/framework-mcp/` to the "do not hand-edit" note in `CLAUDE.md` §2
- [x] 3.3 Ask the user to check on a site with the MCP Adapter plugin: `tools/list` with an application password, a `last_7` call, an editor rejected, and a 429 after 60 calls in one minute; record any correction in `design.md`
- [x] 3.4 Verify: `npm run typecheck && npm test` in `resources/app/` and `composer test`
  - Note: unit 442/442 and integration 1121/1121 (run in Docker), typecheck passes. `npm test` has the same 9 failures in `features/list-page-empty-state.test.tsx`, from before this change.
