## Context

See proposal.md for the motivation and the corrections to the calculation
document. The requirements are in `specs/analytics-metrics`,
`specs/analytics-page` and `specs/theme-primitives`.

These facts from the code shape the approach:

- Kirki's `orders`, `order_items`, `order_coupons`, `order_taxes` and `refunds`
  tables are typed and indexed. Money is integer minor units. `orders` has the
  indexes `(paid_at, order_status)`, `(created_at, order_status)`,
  `(customer_id, created_at)` and `customer_email`. Items, coupons and taxes have
  an `order_id` key. `customers.email` is unique.
- Timestamps (`created_at`, `paid_at`, `updated_at`) are saved in **UTC**. The
  site time zone can have DST and half-hour offsets (`wp_timezone()`).
- A customer or product delete clears `orders.customer_id` or
  `order_items.product_id` through a database foreign key. No PHP code runs.
- Refunds hold only `invoiced_amount`. There is no completion date column.
- WP 6.8 still supports MySQL 5.7 (no window functions, no CTEs). MySQL time
  zone tables are often not loaded on shared hosts, so `CONVERT_TZ()` with named
  zones cannot be used.
- The rule for this change is: **do not change existing behavior**. New
  files, plus registration in `config/menu.php`, `routes/api.php`,
  `resources/app/config/endpoints.ts`, the SPA route list and the theme
  placeholders.

## Goals / Non-Goals

**Goals:**

- Correct numbers by the definitions in the specs, always current, with one
  request per page load.
- No copy of order data, so there is nothing to keep in sync.
- One query layer that changes 2 and 3 (heatmap, map, matrix, goal) build on.

**Non-Goals:**

- Reports, report pages, CSV export, saved reports.
- Customize, KPI selection and goals (change 3). Heatmap, map and matrix
  (change 2). They use the same range and offset helpers (D2) for hour and
  weekday.
- Any change to the Home dashboard or to how orders and refunds are saved.
- New indexes on existing tables. They change existing migrations, so they are
  a separate change if profiling shows a need.
- Stock history. Inventory stays live.

## Decisions

### D1. Query the source tables at request time

`AnalyticsQueryService` reads `orders`, `order_items`, `order_coupons`,
`order_taxes`, `refunds`, `customers`, `products`, `category_product` and
`variants` directly. There are no analytics tables, no migrations, no sync, no
lock, no background job and no "preparing" state.

- **Sales orders:** `payment_status IN ('paid','refunding','refunded')`, the
  current `base_currency_code`, and a sales date in the range (D2).
- **Placed orders:** `payment_status <> 'failed'`, the current base currency,
  `created_at` in the range.
- **Order money:** `orders` columns for shipping, shipping tax, taxes and total.
  Gross and Net come from a derived table over `order_items`
  (`SUM(base_subtotal)`, `SUM(base_total - base_tax_total)` grouped by
  `order_id`), joined to the orders in the range. The currency filter switches
  every column to its `invoiced_` sibling and adds `currency_code = :code`.
- **Coupons and taxes:** `order_coupons` and `order_taxes` joined to the sales
  orders in the range.

**Alternatives considered:**

- *Lookup tables at row grain (WooCommerce pattern).* This was the first design,
  and it was implemented, then removed on the user's review. WooCommerce needs
  lookup tables because its orders lived in `wp_posts` and `wp_postmeta`. Kirki's
  order tables are already typed and indexed, so the copy was redundant. It also
  needed a sync, a lock, change detection for foreign-key writes, a preparation
  state and a time zone rebuild. The verifier found two blocking bugs in that
  machinery (a lock race, and deleted products that were never seen).
- *Daily summary table.* It cannot give distinct customers, new or returning
  customers, or distinct orders per product over a range, and a time zone change
  breaks every bucket. Rejected.

### D2. Store-local dates without MySQL time zone tables

