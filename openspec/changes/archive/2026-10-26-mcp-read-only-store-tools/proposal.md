## Why

The store's MCP server has one tool, the sales report. A merchant can ask
"how did we do?", but cannot ask about best sellers, late orders, low stock,
customers or coupons. The code for these answers exists: 14 analytics metrics
and the list and show services of the admin app have no MCP tool. Research
(`reports/Kirki eCommerce MCP ideas.md`) shows that data questions and order
lookup are the first things merchants ask an admin assistant. WooCommerce's MCP
has no tools for analytics, customers, coupons or inventory.

This change adds 10 read-only tools that wrap existing services. No tool
changes store data, so the risk is low.

## What Changes

- Add 10 read-only tools to `StoreServer`:
  - `kirki-ecommerce-sales-trend`: total sales, orders and average order value
    over time, with an optional comparison.
  - `kirki-ecommerce-product-performance`: the best-selling products or
    categories in a range.
  - `kirki-ecommerce-sales-breakdown`: sales split by coupon, payment method,
    shipping method, country, region of one country, or tax region.
  - `kirki-ecommerce-find-orders`: a paged, filtered order list.
  - `kirki-ecommerce-get-order`: the full detail of one order, with an
    optional activity timeline.
  - `kirki-ecommerce-find-products`: a paged, filtered product list.
  - `kirki-ecommerce-stock-levels`: variants that are out of stock or low on
    stock, with counts by status.
  - `kirki-ecommerce-find-customers`: a paged customer list with order count,
    total spent and last order date.
  - `kirki-ecommerce-find-coupons`: a paged coupon list with status, value and
    usage.
  - `kirki-ecommerce-setup-status`: the open and completed setup steps.
- List tools mask customer personal data: an email shows as `j***@example.com`
  and a name shows as the first name only. `get-order` shows full data for one
  order.
- Every tool checks `manage_options`, is marked read-only and idempotent, and
  returns validation errors that name the argument.
- `AnalyticsQueryService` accepts an optional top-N `limit` for its ranked
  metrics. The Analytics page does not send it, so the page does not change.
- `AnalyticsQueryService` gets a full stock-level list. The Inventory health
  card keeps its 4 lowest variants.
- `docs/mcp.md` describes the new tools.

## Capabilities

### New Capabilities

- `mcp-read-tool-conventions`: rules that every read-only store tool follows:
  access, annotations, paging, masked personal data, store text, errors.
- `mcp-analytics-tools`: the sales trend, product performance and sales
  breakdown tools.
- `mcp-order-tools`: the find orders and get order tools.
- `mcp-catalog-tools`: the find products and stock levels tools.
- `mcp-customer-tools`: the find customers tool.
- `mcp-coupon-tools`: the find coupons tool.
- `mcp-setup-status`: the setup status tool.

### Modified Capabilities

None. The `mcp-server` and `mcp-sales-report` specs are still deltas in the
open change `mcp-sales-report-tool` and are not in `openspec/specs/` yet. Each
new capability spec says that `StoreServer` lists its tools, so this change
does not edit those deltas. The Analytics page behavior in `analytics-metrics`
does not change.

## Impact

- **New code:** 10 tool classes in `app/Mcp/Tools/`, and shared helpers for
  paging, masking and validation.
- **Changed code:** `app/Mcp/Servers/StoreServer.php` (`$tools`),
  `app/Services/AnalyticsQueryService.php` (optional `limit`, stock-level
  list).
- **Reused code:** `AnalyticsQueryService`, `AnalyticsRangeResolver`,
  `OrderService`, `OrderActivityService`, `ProductService`, `CustomerService`,
  `CouponService`, `SetupChecklistService`, `AvailabilityService`, and the
  existing list filter DTOs and request rules.
- **Tests:** new integration tests in `tests/Integration/` for each tool.
- **Docs:** `docs/mcp.md`.
- **Dependency:** the open change `mcp-sales-report-tool` (server, sales report
  tool). Archive it first, or archive the two changes in order.
- **No change:** REST routes, database tables, the admin app, and the sales
  report tool.
