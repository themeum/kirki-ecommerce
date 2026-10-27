## Why

Store admins want to ask an AI assistant questions such as "give me sales for
the last 7 days" and get the real numbers of their store. The plugin now ships
the scoped `ahamed/framework-mcp` package, but no MCP server or tool uses it
yet, so an MCP client cannot read any store data.

## What Changes

- Register the scoped `Kirki\Ecommerce\Ahamed\FrameworkMcp\McpServiceProvider`
  in `bootstrap/providers.php`. It does nothing on a site without WordPress 6.9
  and the MCP Adapter plugin.
- Add an MCP server with the id `kirki-ecommerce`. It is reachable over HTTP at
  `/wp-json/<app REST namespace>/mcp/kirki-ecommerce` and over WP-CLI STDIO.
  Each tool checks the capability that it needs. The sales report tool needs
  `manage_options` (the same check as the admin REST API). A throttle
  middleware limits HTTP calls.
- Add one read-only tool, **sales report**. It takes a date range and returns
  the sales totals and a sales-over-time series for that range:
  - Range: the same presets as the Analytics page (`today`, `yesterday`,
    `last_7`, `last_30`, `last_90`, `last_12_months`, `month_to_date`,
    `year_to_date`) or `custom` with `from` and `to`.
  - Comparison: optional. There is no comparison unless the caller asks for
    one (`previous_period`, `previous_year`, or `custom` with `compare_from`
    and `compare_to`). This is different from the Analytics page, which
    compares with the previous period by default.
  - Numbers come from `AnalyticsQueryService`, so they are the same as the
    Analytics page for the same range.
- Add `docs/mcp.md`: how to connect a client, the tool reference, and a
  "Where this differs from the Analytics page" section.

## Capabilities

### New Capabilities

- `mcp-server`: the plugin's MCP server: its id, its transports, who can use
  it, and its rate limit.
- `mcp-sales-report`: the sales report tool: its arguments, how the range and
  comparison are resolved, which numbers it returns, and its errors.

### Modified Capabilities

None. The tool reads the metrics that `analytics-metrics` defines and does not
change them.

## Impact

- **Depends on** the `ahamed/framework-mcp` install (composer.json, lock,
  `scoper.framework-mcp.php`, `bin/scope-framework.php`), which is not
  committed yet.
- New code: `app/Mcp/Servers/`, `app/Mcp/Tools/`, and a server registration in
  a service provider's `boot()`.
- `bootstrap/providers.php`: one new provider.
- `AnalyticsQueryService` is reused as it is. No change to its queries.
- New integration tests under `tests/Integration/`.
- New `docs/mcp.md`.
- Runtime: the MCP Adapter plugin is needed on the site for the server to
  exist. The plugin does not bundle it (WordPress.org distribution).