- **Range filter.** PHP converts the local range start (00:00) and the day after
  the range end (00:00) to UTC with `wp_timezone()`. Queries filter
  `ts >= :utc_start AND ts < :utc_end`, so the existing indexes on `paid_at` and
  `created_at` are used. The sales date filter is
  `(paid_at >= :a AND paid_at < :b) OR (paid_at IS NULL AND created_at >= :a AND created_at < :b)`.
- **Local date of a row.** PHP reads the UTC offset transitions inside the range
  from `DateTimeZone::getTransitions()`. It builds one SQL expression:
  `DATE(DATE_ADD(ts, INTERVAL CASE WHEN ts < :t1 THEN :o0 WHEN ts < :t2 THEN :o1 … ELSE :on END SECOND))`.
  Most ranges have one or two parts. This is exact for DST and for +5:30/+5:45
  zones. The same expression gives the local hour and weekday for change 2.
- **Week start** comes from `start_of_week` at request time.

### D3. Customer key and first paid order

- **Key (SQL):** `LEFT JOIN customers ce ON ce.email = o.customer_email`, then
  `CASE WHEN o.customer_id IS NOT NULL THEN CONCAT('c:', o.customer_id) WHEN ce.id IS NOT NULL THEN CONCAT('c:', ce.id) WHEN TRIM(o.customer_email) <> '' THEN CONCAT('e:', LOWER(TRIM(o.customer_email))) ELSE CONCAT('o:', o.id) END`.
  The email join uses the unique index. The table collation already ignores
  case. Because the key is calculated at request time, a guest who registers
  later, a merge and a deleted customer are always grouped correctly.
- **First paid order:** a derived table over **all** sales orders of the
  customers that appear in the range (found through `customer_id` and
  `customer_email`, both indexed). It groups by key and takes the earliest sales
  date, ties broken by the lowest order id. The range query joins it, so SQL
  returns one row per (bucket, key) with "has first order in bucket" and "has a
  non-first order in bucket" flags. PHP then counts new, returning and customers.
- `o:<order id>` (an order without an email) counts as its own customer. This is
  documented in `docs/analytics.md`.

### D4. Returns and deleted products

- **Returns:** `refunds r JOIN orders o` (sales order, current base currency,
  optional currency filter), `r.status = 'completed'`, `r.updated_at` in the UTC
  range, local date by D2. The base amount is
  `ROUND(r.invoiced_amount * o.base_total / o.invoiced_total)`, which is half up
  on exact decimals, and 0 when `invoiced_total = 0`. With a currency filter it
  is `r.invoiced_amount`.
- **Deleted products:** `LEFT JOIN products p ON p.id = i.product_id`. The group
  key is `CASE WHEN p.id IS NULL THEN CONCAT('n:', i.product_name) ELSE CONCAT('p:', p.id) END`,
  and the response's `product_id` is `p.id` (null when deleted). This covers an
  empty `product_id` and a product deleted after the sale.

### D5. Query service: SQL buckets, PHP shaping

Each metric is a `SUM` / `COUNT(DISTINCT)` query. Chart buckets are a SQL
expression on the local date (D2): the date itself; for weeks,
`FLOOR(DATEDIFF(local_date, :aligned_start) / 7)`, where `:aligned_start` is the
week start day on or before the range start; for months,
`DATE_FORMAT(local_date, '%Y-%m')`. So distinct counts are correct per bucket.
PHP fills empty buckets, builds labels and matches the comparison series by
position.

Names are resolved after aggregation: product titles and thumbnails (live, with
fallback to the saved name), category names through
`kirki_ecommerce_category_product`, payment provider and shipping method names
(live, else the newest order's metadata snapshot, fetched only for ids with no
live name), and region names (state id, then state name, then the US state code
through `resources/data/us-state-codes.php`, whose names are translatable and
which includes PR, GU, VI, AS, MP and UM). Inventory health reads `variants` live
and calls `AvailabilityService::resolve_variant_status()` with the store default
threshold, so it always agrees with the Inventory screen.

### D6. One endpoint, one response

