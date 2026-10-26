## 1. Update framework-mcp (input_schema rename)

- [x] 1.1 Run `composer update ahamed/framework-mcp` to get upstream commit `128fe0c` or later ("Rename Tool::schema() to input_schema()"), and confirm that `composer scope` rebuilt `vendor/libraries/framework-mcp/src/` with `Tool::input_schema()` (design §1)
- [x] 1.2 Rename `SalesReportTool::schema()` to `input_schema()`. Search `app/` and `tests/` for `function schema(` and for `->schema(` calls, and fix each one (design §1)
- [x] 1.3 Change `docs/mcp.md` §6 "Adding a tool" from `schema()` to `input_schema()`
- [x] 1.4 Add a test to `tests/Integration/McpSalesReportToolTest.php`: `input_schema()` of the sales report tool has `range` with the preset enum and the default `last_30`. The test fails if the tool still has only `schema()`
- [x] 1.5 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 2. Shared tool code

- [x] 2.1 Create `app/Mcp/Tools/StoreReadTool.php` (abstract, extends the scoped `Tool`): read-only, idempotent, not destructive, not open-world; `permission()` checks `manage_options`; helpers `validate_arguments()`, `money()`, `datetime()` and `store_text()` (design §2; spec mcp-read-tool-conventions)
- [x] 2.2 Create `app/Mcp/Concerns/MasksPersonalData.php` with `mask_email()` and `first_name()`, with the rules in design §4
- [x] 2.3 Create `app/Mcp/Concerns/PagesResults.php`: the `page` and `per_page` schema fragments (default 1 and 20, `per_page` from 1 to 100), the rules and messages, and `pagination(ListPaginator)` that returns `page`, `per_page`, `total` and `total_pages`
- [x] 2.4 Create `app/Mcp/Concerns/ReadsAnalyticsRange.php` from the range schema, rules, messages and date checks of `SalesReportTool`. Make `SalesReportTool` extend `StoreReadTool` and use the trait, with no change to its output (design §2)
- [x] 2.5 Add `tests/Unit/Mcp/MasksPersonalDataTest.php` (normal email, one-character local part, no `@`, empty value) and `tests/Integration/McpStoreReadToolTest.php` (`store_text()` removes tags and cuts to 500 characters; `money()` shape; `datetime()` in the site time zone)
- [x] 2.6 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'` (the sales report tests pass unchanged), `composer test:unit`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 3. Analytics service changes

