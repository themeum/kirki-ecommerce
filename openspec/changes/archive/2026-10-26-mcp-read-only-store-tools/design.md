## Context

See proposal.md for the reasons. The current state that shapes the approach:

- `StoreServer` (`app/Mcp/Servers/StoreServer.php`) lists one tool,
  `SalesReportTool`. That tool shows the pattern that this change copies:
  - Validation with the framework `Validator` and messages that name the
    argument.
  - Extra checks on the order of the dates.
  - `permission()` checks `manage_options`.
  - A structured response.
- The package names an ability from the class name. For example,
  `FindOrdersTool` becomes `kirki-ecommerce/find-orders`, and clients see
  `kirki-ecommerce-find-orders`.
- **framework-mcp changed upstream.** Commit `128fe0c` of
  `ahamed/framework-mcp` renames `Tool::schema()` to `Tool::input_schema()`.
  The plugin is locked to `322f21e` (`composer.lock`, `dev-main`). After the
  update, the registrar calls `input_schema()`. A tool that still declares only
  `schema()` gets the base class `input_schema()`, which returns `[]`. The
  client then sees no arguments, and nothing reports an error. So the update
  must rename `SalesReportTool::schema()` in the same step. `docs/mcp.md` §6
  also names `schema()`.
- List services already page with `ListPaginator`, which has `items()`,
  `total()`, `get_per_page()` and `get_current_page()`.
  - `OrderService::paginated_orders`
  - `ProductService::paginated`
  - `CustomerService::paginated`
  - `CouponService::paginated`

  Each service also has a `sortable_columns()` map, and a sort field that is
  not in the map falls back to the default. The filter DTOs
  (`OrderListFilterDTO`, `ProductListFilterDTO`, `ListFilterDTO`,
  `CouponFilterDTO`) carry `search`, `page`, `limit`, `sort_by`,
  `sort_order`, `from_date` and `to_date`.
- `AnalyticsQueryService::get_metric($key, $params)` serves 16 keys. Its
  ranked metrics use the constants `PRODUCT_LIMIT` (5), `CATEGORY_LIMIT` (6)
  and `LIST_LIMIT` (5). `build_inventory_health()` walks all variants in
  chunks and resolves each status with
  `AvailabilityService::resolve_variant_status()`. It keeps only the 4 lowest
  variants (`LOWEST_STOCK_LIMIT`). `get_regions()` gives the regions of one
  country.
- `SetupChecklistService::get_state()` returns the visible steps. It also
  records steps that are newly met, in the same way as the Home page.
- The test environment has no MCP Adapter, so the tests call each tool's
  `handle()` and `permission()` directly, as `McpSalesReportToolTest` does.

## Goals / Non-Goals

**Goals:**

- Ten tools that reuse the existing services, filters and sort maps. Each
  tool gives the same numbers as the matching admin screen.
- One shared place for paging, masking, store-text cleaning and money shape,
  so that the 10 tools behave the same.

**Non-Goals:**

- Write tools, resources and prompts. They come in later changes (see the
  report phases).
- A capability model finer than `manage_options`, a read-only mode setting,
  and an audit log. These matter for write tools, not for this change.
- OAuth for web clients.
- `returning_customer_rate` in the sales report tool, and any other change to
  the sales report output.
- Store page checks in `setup-status`. No service checks missing pages today.

## Decisions

### 1. Update framework-mcp first, in its own step

Task group 1 runs `composer update ahamed/framework-mcp` (then `composer
scope`, which runs on install and update). It renames
`SalesReportTool::schema()` to `input_schema()` and updates `docs/mcp.md` §6.
After that, the existing MCP tests must pass. A new test asserts that the
sales report tool declares `input_schema()` with the `range` argument. Without
this test, a missed rename passes silently.

Alternative: pin the old commit and write the new tools with `schema()`. This
is rejected because the new tools would have to be renamed later, and the
plugin would stay behind the package.

### 2. One class per tool, with shared code in a trait and a base class

Each tool is a class in `app/Mcp/Tools/` (`SalesTrendTool`,
`ProductPerformanceTool`, `SalesBreakdownTool`, `FindOrdersTool`,
`GetOrderTool`, `FindProductsTool`, `StockLevelsTool`, `FindCustomersTool`,
`FindCouponsTool`, `SetupStatusTool`). All 10 classes are added to
`StoreServer::$tools`.

The shared code:

- `app/Mcp/Tools/StoreReadTool.php`: an abstract class that extends the
  package `Tool`. It sets `$read_only = true`, `$idempotent = true`,
  `$destructive = false` and `$open_world = false`. Its `permission()` checks
  `manage_options`. It also has helpers:
  - `validate_arguments($arguments, $rules, $messages)` throws a
    `ValidationException`, as `SalesReportTool::validate()` does.
  - `money($minor)` returns `{ amount, display, currency }`.
  - `datetime($utc)` returns ISO 8601 in `client_timezone()`.
  - `store_text($text)` removes the tags with `wp_strip_all_tags` and cuts
    the text to 500 characters.
- `app/Mcp/Concerns/MasksPersonalData.php`: a trait with `mask_email()` and
  `first_name()`.
- `app/Mcp/Concerns/PagesResults.php`: a trait with the `page` and `per_page`
  schema fragments, the rules, and `pagination(ListPaginator)`.
- `app/Mcp/Concerns/ReadsAnalyticsRange.php`: a trait with the range schema,
  the rules, the messages and the date checks, moved out of
  `SalesReportTool`. `SalesReportTool` uses the trait too, so the 4 analytics
  tools share one copy of these rules.