`GET /analytics/overview?range=last_30&from=&to=&compare=previous_period&compare_from=&compare_to=&currency=`
returns `{ range, compare, granularity, currencies, base_currency_code,
has_orders, kpis{…}, cards{…} }`. Each money value ships as a money object
through `Money::prepare_amount_object_from_minor()` in the selected currency, to
follow the money-field rules. Request validation goes in
`AnalyticsOverviewRequest`: `currency` is `size:3`, and an upper-cased code that
`Brick\Money\Currency::of()` does not know is a 422 field error on `currency`.
Access goes through the existing admin API permission pattern
(`manage_options`).

One response means one network round trip and keeps the KPIs and cards
consistent. Per-card endpoints can come later if profiling shows one card is
slow.

### D7. Frontend structure

`resources/app/features/analytics/` follows the existing feature layout:
`pages/analytics.tsx`, `components/` (controls, KPI card, the cards, `charts/`),
`services/analytics.ts` (TanStack Query, `parseData`),
`schemas/catalog/analytics.ts` (lenient zod response schema), `lib/` (pure
date-range, granularity, change and label helpers), `tests/`.

- **Controls state** is kept in the URL query (`useSearchParams`) and is the
  query key. The date picker reuses `components/ui/calendar`.
- **Charts** are small hand-written SVG components (`LineChart`, `BarChart` with
  stacked mode, `DotChart`, `Sparkline`, `HBarList`, `SegmentedBar`), drawn with
  `theme.colors.analytics` tokens and a shared hover/focus tooltip. No chart
  library is added. This keeps the wp.org bundle small and matches the
  prototype's visual language.
- **Info tooltip.** There is a new `AnalyticsCardTitle` with a focusable icon
  button that wraps the existing `Tooltip`. The card styles hide the icon with
  `opacity: 0` and show it on `:hover`, on keyboard focus inside the card and in
  `@media (hover: none)`. The existing `OverviewTitle` stays unchanged. All
  tooltip texts live in one `lib/metric-definitions.ts` map, wrapped in `__()`,
  so the page and `docs/analytics.md` use the same text.
- There is no polling. One request per change of the controls.

### D8. Colors

The primitives and tokens are as specified in `specs/theme-primitives`, filled
into the placeholders that already exist in `theme/index.ts`. Design colors that
equal an existing primitive reuse it. Alpha grays within 0.02 of an existing
`gray*` reuse that gray instead of adding near-duplicates. The goal and map
tokens are defined now (they cost nothing) so that changes 2 and 3 only use
them.

## Risks / Trade-offs

- [Each request aggregates the source rows of the range and the comparison
  range] → Short ranges read few rows through the time indexes. Long ranges
  (12 months, year to date) on stores with 100k+ orders do more work, mainly the
  item join and the first-paid derived table. Mitigation: measure on a large
  seed. If one query is slow, add one focused index or cache in a separate
  change. The definitions do not change.
  **Measured (third verification, MariaDB 12.2, synthetic data):** the
  first-paid derived table runs 4 times per request (buckets and total, for the
  range and the comparison), and its trimmed-email branch reads all-time sales
  orders without an index, also for "Today". The request costs about 2.5 s at
  80k paid orders and about 19 s at 320k with default temp-table limits. The
  user accepted this as a known risk for now. Planned fix: one
  `GROUP BY … WITH ROLLUP` customer query per window, which halves the cost.
