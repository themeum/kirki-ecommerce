# MCP Server

The store has a [Model Context Protocol](https://modelcontextprotocol.io)
server. An AI client such as Claude Code or Claude Desktop connects to it and
can then answer questions about the store, for example "give me sales for the
last 7 days", with the real numbers of the store.

The server has one tool now: **sales report**. It reads the same numbers as the
Analytics page. The server is built on the bundled `ahamed/framework-mcp`
package (scoped to `Kirki\Ecommerce\Ahamed\FrameworkMcp\`) and the WordPress
MCP Adapter plugin.

- [1. Quick start](#1-quick-start)
- [2. The server](#2-the-server)
- [3. The sales report tool](#3-the-sales-report-tool)
- [4. Time zone](#4-time-zone)
- [5. Checking a site by hand](#5-checking-a-site-by-hand)
- [6. Adding a tool](#6-adding-a-tool)
- [7. Where this differs from the Analytics page](#7-where-this-differs-from-the-analytics-page)

---

## 1. Quick start

**1. Install the MCP Adapter plugin.** The site needs WordPress 6.9 or later
and the [MCP Adapter](https://github.com/WordPress/mcp-adapter) plugin, active.
The store does not bundle the adapter. Without it, the store runs as usual and
has no MCP endpoint.

**2. Create an application password.** Sign in as an administrator, go to
**Users → Profile → Application Passwords**, and add one (for example
"Claude"). Copy the password. The sales report tool runs only for users with the
`manage_options` capability.

**3. Connect the client over HTTP.** The endpoint is:

```
https://<your-site>/wp-json/kirki/ecommerce/v1/mcp/kirki-ecommerce
```

The client signs in with HTTP Basic authentication: the user name and the
application password, `user:password` encoded as Base64. For Claude Code:

```bash
claude mcp add --transport http kirki-ecommerce https://<your-site>/wp-json/kirki/ecommerce/v1/mcp/kirki-ecommerce --header "Authorization: Basic <base64 of user:application-password>"
```

**Or connect over WP-CLI (STDIO).** On the server that runs the site, with no
HTTP and no application password:

```bash
claude mcp add kirki-ecommerce -- wp --path=<wordpress-path> mcp-adapter serve --server=kirki-ecommerce --user=<admin-user>
```

**4. Ask.** "Give me sales for the last 7 days", "How did this month compare
with last month?", "Sales from 1 to 15 September".

---

## 2. The server

| | |
|---|---|
| Id | `kirki-ecommerce` |
| HTTP endpoint | `/wp-json/kirki/ecommerce/v1/mcp/kirki-ecommerce` |
| STDIO | `wp mcp-adapter serve --server=kirki-ecommerce --user=<admin>` |
| Who | The server has no capability check of its own. HTTP requests pass the MCP Adapter's default gate, which needs a signed-in user. Each tool then checks the capability that it needs. |
| Rate limit | 60 HTTP requests per minute for each user. Over the limit: status `429` with `Retry-After`. STDIO is not limited. |
| Tools | `kirki-ecommerce-sales-report` |

The sales report tool checks `manage_options` over HTTP and over STDIO. A
signed-in user without that capability can list the tools and their schemas,
but a call to the tool gets a permission error. The tool is offered only by this
server. It is not public, so the adapter's default server and the core
Abilities REST API (`/wp-abilities/v1`) do not list it.

Errors inside a tool go to the plugin log. The client sees validation messages,
and for any other error only "The request could not be completed." unless
`WP_DEBUG` is on.

Code: `app/Mcp/Servers/StoreServer.php`, registered in
`AppServiceProvider::boot()`.

---

## 3. The sales report tool

Name: `kirki-ecommerce-sales-report` (ability `kirki-ecommerce/sales-report`).
Read-only and idempotent.

### Arguments

| Argument | Values | Notes |
|---|---|---|
| `range` | `today`, `yesterday`, `last_7`, `last_30`, `last_90`, `last_12_months`, `month_to_date`, `year_to_date`, `custom` | Default `last_30`. |
| `from`, `to` | `Y-m-d` | Required when `range` is `custom`. `to` cannot be after today. `from` cannot be after `to`. |
| `compare` | `previous_period`, `previous_year`, `custom`, `none` | Optional. **No comparison when it is left out.** |
| `compare_from`, `compare_to` | `Y-m-d` | Required when `compare` is `custom`. `compare_from` cannot be after `compare_to`. |

Each preset gives the same days as on the Analytics page. "Last 7 days" ends
today and has 7 days. "Last 12 months" starts on the day after the same date one
year ago. The tool description tells the client how to map phrases such as "this
month" (`month_to_date`) or "last year" (`last_12_months`).

A wrong argument gives a tool error whose message names the argument, for
example `The end date "to" cannot be after today.`. No query runs.

### Output

```json
{
  "range": { "preset": "last_7", "from": "2026-10-20", "to": "2026-10-26", "days": 7 },
  "compare": null,
  "granularity": "day",
  "time_zone": "Asia/Dhaka",
  "currency": "USD",
  "has_orders": true,
  "totals": {
    "gross_sales": { "current": { "amount": 1250.0, "display": "$1,250.00", "currency": "USD" }, "previous": null, "change": null },
    "discounts": { "...": "..." },
    "returns": { "...": "..." },
    "net_sales": { "...": "..." },
    "shipping": { "...": "..." },
    "taxes": { "...": "..." },
    "total_sales": { "...": "..." },
    "average_order_value": { "...": "..." },
    "orders": { "current": 18, "previous": null, "change": null },
    "items_ordered": { "...": "..." },
    "customers": { "...": "..." },
    "new_customers": { "...": "..." }
  },
  "series": [
    { "date": "2026-10-20", "label": "Oct 20", "total_sales": 120.0, "orders": 2 }
  ]
}
```

- Money totals are `{ amount, display, currency }`. `average_order_value` is
  `null` when there are no paid orders.
- Counts are numbers.
- `change` is the percent change, rounded to one decimal. It is `null` with no
  comparison or when the earlier value is 0.
- `series` has one point for each day, week or month of the range (1–31 days:
  day; 32–186 days: week; more: month). With a comparison, each point also has
  `previous_date`, `previous_total_sales` and `previous_orders`. Money in the
  series is the decimal amount in the store currency.

Every number follows the rules in [Analytics](analytics.md): sales count only
paid, refunding and refunded orders, on the day they were paid; orders count
every order that did not fail; orders in an old base currency are left out.

Code: `app/Mcp/Tools/SalesReportTool.php`. It calls `AnalyticsQueryService`
for the `kpis` and `total_sales_breakdown` metrics and reshapes them.

---

## 4. Time zone

The tool puts each order on a day in the **site time zone** (**Settings →
General → Timezone** in WordPress). If an HTTP client sends a valid
`X-Kecom-Timezone` header, that time zone is used instead, as for the admin
app. `time_zone` in the output says which one was used.

---

## 5. Checking a site by hand

The test suite has no MCP Adapter, so these checks need a site that has it:

1. `tools/list` with an administrator's application password lists
   `kirki-ecommerce-sales-report`.
2. A call with `{"range": "last_7"}` returns the same totals as the Analytics
   page for **Last 7 days** with **No comparison**, in the same time zone.
3. The same call with an editor's application password gets a permission
   error.
4. The 61st request from one user within one minute gets `429` with a
   `Retry-After` header.

---

## 6. Adding a tool

1. Create a class in `app/Mcp/Tools/` that extends
   `Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool`, with `schema()`, `handle()` and
   a `permission()` that checks the capability the tool needs. The server
   has no check of its own, so a tool without `permission()` gets the
   package default (`read`).
2. Add it to `$tools` in `StoreServer`.

The package guide (`docs/mcp.md` in the `ahamed/framework-mcp` repository)
covers schemas, responses, resources and prompts. Use the scoped namespaces
(`Kirki\Ecommerce\Ahamed\FrameworkMcp\…`, `Kirki\Ecommerce\Framework\…`) in
this plugin.

---

## 7. Where this differs from the Analytics page

- **No comparison by default.** The Analytics page compares with the previous
  period unless you change it. The tool compares only when `compare` is sent.
- **Site time zone.** The Analytics page uses the browser time zone. The tool
  uses the site time zone unless the client sends `X-Kecom-Timezone`. Near
  midnight, a day can then hold different orders than on the page.
- **Fewer metrics.** The tool gives the sales totals and the sales and orders
  series only. It has no sales by product, category, coupon, location, payment
  method or time of day, no tax or shipping breakdowns, no returning customer
  rate, and no inventory health.
- **No per-metric series.** The page has a series for each KPI card. The tool
  has series for total sales and orders only.
- **Two queries per call.** The tool reads the window twice (once for the KPIs,
  once for the breakdown). The numbers are the same, but a call costs more than
  one Analytics card.