Alternative: one generic `analytics` tool with a `metric` enum, or one
`find` tool with an `entity` enum. This is rejected because each tool needs
its own description, filters and output, and a client decides which tool to
call from the description. The report gives the reasons (Anthropic's advice
on tools that each cover one job).

Alternative: leave `SalesReportTool` alone and copy the range rules. This is
rejected because 4 copies of the date rules can drift apart. The move does
not change the output of the sales report tool, and its tests prove this.

### 3. Each list tool builds the filter DTO, calls the service and shapes the rows

A list tool maps its arguments to the service DTO. `per_page` becomes
`limit`, and `from`/`to` become `from_date`/`to_date`. The tool then calls
`paginated()` and shapes each model into a compact row. The tool does not use
the admin `*ListResource` classes. Those classes return full names, emails
and many display fields. The MCP rows must be masked and small.

Each tool validates `sort_by` against its own allow-list, which is a subset
of the service's `sortable_columns()` keys. A wrong value gives a tool error,
not the service's silent fallback.

`per_page` has a maximum of 100. A tool never passes `-1` (all rows) to a
service.

### 4. Masking rule

- `mask_email('jane@example.com')` returns `j***@example.com`. When the
  local part has one character, the result is `j***@example.com` too. When
  there is no `@`, the result is `***`.
- `first_name()` uses the first name field. It does not split a full name.

`search` is passed to the service unchanged, so a full email still matches
(the services search `customer_email` and `email` with `LIKE`).

`get-order` is the only tool that returns full personal data, because it
returns one order that the merchant asked for by ID or number.

### 5. Analytics: an optional `limit` in `$params`, and a stock-level method

- `get_metric()` reads an optional `$params['limit']` and stores it in a
  property. The product, category, coupon, payment, shipping and tax builders
  use `$this->limit ?? static::X_LIMIT` in place of the constant. The
  Analytics REST request does not have `limit` in its rules, so the page
  always gets the constants. The tools validate `limit` from 1 to 25 before
  the call.
- `sales_by_location` returns all countries with no limit. `get_regions`
  returns the top 5 regions by sales, by orders and by customers (correction
  found during implementation: it is not "all regions"). So `sales-breakdown`
  does not accept `limit` for `country` and `region`, and a `limit` with these
  values gives a tool error. For `region`, the tool returns the three top-5
  lists, the same as the page.
- `get_metric()` clamps `limit` to 1–25 (`MAX_LIMIT`). The Analytics REST
  controller passes `$request->all()`, so the clamp keeps an unexpected
  `limit` in a page request inside the same bounds as the tools.
- A new public method, `stock_levels(array $statuses, int $per_page, int
  $page)`, returns the counts and a page of variants, lowest quantity first.
  It uses the same chunked walk and `resolve_variant_status()`.
  `build_inventory_health()` calls it with the 4-variant limit, so the card
  and the tool follow one rule. The counts have all variants. The list has
  only variants that track inventory, the same as the card. Each listed
  variant also has `sku` and the `low_stock_threshold` that applies, so the
  card rows get these two fields too (additive).

Alternative: a new SQL query for low-stock variants. This is rejected because
the low-stock rule (the variant threshold overrides the store default,
untracked variants are never low) is in `AvailabilityService`, and a second
copy of that rule in SQL can drift. A store with 50,000 variants walks 50
chunks. The card already does the same walk.

### 6. Output shapes

`get-order` builds its result from the admin `OrderResource`, so it has the
same data as the order page. Each `*_money_object` becomes
`{ amount, display, currency }` under the key without the suffix, each `*_at`
time becomes ISO 8601, and images and icons are left out. `order_notes`,
`cancellation_reason_text`, the refund `reason_text` and the timeline
`description_text` go through `store_text()`. The analytics tools turn the
card rows into plain rows with the same money rule.

The specs define the fields. The rules that apply to all tools:

- Money totals use the shape of the sales report tool:
  `{ amount, display, currency }`.
- Order totals have the order currency (`invoiced_*`) and the base currency
  (`base_*`), each named as such.
- IDs are integers. Every row has the ID that the next tool needs, for
  example `order_id` for `get-order`.

## Risks / Trade-offs

- [The `schema()` rename passes silently] → The new test asserts the sales
  report input schema. Task 1 also searches `app/` for `function schema(`.
- [An agent pages through many orders and sends much personal data] → Lists
  are masked, and `per_page` is at most 100. The HTTP rate limit (60 per
  minute) also applies.
- [Prompt injection through order notes and customer notes] → This text is
  only in `get-order`, in fields named `*_note` or `*_text`, without tags and
  cut to 500 characters. The tool description says that the text comes from
  customers. No tool in this change can write, so injected text cannot cause
  a store change through these tools.
- [`setup-status` writes an option when a step is newly met] → The Home page
  does the same write, it is idempotent, and it changes no merchant data. The
  tool keeps `readOnlyHint` true, and the docs mention the write.
- [Changing `AnalyticsQueryService` can change the Analytics page] → The
  existing analytics tests must pass unchanged. One test asserts that the
  page still gets 5 products when `limit` is not sent.
- [Two open changes touch MCP] → Archive `mcp-sales-report-tool` before this
  change. The new specs do not modify its deltas.

## Migration Plan

There is no data migration. Deploy is a plugin update. Rollback is the
previous plugin version. The tools are additive, and the sales report tool
keeps its name and output.