- [The Returns date is `refunds.updated_at`] → An edit to a completed refund
  moves its Returns amount to the edit day (spec scenario "Refund edited after
  completion"). A real `completed_at` column is a follow-up outside this
  change's rule.
- [Returns are one amount per refund, not split into product, shipping and
  tax] → Net sales can be a little too low when a refund includes shipping or
  tax. Taxes and Shipping charges are not reduced. This is documented in
  "Where this differs" in `docs/analytics.md`.
- [The email join is an exact match] → An order email with extra spaces does not
  match its customer through the index. Such an order still groups by its
  trimmed, lower-cased email.
- [Categories are read live (C10)] → A product that moves category moves its
  old sales with it. This is documented.
- [Home and Analytics show different Net sales] → This is known and accepted.
  It is documented. The Home fix is a separate change.

## Migration Plan

- No migrations and no new tables. Analytics is read-only on existing data.
- The four analytics migrations from the first implementation were never
  committed or released. They are deleted together with their registration in
  `config/migrations.php`.
- Development and test databases that ran the first implementation still have
  the four `kirki_ecommerce_analytics_*` tables. Drop them by hand there. The
  plugin does not drop them, because no released version created them.
- **Rollback:** remove the menu entry and the route.

## Open Questions

None. The decisions from the review are in proposal.md (C1–C11) and in D1–D6.

## Test contract

The red tests assume the interfaces below. Where design.md left a name open, the
choice is made here. The implementer builds to this contract and does not edit
the tests.

### PHP seams (production code adds these; tests set them)

| Seam | Contract |
|---|---|
| Frozen "today" | `apply_filters('kirki_ecommerce_analytics_today', null)`. When it returns a `Y-m-d` string, that date (in the site time zone) is "today" for presets, the future-date check and granularity. When it returns `null`, today is `wp_date('Y-m-d')`. |

### PHP classes

- `Kirki\Ecommerce\App\Menu\Analytics` extends `Menu` like `Orders` (`$menu_slug = 'kirki-ecommerce#/analytics'`, `$parent_slug = 'kirki-ecommerce'`, `$capabilities = 'manage_options'`) and sits right after `Orders::class` in `config/menu.php`.
- `AnalyticsRangeResolver`, `AnalyticsQueryService` and `AnalyticsOverviewRequest` are not called by the tests directly. They are covered through the endpoint.
- There are no analytics tables, models, sync service, row builder or job (D1). Tests assert only through the endpoint.
- **Customer key format** (internal, not in the response): `c:<customers.id>`, `e:<lower-cased trimmed email>`, `o:<order id>` (D3).

### REST: `GET kirki/ecommerce/v1/analytics/overview`

Query: `range` (`today|yesterday|last_7|last_30|last_90|last_12_months|month_to_date|year_to_date|custom`, default `last_30`), `from`, `to` (`Y-m-d`, for `custom`), `compare` (`previous_period|previous_year|custom|none`, default `previous_period`), `compare_from`, `compare_to`, `currency` (code). The response is the usual `{success, message, data}` envelope. Validation errors are 422 with `errors.<field>` for `range`, `compare`, `from` and `to` (a custom range that ends after today, or has no `to`, errors on `to`; `from` after `to` errors on `from`). A `currency` that is not 3 letters or not a known ISO 4217 code is 422 with `errors.currency`. A user without `manage_options` gets 403 and a visitor 401. The error body may carry WordPress's `data.status`, and never `kpis` or `cards`.

`data`:

```
{
  range: {preset, from, to, days},            // key order: preset, from, to, days
  compare: {from, to} | null,
  granularity: 'day' | 'week' | 'month',
  currencies: string[],                       // distinct currency_code of counted orders; base currency first
  base_currency_code: string,
  has_orders: bool,                           // any sales order or placed order, in the current base currency, all time
  kpis: { gross_sales, orders, average_order_value, returning_customer_rate },
  cards: { total_sales_over_time, total_sales_breakdown, sales_by_product, sales_by_category,
           average_order_value_over_time, orders_over_time, orders_by_fulfillment_status,
           new_vs_returning_customers, sales_by_coupon_code, sales_by_payment_method,
           taxes_by_region, shipping_charges_by_method, inventory_health }   // this key order
}
```

- **Money metric:** `{current_money_object, previous_money_object, change}`. A money object is the usual `{raw, display, currency: {code, symbol}}`, in the selected currency (base currency when `currency` is empty). `current_money_object` is `null` for an empty Average order value. `previous_money_object` is `null` with no comparison. `change` is a percent number rounded to one decimal (`12.3`, `-4.0`) or `null` (zero comparison, no comparison).
- **Count / rate metric:** `{current, previous, change}`. `returning_customer_rate.current` is a percent rounded to one decimal, `null` when there are no customers.
- **KPI** = metric + `series`. Money KPI series values are minor units (ints); `orders` series are counts; `returning_customer_rate` series are percent numbers or `null`.
- **Series point:** `{date, label, value, previous_date, previous_label, previous_value}`. `date` is the bucket start (`Y-m-d`, the first bucket starts on the range start, never before it). `label` is the short text for the chart tooltip (`Oct 3` for a day, `Oct 3` for the week start, `Oct 2026` for a month). `previous_*` are matched by position and are `null` with no comparison. Empty buckets are present with `0` (money, counts) or `null` (Average order value).
- `cards.total_sales_over_time`: `{total: money metric, series}`.
- `cards.total_sales_breakdown.rows`: money metrics plus `key`, in this order: `gross_sales`, `discounts`, `returns`, `net_sales`, `shipping`, `taxes`, `total_sales`. Discounts and Returns are positive magnitudes (the page shows them as negative). `net_sales` can be negative.
- `cards.sales_by_product.items` (top 5 by net sales): `{product_id|null, name, image|null, is_deleted, units_sold, net_sales_money_object, previous_net_sales_money_object|null, change, availability_status|null, track_inventory, inventory}`. `inventory` is the sum of `max(available_quantity, 0)` of the tracked variants.
- `cards.sales_by_category.items` (top 6): `{category_id|null, name, net_sales_money_object, previous_net_sales_money_object|null}`. The "Uncategorized" row has `category_id = null`.
- `cards.average_order_value_over_time`: `{total: money metric, series}`.
- `cards.orders_over_time`: `{total: count metric, items_ordered: int, series}`.
- `cards.orders_by_fulfillment_status`: `{total_orders, delivered_percent, items: [{status, count, percent}]}`; `items` always lists, in order, `unfulfilled, processing, on-hold, shipped, delivered, returned, cancelled`. `percent` has one decimal.
- `cards.new_vs_returning_customers`: `{total: count metric (Customers), new_total, returning_total, series}`. Series point: `{date, label, new, returning, previous_date, previous_label, previous_new, previous_returning}`.
- `cards.sales_by_coupon_code.items` (top 5 by orders): `{code, orders, discount_given_money_object}`.
- `cards.sales_by_payment_method.items` (top 5 by Total sales): `{id, name, orders, total_sales_money_object}`.
- `cards.taxes_by_region.items` (top 5 by Total tax): `{country, state, name, product_tax_money_object, shipping_tax_money_object, total_tax_money_object}`; `name` is `"<state name>, <country name>"` (`Texas, United States`).
- `cards.shipping_charges_by_method.items` (top 5): `{id, name, orders, shipping_charges_money_object}`.
- `cards.inventory_health`: `{out_of_stock, low_stock, in_stock, lowest: [{variant_id, product_id, product_name, variant_name, available_quantity, status}]}`; `lowest` has at most 4 variants, lowest `available_quantity` first; `status` is `out_of_stock|low_stock|in_stock`.

### Frontend modules (all under `resources/app/features/analytics/`, imported with `@/features/analytics/...`)

| Module | Exports |
|---|---|
| `lib/date-range.ts` | `RANGE_PRESETS` (order: `today, yesterday, last_7, last_30, last_90, last_12_months, month_to_date, year_to_date`), `getRangePresetLabel(preset \| 'custom')` ("Custom range" for `custom`), `getCompareLabel(compare)` ("Previous period", "Previous year", "Custom range", "No comparison"), `resolvePresetRange(preset, today: Date): {from, to}` (`YYYY-MM-DD`, local date parts), `formatRangeDates(from, to)` (`Oct 14, 2026`; `Sep 15 – Oct 14, 2026`; `Oct 15, 2025 – Oct 14, 2026`; en dash with spaces) |
| `lib/url-state.ts` | `DEFAULT_ANALYTICS_PARAMS`, `parseAnalyticsParams(URLSearchParams)`, `serializeAnalyticsParams(params): URLSearchParams`, type `AnalyticsParams = {range, from, to, compare, compare_from, compare_to, currency}` (`null` for unset). Unknown values fall back to defaults. `serialize` writes only what differs from the defaults. A `custom` range without two valid dates falls back to the default range. |
| `lib/change.ts` | `getChangeBadge(change: number \| null \| undefined): {text, direction: 'up' \| 'down' \| 'flat'} \| null` (`12.3` gives `12.3%` up, `-4` gives `4.0%` down) |
| `lib/format.ts` | `formatMoney(money \| null)` (the `display` string, `—` for null), `formatNumber(n \| null)` (`1,234,567`, `—`), `formatPercent(n \| null)` (`33.3%`, `—`) |
| `schemas/catalog/analytics.ts` | `AnalyticsOverviewSchema` (zod, lenient: unknown keys allowed; `kpis` and `cards` required), type `AnalyticsOverview` |
| `services/analytics.ts` | `useAnalyticsOverviewQuery(params: AnalyticsParams)` (TanStack Query; GET `endpoints.ANALYTICS_OVERVIEW = '/analytics/overview'` with `range`, `compare`, and `from/to`, `compare_from/compare_to`, `currency` only when set; `parseData`; no `refetchInterval`; the query key includes the params) |
| `components/analytics-card-title.tsx` | default `AnalyticsCardTitle({title: string, info: string})`: the title text, then a focusable `<button aria-label={info}>` icon wrapped in the shared `Tooltip` |
| `components/analytics-card.tsx` | default `AnalyticsCard({title, info, children, testId?})`: the card shell with `AnalyticsCardTitle`. Reveal styles: icon (`[data-tooltip]` wrapper) `opacity: 0`, `1` on `:hover`, on `:focus-within`, and inside `@media (hover: none)` |
| `components/charts/line-chart.tsx`, `bar-chart.tsx`, `dot-chart.tsx` | default exports taking `{label: string, points: {date, label, value: number \| null, previous_label?, previous_value?}[], formatValue?: (n) => string}`. The root has `aria-label={label}`. Every point is focusable (`tabIndex 0`) with `data-testid="chart-point-<index>"`. Hover (mouse over) or focus on a point shows one `role="tooltip"` element with the point's `label`, `formatValue(value)` and, when `previous_value` is not null, `previous_label` and `formatValue(previous_value)`. Leave or blur hides it. |
| `pages/analytics.tsx` | default `Analytics` page |
| `config/route-config.ts` | `RouteConfig.Analytics = defineRoute('/analytics')` |

### Frontend test ids and DOM rules of the page

- Heading `Analytics`; no "View all reports" text.
- Controls: `data-testid="analytics-date-range"` (text: preset name and the dates), `analytics-compare` (text: comparison name), `analytics-currency` (only when `data.currencies.length > 1`; it has an info button whose name matches "filters orders by their currency ... does not convert"). A click on a control opens a list of buttons whose accessible names are the preset labels, "Previous period / Previous year / No comparison", and the currency codes. A choice calls `useAnalyticsOverviewQuery` with the new params and writes the URL query.
- Key metrics: `data-testid="kpi-<key>"` for `gross_sales`, `orders`, `average_order_value`, `returning_customer_rate`, in this DOM order. Each has the label, the value (`formatMoney` / `formatNumber` / `formatPercent`), `data-testid="sparkline"`, and either `data-testid="change-badge"` with `data-direction` (`up|down|flat`) and `data-tone` (`success` for up, `critical` for down, `neutral` for flat) or, with no comparison, the text `No comparison`. No badge when the change is `null` with a comparison.
- Cards: `data-testid="card-<key>"` with the 13 keys of the response, in order, each with its title text. Breakdown rows have `data-testid="breakdown-row-<key>"`; Net sales and Total sales rows carry `data-emphasis="bold"`. The stock badge text is `N left in stock`; the element (or an ancestor) has `data-tone="critical"` for low or out of stock. The fulfillment headline reads `50% delivered · 12 orders`. The Inventory health note reads `Live, not affected by the date range`.
- Info icons: every KPI and card has a `<button>` named exactly by its tooltip text from the analytics-page spec.
- States: loading renders four `data-testid="kpi-skeleton"` and 13 `data-testid="card-skeleton"` (no real KPIs or cards). Error renders `QueryErrorState` ("Something went wrong", "Try Again" calls `refetch`). Empty store (`has_orders` false) renders the banner and, in each card except Inventory health, an element `data-testid="card-empty"`. A card has "no data" when its items are empty, or all its series values are `0`/`null`, or its totals are all `0`; it then shows `card-empty` with the text `No data for this date range` (this text also shows for the empty store). Inventory health never shows `card-empty`.
- The rounding note shows in `card-total_sales_breakdown` when `params.currency` is set and differs from `data.base_currency_code`.
- Tests render the page inside `#wpbody-content > .kirki-ecommerce-root` because the scoped styles are prefixed with it. The page test mocks `@/features/analytics/services/analytics` and expects the hook result to have `{data, isLoading, isPending, isError, error, refetch}`.

### Not covered by a test (and why)

- Card grid rules (two in a row, "full" cards, a lone card fills its row, one column under 720px) are CSS layout that jsdom cannot evaluate. They are left to the visual check in task 10.2.
- The `AnalyticsRangeResolver`-style helpers are tested only through the endpoint (`range`, `compare`, `granularity`).


## Correction during implementation

_The first note (sync without watermarks) belongs to the first, lookup-table implementation and is superseded by the last section._

- **Sync without watermarks (D2).** The design kept an orders, refunds and customers watermark. The
  implementation compares each order with its stored row instead: an order is rebuilt when it has no row or
  when `COALESCE(orders.updated_at, orders.created_at)` differs from `analytics_orders.source_updated_at`. This
  also finds an order that is added with an old `updated_at`. Guest rows whose email now matches a customer,
  and rows whose customer was deleted, are found by two joins and rebuilt. Completed refunds that have no row
  are added, and refund rows that are no longer completed are deleted. Only the preparation keeps state: the
  options `kirki_ecommerce_analytics_preparation` (cursor and target time zone), `..._timezone`, `..._lock` and
  `..._job_dispatched_at`. The incremental sync does not use the time budget. Only the preparation does.
- **403 payload.** `AnalyticsOverviewApiTest::test_user_without_manage_options_gets_403_and_no_data` asserts that
  the 403 response has no `data` key. The admin route group (`AuthMiddleware`, `AdminMiddleware`) rejects
  inside the REST permission callback, and WordPress turns that error into `{code, message, data: {status}}`.
  The same happens for every admin endpoint. The route uses that group (D6), so the test cannot pass. A check in
  the controller instead would pass the test but would leave the standard admin permission pattern.
- **Inventory counts.** `AnalyticsMetricsTest::test_untracked_variants_use_the_in_stock_flag_and_ignore_the_range`
  expects in stock to rise by 1 after `create_product()` (one untracked in-stock default variant) and two more
  untracked variants (one in stock, one out). By the spec rules the rise is 2 in stock and 1 out of stock.
- **State names.** Orders created in the checkout save the state ID, but the tests save a code (`TX`). The state
  name is found by ID, then by name, then, for the United States, by code through the new
  `resources/data/us-state-codes.php`.
- **Focus reveal.** The card sets `data-focused` on focus and blur inside the card, and the style shows the icon
  for `[data-focused="true"]`. The design asked for `:focus-within`. jsdom keeps the result of a selector that
  `getByRole` evaluated before the focus change, so `:focus-within` never shows the icon for focus on a sibling.
- **Endpoint constant.** `config/endpoints.ts` gets `ANALYTICS_OVERVIEW`, because the test contract names
  `endpoints.ANALYTICS_OVERVIEW`.

## Correction during implementation: lookup tables removed (2026-10-18)

- The user reviewed the first implementation and the verifier report and chose
  to remove the four analytics tables. They copied data that Kirki's typed,
  indexed order tables already hold, and they needed a sync system that caused
  two of the three blocking verifier issues (the `add_option` lock race and
  deleted products that the sync never saw). D1–D4 now describe request-time
  queries on the source tables.
- Removed: the migrations `CreateAnalytics*Table`, the models `Analytics*`,
  `AnalyticsSyncService`, `AnalyticsRowBuilder`, `PrepareAnalyticsJob`, the
  preparing response and page state, the 5-second polling, and the chunk, time
  budget and option seams.
- Spec changes: Returns are dated by the completed refund's `updated_at`;
  "deleted product" includes a product deleted after the sale; Data freshness
  has no preparation step; an unknown currency is a 422.
- Kept from the verifier report: the US state-code fallback, with translatable
  names and the US territories added.

## Correction during implementation: request-time queries

- **`customers.email` is not unique.** D3 and the Context assumed a unique
  index, but `CreateCustomersTable` has a plain index `idx_kecom_customers_email`.
  A `LEFT JOIN` on the email could repeat order rows and inflate the sums. The
  customer key uses `(SELECT MIN(ce.id) FROM customers ce WHERE ce.email =
  TRIM(o.customer_email))`, which uses the same index and returns one row.
- **Item sums are correlated subqueries, not a derived table.** A derived table
  over all of `order_items` is read in full before the join (MySQL 5.7). The
  query service uses `(SELECT SUM(...) FROM order_items i WHERE i.order_id =
  o.id)` per sales order, which uses the `order_id` foreign key index. The
  results are the same as D1. The payment method card uses the same sums.
- **First paid order uses the trimmed email.** The test
  `test_guest_emails_are_trimmed_and_lower_cased` needs a guest order with a
  padded email to match one without padding. An index lookup on the raw email
  cannot find it, so one branch of the first-paid derived table filters by
  `TRIM(customer_email)`. This branch reads the sales orders without an index.
  The `customer_id` branches use the index. The first paid order is the lowest
  `CONCAT(sales time in UTC, order id)`, so the tie-break is the sales time,
  then the order id (not the local day, which would need the offset `CASE` over
  all history).
- **Totals are sums of the bucket rows.** Paid orders, gross, net, shipping,
  taxes, returns, placed orders and items ordered are additive, so the window
  total is the sum of its bucket rows. Only the customer counts need a second,
  ungrouped query. A window costs 5 queries: sales, customers by bucket,
  customers total, returns, placed. The cards add about 10 more queries for two
  windows.
- **Currency code check.** `Currency::of()` also accepts numeric ISO codes
  (`840`), so the request first requires 3 letters, then `Currency::of()`.
- **Time zone of the database session.** The offset `CASE` and the bounds
  assume the MySQL session reads and writes TIMESTAMP columns in UTC, as the
  rest of the plugin does.
- **End bound and first-paid email branch (group 12).** `utc_bounds()` builds
  the end bound as local 00:00 of the next calendar day, with the next date
  calculated in UTC, so a DST gap at midnight cannot move it by one hour. The
  trimmed-email branch of the first-paid query joins a derived table of window
  emails (`INNER JOIN (… UNION …) w`) instead of `IN (… UNION …)`, and the
  first-paid SQL is built once per window for the bucket and total customer
  queries. `EXPLAIN` (MariaDB 12.2) no longer shows the `DEPENDENT SUBQUERY` /
  `DEPENDENT UNION` of that branch. Three `DEPENDENT SUBQUERY` rows remain: the
  indexed `MIN(ce.id)` lookups of the customer key and the email `IN` of branch 2.