- [x] 3.1 In `AnalyticsQueryService`, read an optional `$params['limit']` in `get_metric()`. Use it in place of `PRODUCT_LIMIT`, `CATEGORY_LIMIT` and `LIST_LIMIT` in the product, category, coupon, payment method, shipping method and tax region builders (design §5)
- [x] 3.2 Add the public method `stock_levels(array $statuses, int $per_page, int $page)`: counts by status and a page of variants, lowest quantity first, with SKU and the threshold that applies. Make `build_inventory_health()` use it with `LOWEST_STOCK_LIMIT` (design §5)
- [x] 3.3 Add tests to the analytics integration tests: with no `limit`, the page still gets 5 products and 6 categories; `limit` 10 gives 10 products; `stock_levels()` counts equal the Inventory health card; a variant threshold overrides the store default; untracked variants are never low
- [x] 3.4 Verify: the full analytics integration tests pass unchanged (`bash kirki-ecommerce-test integration --filter='Analytics'`), `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 4. Analytics tools

- [x] 4.1 Create `SalesTrendTool`: range arguments; series from `total_sales_over_time`, `orders_over_time` and `average_order_value_over_time` joined by bucket; range totals with `previous` and `change` (spec mcp-analytics-tools: Sales trend tool)
- [x] 4.2 Create `ProductPerformanceTool`: `by` (`product`/`category`), `limit` 1–25 with defaults 5 and 6; rows from `sales_by_product` / `sales_by_category` (spec: Product performance tool)
- [x] 4.3 Create `SalesBreakdownTool`: `by` (`coupon`, `payment_method`, `shipping_method`, `country`, `region`, `tax_region`), `country` needed for `region` (from `get_regions()`), `limit` only for the ranked dimensions (spec: Sales breakdown tool; design §5)
- [x] 4.4 Add `tests/Integration/McpAnalyticsToolsTest.php` with `SeedsAnalyticsData`: same range as the sales report, daily series of 7 points, numbers equal to `get_metric()`, top-10 products, default category limit, `limit` over 25, sales by coupon, `region` without `country`, regions of one country, and every validation error in the spec
- [x] 4.5 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 5. Order tools

- [x] 5.1 Create `FindOrdersTool`: arguments mapped to `OrderListFilterDTO` (`per_page` to `limit`, `from`/`to` to `from_date`/`to_date`), `sort_by` allow-list `created_at` and `invoiced_total`, masked rows (design §3, §4; spec mcp-order-tools: Find orders tool)
- [x] 5.2 Create `GetOrderTool`: `order_id` or `order_number`; full order with items, coupons, tax lines, refunds, tracking and addresses; `include_activity` with at most 50 entries from `OrderActivityService`, newest first; customer text through `store_text()`; tool error when the order is not found (spec: Get order tool)
- [x] 5.3 Add `tests/Integration/McpOrderToolsTest.php`: status and fulfillment filters, search by order number, search by full email returns masked data, default paging and `pagination` values, `per_page` over 100, unknown status, get by ID and by number, timeline order and cap, long HTML note cleaned, not found, no identifier
- [x] 5.4 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 6. Catalog, customer, coupon and setup tools

- [x] 6.1 Create `FindProductsTool`: filters mapped to `ProductListFilterDTO`, trashed products hidden unless `status` is sent, rows with price range, variant count, tracked quantity and category names (spec mcp-catalog-tools: Find products tool)
- [x] 6.2 Create `StockLevelsTool` on `AnalyticsQueryService::stock_levels()`, `status` (`out_of_stock`, `low_stock`, `attention`) (spec: Stock levels tool)
- [x] 6.3 Create `FindCustomersTool`: `search`, `country`, `city`, `sort_by` allow-list `created_at`, `orders_count`, `base_amount_spent`, `last_order_date`; masked rows with no phone or address (spec mcp-customer-tools)
- [x] 6.4 Create `FindCouponsTool`: `search`, `status`, `method`, `discount_type` mapped to `CouponFilterDTO`; rows with value, dates, usage count and limits (spec mcp-coupon-tools)
- [x] 6.5 Create `SetupStatusTool` on `SetupChecklistService::get_state()` and `is_complete()`, with the admin page path for each step (spec mcp-setup-status)
- [x] 6.6 Add integration tests: `McpCatalogToolsTest` (filters, trashed hidden, full low-stock list, variant threshold, unknown status), `McpCustomerToolsTest` (sort by spend, country filter, masked data, no phone), `McpCouponToolsTest` (status filter, usage near limit, unknown method), `McpSetupStatusToolTest` (new store, step done after a product is added)
- [x] 6.7 Verify: `bash kirki-ecommerce-test integration --filter='Mcp'`, `composer phpcs:wporg`, `composer phpcs:docblocks`, and `npm run typecheck && npm test` in `resources/app/`

## 7. Server registration, access and docs

- [x] 7.1 Add the 10 tool classes to `StoreServer::$tools`
- [x] 7.2 Extend `tests/Integration/McpServerTest.php`: the server lists 11 tools. Add a data-provider test over the 10 new tools: annotations (read-only, idempotent, not destructive, not open-world), `permission()` true for an administrator and false for an editor and for no user, and the ability is not public (spec mcp-read-tool-conventions)
- [x] 7.3 Update `docs/mcp.md`: intro and server table list the 11 tools; one reference section for each new tool (arguments, output fields, errors, example questions); a section on masked personal data and customer-written text; the `setup-status` option write; update "Where this differs from the Analytics page" (product, category and breakdown data are now available; the remaining gaps); manual check steps for the new tools
- [x] 7.4 Ask the user to check on a site with the MCP Adapter plugin: `tools/list` shows 11 tools with read-only annotations, one call per new tool, masked emails in `find-orders`, and the numbers of `sales-trend` and `product-performance` equal the Analytics page. Record any correction in `design.md`
- [x] 7.5 Verify: `composer test` (unit and integration in Docker), `composer phpcs:wporg`, `composer phpcs:docblocks`, `openspec validate mcp-read-only-store-tools`, and `npm run typecheck && npm test` in `resources/app/`
