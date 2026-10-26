# MCP Server

The store has a [Model Context Protocol](https://modelcontextprotocol.io)
server. An AI client such as Claude Code or Claude Desktop connects to it and
can then answer questions about the store, for example "give me sales for the
last 7 days", with the real numbers of the store.

The server has 11 tools. All of them only read store data:

- Analytics: **sales report**, **sales trend**, **product performance** and
  **sales breakdown**. They read the same numbers as the Analytics page.
- Orders: **find orders** and **get order**.
- Catalog: **find products** and **stock levels**.
- Customers and coupons: **find customers** and **find coupons**.
- Setup: **setup status**.

The server is built on the bundled `ahamed/framework-mcp`
package (scoped to `Kirki\Ecommerce\Ahamed\FrameworkMcp\`) and the WordPress
MCP Adapter plugin.

- [1. Quick start](#1-quick-start)
- [2. The server](#2-the-server)
- [3. The sales report tool](#3-the-sales-report-tool)
- [4. Rules of the read-only tools](#4-rules-of-the-read-only-tools)
- [5. Analytics tools](#5-analytics-tools)
- [6. Order tools](#6-order-tools)
- [7. Catalog tools](#7-catalog-tools)
- [8. Customer and coupon tools](#8-customer-and-coupon-tools)
- [9. The setup status tool](#9-the-setup-status-tool)
- [10. Time zone](#10-time-zone)
- [11. Checking a site by hand](#11-checking-a-site-by-hand)
- [12. Adding a tool](#12-adding-a-tool)
- [13. Where this differs from the admin screens](#13-where-this-differs-from-the-admin-screens)

---

## 1. Quick start

**1. Install the MCP Adapter plugin.** The site needs WordPress 6.9 or later
and the [MCP Adapter](https://github.com/WordPress/mcp-adapter) plugin, active.
The store does not bundle the adapter. Without it, the store runs as usual and
has no MCP endpoint.

**2. Create an application password.** Sign in as an administrator, go to
**Users → Profile → Application Passwords**, and add one (for example
"Claude"). Copy the password. The tools run only for users with the `manage_options`
capability.

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
with last month?", "What are my 10 best sellers this month?", "Which orders are
not shipped yet?", "What must I reorder?", "Who are my best customers?",
"What is left to set up in my store?".

---

## 2. The server

| | |
|---|---|
| Id | `kirki-ecommerce` |
| HTTP endpoint | `/wp-json/kirki/ecommerce/v1/mcp/kirki-ecommerce` |
| STDIO | `wp mcp-adapter serve --server=kirki-ecommerce --user=<admin>` |
| Who | The server has no capability check of its own. HTTP requests pass the MCP Adapter's default gate, which needs a signed-in user. Each tool then checks the capability that it needs. |
| Rate limit | 60 HTTP requests per minute for each user. Over the limit: status `429` with `Retry-After`. STDIO is not limited. |
| Tools | `kirki-ecommerce-sales-report`, `kirki-ecommerce-sales-trend`, `kirki-ecommerce-product-performance`, `kirki-ecommerce-sales-breakdown`, `kirki-ecommerce-find-orders`, `kirki-ecommerce-get-order`, `kirki-ecommerce-find-products`, `kirki-ecommerce-stock-levels`, `kirki-ecommerce-find-customers`, `kirki-ecommerce-find-coupons`, `kirki-ecommerce-setup-status` |

Each tool checks `manage_options` over HTTP and over STDIO. A signed-in user
without that capability can list the tools and their schemas, but a call to a
tool gets a permission error. The tools are offered only by this server. They
are not public, so the adapter's default server and the core Abilities REST
API (`/wp-abilities/v1`) do not list them.

Errors inside a tool go to the plugin log. The client sees validation messages,
and for any other error only "The request could not be completed." unless
`WP_DEBUG` is on.

Code: `app/Mcp/Servers/StoreServer.php`, registered in
`AppServiceProvider::boot()`.

---

## 3. The sales report tool

Name: `kirki-ecommerce-sales-report` (ability `kirki-ecommerce/sales-report`).
Read-only and idempotent. The other analytics tools ([section 5](#5-analytics-tools))
use the same range arguments.

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

## 4. Rules of the read-only tools

These rules apply to all 11 tools.

- **Annotations.** Each tool has `readOnlyHint` true, `idempotentHint` true,
  `destructiveHint` false and `openWorldHint` false.
- **Access.** Only users with `manage_options`. See [section 2](#2-the-server).
- **Validation first.** A wrong argument gives a tool error whose message
  names the argument and the allowed values or format, for example
  `The "status" must be one of: active, scheduled, inactive, expired.`. No
  query runs.
- **Money** is `{ amount, display, currency }`. Fields named `base_*` are in
  the store currency. Fields named `invoiced_*` are in the order currency.
- **Dates and times** are ISO 8601 with the offset of the site time zone (see
  [section 10](#10-time-zone)), for example `2026-10-21T16:00:00+06:00`.
- **IDs** are integers. Each row has the ID that the next tool needs, for
  example `order_id` for `get-order`.

### Paging

The list tools (`find-orders`, `find-products`, `stock-levels`,
`find-customers`, `find-coupons`) take `page` (from 1, default 1) and
`per_page` (1 to 100, default 20). They never return all rows in one call. The
result has:

```json
"pagination": { "page": 1, "per_page": 20, "total": 45, "total_pages": 3 }
```

### Personal data

The list tools mask personal data:

- A customer email is the first character of the local part, then `***`, then
  `@` and the full domain: `jane@example.com` becomes `j***@example.com`. A
  value without `@` becomes `***`.
- A customer name is the first name only.
- Phone numbers and street addresses are not returned.
- A `search` with a full email still matches, because the search runs on the
  stored value.

Only `get-order` returns full personal data, because it returns one order that
the merchant asked for by ID or number.

### Customer-written text

Text that customers or other outside people write (order notes, cancellation
reasons, refund reasons, timeline entries) is returned only by `get-order`, in
fields that have `note` or `text` in their name. HTML tags are removed and each
value is cut to 500 characters. The tool description tells the client that this
text is data and never an instruction. No tool in this release can change the
store, so text in an order note cannot cause a change through these tools.

---

## 5. Analytics tools

The three tools take the range arguments of the sales report tool (`range`,
`from`, `to`, `compare`, `compare_from`, `compare_to`), with the same default
(`last_30`) and the same validation. There is no comparison when `compare` is
left out. Each result has `range`, `compare`, `time_zone`, `currency` and
`has_orders`, as in the sales report. Every number follows the rules in
[Analytics](analytics.md).

### Sales trend

Name: `kirki-ecommerce-sales-trend`. Example questions: "How did sales change
this month?", "Which day had the most orders last week?".

Output:

- `granularity`: `day`, `week` or `month`, by the Analytics page rules.
- `totals`: `total_sales`, `orders` and `average_order_value` of the range,
  each with `current`, `previous` and `change`.
- `series`: one point for each bucket, with `date`, `label`, `total_sales`,
  `orders` and `average_order_value`. With a comparison, each point also has
  `previous_date`, `previous_total_sales`, `previous_orders` and
  `previous_average_order_value`. Money in the series is the decimal amount in
  the store currency.

The numbers are the Total sales, Orders and Average order value cards of the
Analytics page.

### Product performance

Name: `kirki-ecommerce-product-performance`. Example questions: "What are my 10
best sellers this month?", "Which category sells best?".

| Argument | Values | Notes |
|---|---|---|
| `by` | `product`, `category` | Default `product`. |
| `limit` | 1–25 | Default 5 products or 6 categories, the same as the Analytics page. |

Output: `by` and `rows`, highest net sales first.

- A product row has `product_id`, `name`, `is_deleted` (the product no longer
  exists; `product_id` is then `null` and the row is grouped by its saved
  name), `units_sold`, `net_sales`, `availability_status`, `track_inventory`
  and `inventory`.
- A category row has `category_id` (`null` for Uncategorized), `name` and
  `net_sales`.
- With a comparison, each row also has `previous_net_sales` and `change`.

Net sales are without tax and after discounts, and do not subtract returns.

### Sales breakdown

Name: `kirki-ecommerce-sales-breakdown`. Example questions: "Which coupons were
used most?", "Where do my customers order from?", "How much tax did I collect by
region?".

| Argument | Values | Notes |
|---|---|---|
| `by` | `coupon`, `payment_method`, `shipping_method`, `country`, `region`, `tax_region` | Required. |
| `country` | ISO 3166-1 alpha-2, for example `US` | Required when `by` is `region`. |
| `limit` | 1–25 | Default 5. Only for `coupon`, `payment_method`, `shipping_method` and `tax_region`. Any other `by` with `limit` gives a tool error. |

Output: `by` and `rows`, with the values of the matching Analytics card:

| `by` | Row fields |
|---|---|
| `coupon` | `code`, `orders`, `discount_given`, `previous_orders`, `change` |
| `payment_method` | `id`, `name`, `orders`, `total_sales`, `previous_total_sales`, `change` |
| `shipping_method` | `id`, `name`, `orders`, `shipping_charges`, `previous_shipping_charges`, `change` |
| `country` | `code`, `name`, `sales`, `orders`, `customers`, and `sales_change`, `orders_change`, `customers_change`. Every country with orders, in code order. |
| `tax_region` | `country`, `state`, `name`, `product_tax`, `shipping_tax`, `total_tax`, `previous_total_tax`, `change` |

For `region`, the output has `country` and three lists in place of `rows`:
`top_by_sales`, `top_by_orders` and `top_by_customers`. Each list has the top 5
regions of the country by that metric, the same as the regions view of the
Sales by location card. Each row has `name`, `sales`, `orders`, `customers`
and the three changes.

Code: `app/Mcp/Tools/SalesTrendTool.php`, `ProductPerformanceTool.php` and
`SalesBreakdownTool.php`. They call `AnalyticsQueryService::get_metric()` and
`get_regions()`. The optional `limit` goes to `get_metric()` in its
parameters. The Analytics page does not send it, so the page keeps its fixed
limits.

---

## 6. Order tools

### Find orders

Name: `kirki-ecommerce-find-orders`. Example questions: "Which orders are not
shipped yet?", "Show the orders of last week", "Find the orders of
jane@example.com".

| Argument | Values | Notes |
|---|---|---|
| `search` | text | Part of an order number, a customer email or a shipping name, as in the admin order list. |
| `status` | the admin list statuses, for example `order-placed`, `order-shipped`, `refund-requested` | |
| `fulfillment_status` | `unfulfilled`, `processing`, `shipped`, `delivered`, `on-hold`, `cancelled`, `returned` | |
| `payment_status` | `paid`, `unpaid`, `failed`, `processing`, `pending`, `cancelled`, `refunding`, `refunded` | |
| `customer_id` | integer | From `find-customers`. |
| `shipping_method` | text | Shipping method ID. |
| `from`, `to` | `Y-m-d` | Creation date, in the site time zone. `from` cannot be after `to`. |
| `sort_by` | `created_at`, `invoiced_total` | Default `created_at`. |
| `sort_order` | `asc`, `desc` | Default `desc`. |
| `page`, `per_page` | | See [paging](#paging). |

Output: `orders` and `pagination`. Each order has `order_id`, `order_number`,
`created_at`, `status`, `fulfillment_status`, `payment_status`,
`invoiced_total` (order currency), `base_total` (store currency),
`items_count`, and `customer` with `customer_id`, `first_name` and the masked
`email`.

### Get order

Name: `kirki-ecommerce-get-order`. Example questions: "What happened to order
1042?", "What did the customer of order 1042 buy?".

| Argument | Values | Notes |
|---|---|---|
| `order_id` | integer | Send this or `order_number`. |
| `order_number` | text | Send this or `order_id`. |
| `include_activity` | boolean | Default false. Adds the timeline. |

Output: the data of the admin order page:

- `order_id`, `order_number`, `invoice_number`, the statuses, `currency_code`
  and the dates (`created_at`, `paid_at`, `shipped_at`, `fulfilled_at`,
  `cancelled_at`, `archived_at`).
- `customer` with the full name, email and phone, and `is_guest`.
- `items`, each with `product_name`, `variant_name`, `sku`, `quantity`, the
  unit price and subtotal in both currencies, tax, tax lines and the applied
  product coupons.
- `coupons`, `tax_lines`, `totals` (each total as `invoiced_*` and `base_*`),
  `shipping_method`, `shipping_tracking`, `payment_provider` and `refunds`.
- `shipping_address` and `billing_address`.
- `order_notes` and `cancellation_reason_text`, and `reason_text` on each
  refund, cleaned as in [customer-written text](#customer-written-text).
- With `include_activity`, `activity`: the timeline, newest first, at most 50
  entries. Each entry has `activity_type`, `description_text`, `created_by` and
  `created_at`.

Errors: no `order_id` and no `order_number` gives a tool error that names both.
An order that does not exist gives the tool error "The order was not found.".

Code: `app/Mcp/Tools/FindOrdersTool.php` (on `OrderService::paginated_orders()`)
and `GetOrderTool.php` (on `OrderService::find_order()`, `OrderResource` and
`OrderActivityService`).

---

## 7. Catalog tools

### Find products

Name: `kirki-ecommerce-find-products`. Example questions: "Which shoes are out
of stock?", "Show the draft products".

| Argument | Values | Notes |
|---|---|---|
| `search` | text | Part of a title or of a variant SKU. |
| `status` | `draft`, `published`, `scheduled`, `trashed` | Left out: all products that are not trashed. |
| `availability_status` | `in_stock`, `low_stock`, `out_of_stock`, `partially_stocked` | |
| `category_ids` | list of integers | A product in one of the categories matches. |
| `brand_id`, `collection_id` | integer | |
| `page`, `per_page` | | See [paging](#paging). |

Output: `products` and `pagination`. Each product has `product_id`, `title`,
`status`, `availability_status`, `price_range` (`min` and `max` in the store
currency; a sale price counts when the variant is on sale), `variant_count`,
`tracked_quantity` (the sum of the available quantity of the variants that
track inventory) and `categories` (names).

### Stock levels

Name: `kirki-ecommerce-stock-levels`. Example questions: "What must I
reorder?", "Which variants are out of stock?".

| Argument | Values | Notes |
|---|---|---|
| `status` | `out_of_stock`, `low_stock`, `attention` | Default `attention`, which means both. |
| `page`, `per_page` | | See [paging](#paging). |

Output: `status`, `counts` (`out_of_stock`, `low_stock`, `in_stock`),
`variants` and `pagination`. The variants are lowest available quantity first.
Each has `variant_id`, `product_id`, `product_name`, `variant_name`, `sku`,
`available_quantity`, `low_stock_threshold` (the one that applies) and
`status`.

The rules are those of the Inventory health card: a variant threshold
overrides the store default, and a variant that does not track inventory is
never low on stock by quantity. The counts have all variants. The list has
only the variants that track inventory, the same as the card, so a variant that
does not track inventory and is marked out of stock is in `counts` but not in
`variants`.

Code: `app/Mcp/Tools/FindProductsTool.php` (on `ProductService::paginated()`)
and `StockLevelsTool.php` (on `AnalyticsQueryService::stock_levels()`, which
the Inventory health card also uses).

---

## 8. Customer and coupon tools

### Find customers

Name: `kirki-ecommerce-find-customers`. Example questions: "Who are my best
customers?", "Which customers live in Germany?".

| Argument | Values | Notes |
|---|---|---|
| `search` | text | Part of a name, an email or a phone number. |
| `country` | ISO 3166-1 alpha-2 | Of the default shipping address, as in the admin customer list. |
| `city` | text | Of the default shipping address. |
| `sort_by` | `created_at`, `orders_count`, `base_amount_spent`, `last_order_date` | Default `created_at`. |
| `sort_order` | `asc`, `desc` | Default `desc`. |
| `page`, `per_page` | | See [paging](#paging). |

Output: `customers` and `pagination`. Each customer has `customer_id`,
`first_name`, the masked `email`, `country` (of the default shipping address),
`orders_count`, `base_amount_spent` (paid orders, store currency, the same as
the admin customer list), `last_order_date`, `accepts_marketing` and
`created_at`. There is no phone number and no address.

### Find coupons

Name: `kirki-ecommerce-find-coupons`. Example questions: "Which offers run
now?", "Which coupons are near their usage limit?".

| Argument | Values | Notes |
|---|---|---|
| `search` | text | Part of a code or title. |
| `status` | `active`, `scheduled`, `inactive`, `expired` | |
| `method` | `code`, `automatic` | |
| `discount_type` | `amount-off`, `free-shipping`, `buy-x-get-y` | |
| `page`, `per_page` | | See [paging](#paging). |

Output: `coupons` and `pagination`. Each coupon has `coupon_id`, `code`,
`title`, `method`, `discount_type`, `discount_value_type`, and either
`base_discount_amount` (a fixed amount in the store currency) or
`discount_percentage`. It also has `status`, `starts_at`, `ends_at` (`null`
with no end date), `usage_count`, `usage_limit` and `limit_per_customer`
(`null` when there is no limit).

Code: `app/Mcp/Tools/FindCustomersTool.php` (on `CustomerService::paginated()`)
and `FindCouponsTool.php` (on `CouponService::paginated()`).

---

## 9. The setup status tool

Name: `kirki-ecommerce-setup-status`. No arguments. Example questions: "What is
left to set up in my store?", "Can I start selling?".

Output: `steps` in the order of the Home page checklist, and `all_completed`.
Each step has `id` (`products`, `payments`, `tax`, `shipping`),
`is_completed`, `is_preconfigured` and `admin_page`, the admin URL where the
merchant does the step.

A step counts as completed by the rules of the Home page. Like the Home page,
the tool records a step that is newly met in the `setup_checklist` option.
This write changes no merchant data and gives the same result each time, so
the tool keeps `readOnlyHint` true.

The tool does not check store pages (cart, checkout and so on). No service
checks them now.

Code: `app/Mcp/Tools/SetupStatusTool.php`, on `SetupChecklistService`.

---

## 10. Time zone

The analytics tools put each order on a day in the **site time zone**
(**Settings → General → Timezone** in WordPress). The other tools give their
dates and times in the same time zone, and `find-orders` reads `from` and `to`
in it. If an HTTP client sends a valid `X-Kecom-Timezone` header, that time
zone is used instead, as for the admin app. `time_zone` in the output of the
analytics tools says which one was used.

---

## 11. Checking a site by hand

The test suite has no MCP Adapter, so these checks need a site that has it:

1. `tools/list` with an administrator's application password lists the 11
   tools. Each read-only tool has `readOnlyHint` true and `destructiveHint`
   false.
2. A sales report call with `{"range": "last_7"}` returns the same totals as
   the Analytics page for **Last 7 days** with **No comparison**, in the same
   time zone.
3. `sales-trend` with `{"range": "last_7"}` gives the same Total sales, Orders
   and Average order value as the Analytics page. `product-performance` gives
   the same 5 products as the Sales by product card.
4. One call to each new tool succeeds. `find-orders` shows masked emails such
   as `j***@example.com`.
5. A call with an editor's application password gets a permission error.
6. The 61st request from one user within one minute gets `429` with a
   `Retry-After` header.

---

## 12. Adding a tool

1. Create a class in `app/Mcp/Tools/`. A tool that only reads store data
   extends `StoreReadTool`, which sets the read-only annotations, checks
   `manage_options`, and has the helpers `validate_arguments()`, `reject()`,
   `money()`, `datetime()` and `store_text()`. Any other tool extends
   `Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool`, with a `permission()` that checks
   the capability the tool needs. The server has no check of its own, so a tool
   without `permission()` gets the package default (`read`).
2. Declare the arguments in `input_schema()` and do the work in `handle()`.
   The traits in `app/Mcp/Concerns/` add paging (`PagesResults`), masking
   (`MasksPersonalData`) and the analytics range (`ReadsAnalyticsRange`).
3. Add it to `$tools` in `StoreServer`.

The package guide (`docs/mcp.md` in the `ahamed/framework-mcp` repository)
covers schemas, responses, resources and prompts. Use the scoped namespaces
(`Kirki\Ecommerce\Ahamed\FrameworkMcp\…`, `Kirki\Ecommerce\Framework\…`) in
this plugin.

---

## 13. Where this differs from the admin screens

- **No comparison by default.** The Analytics page compares with the previous
  period unless you change it. The analytics tools compare only when `compare`
  is sent.
- **Site time zone.** The Analytics page uses the browser time zone. The tools
  use the site time zone unless the client sends `X-Kecom-Timezone`. Near
  midnight, a day can then hold different orders than on the page.
- **Metrics that the tools do not give.** Orders by fulfillment status, orders
  by time of day, new and returning customers, and the returning customer rate
  have no tool. The sales trend has series for total sales, orders and average
  order value only. The page has a series for each KPI card.
- **Longer ranked lists.** `product-performance` and `sales-breakdown` can give
  up to 25 rows with `limit`. The page always shows 5 products, 6 categories
  and 5 rows in the other ranked cards.
- **Regions.** The tool gives the same top 5 regions by each metric as the
  page. It does not give every region of a country.
- **Masked lists.** The admin order and customer lists show full names, emails
  and phone numbers. The list tools mask them. Use `get-order` for the full
  data of one order. There is no tool for the full record of one customer.
- **Fewer filters and sort fields.** `find-orders` sorts by creation date or
  order total only, and `find-customers` by creation date, order count, total
  spent or last order date. The product price filters, the brand list filter
  and the attribute filter of the admin product list have no argument. A tool
  rejects a sort field that it does not know. The admin list falls back to its
  default sort.
- **No exports and no bulk data.** A list tool gives at most 100 rows in one
  call. There is no "all rows" option.
- **Read only.** No tool can change an order, a product, a customer, a coupon
  or a setting.
- **Two queries per sales report call.** The sales report tool reads the window
  twice (once for the KPIs, once for the breakdown). The numbers are the same,
  but a call costs more than one Analytics card.
