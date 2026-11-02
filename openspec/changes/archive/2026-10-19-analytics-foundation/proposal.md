## Why

Merchants have no way to see how their store performs over time. The Home
dashboard shows only four all-time totals. The design team delivered an
Analytics page prototype (`kirki-analytics-v1.html`) and a calculation document
(`kirki-analytics-calculations-v1.md`). A review of both against the code found
calculation gaps that must be fixed before the page is built (see "Corrections
to the calculation document" below).

This is the first of three changes:

1. **analytics-foundation** (this change): data layer, metric definitions, color
   tokens, the Analytics page with its date, comparison and currency controls,
   the default key metrics and the chart and list cards.
2. **analytics-visual-cards** (later): Orders by time of day (heatmap), Sales by
   location (world map) and Product matrix.
3. **analytics-goal-and-customize** (later): the store goal and the per-admin
   Customize panel (choose key metrics, show, hide and reorder cards).

Reports are out of scope for all three. No card, key metric or breakdown line
opens a report.

## What Changes

- New **Analytics** submenu and page (`#/analytics`) in the admin SPA.
- Date range presets and a custom range, comparison (previous period, previous
  year, custom, none), and a currency filter that is shown only for stores that
  sell in more than one currency.
- The four default key metrics: Gross sales, Orders, Average order value,
  Returning customer rate. Each has a value, a change badge and a sparkline.
- 13 cards: Total sales over time, Total sales breakdown, Sales by product,
  Sales by category, Average order value over time, Orders over time, Orders by
  fulfillment status, New vs returning customers, Sales by coupon code, Sales by
  payment method, Taxes collected by region, Shipping charges by method,
  Inventory health.
- Every key metric and every card has an info icon beside its title. The icon is
  hidden until the pointer is over the card (or the card has keyboard focus).
  Its tooltip tells, in brief, how the number is calculated.
- New read-only REST endpoint `GET /analytics/overview`.
- No new database tables. Every request reads the existing order, item, coupon,
  tax, refund, customer, product and variant tables directly, so the numbers are
  always current and there is no copy to keep in sync.
- New analytics color primitives and the `theme.colors.analytics` token group.
- A new user doc, `docs/analytics.md`.

### Corrections to the calculation document

These replace the matching parts of `kirki-analytics-calculations-v1.md`:

| # | Document says | Code shows | This change does |
|---|---|---|---|
| C1 | Sales count `payment_status = 'paid'` only (A10 open) | Refunds can be made through the REST API. A completed full refund sets `payment_status = refunded`. | Sales count `paid`, `refunding` and `refunded` orders. Completed refunds show as a **Returns** line, dated by the completed refund's `updated_at`. Net sales = Gross − Discounts − Returns. |
| C2 | Fulfillment statuses without `returned` | A completed full refund sets `fulfillment_status = returned`. | `Returned` is a status in the fulfillment card, with its own color. |
| C3 | Stock status rules in §5.7 (with "On backorder") | `AvailabilityService::resolve_variant_status()` has no backorder status and uses the store default threshold when a variant has none. | Inventory health uses the same rules as the Inventory screen. |
| C4 | Registered customers and guests with the same email are one customer | The prototype keys registered customers by id and guests by email, so they never match. | A customer is keyed by customer id, else by the customer whose email matches, else by the normalized email. |
| C5 | Weeks run Monday to Sunday | WordPress has a `start_of_week` setting. | Weeks start on the site's `start_of_week` day. |
| C6 | Time zone of saved dates is not known (A13) | Timestamps are saved in UTC. | Every date is converted to the site time zone before it is grouped. |
| C7 | Low-stock threshold and category table names are not confirmed (A14) | `variants.low_stock_threshold` (nullable) and `kirki_ecommerce_category_product` exist. | Uses these columns. |
| C8 | Tax-inclusive Gross/Discounts split is not confirmed (A15) | `base_subtotal` takes the tax out of the full price before the discount. | The document's assumption is correct. No change. |
| C9 | `paid_at` may be missing (A12) | Only the `mark-as-paid` transition reaches a paid state, and it always sets `paid_at`. | The `created_at` fallback stays only as a guard. |
| C10 | Category comes from the order snapshot if it has one (A7) | `order_items.product_data` does not hold categories. | Categories are read live. |
| C11 | AOV = Net sales ÷ Orders | With C1, Net sales includes Returns, which are dated on a different day than the sale. | AOV = (Gross sales − Discounts) ÷ paid orders. This is the same as Shopify's AOV. |

### Not changed (existing code stays as it is)

- **Home dashboard.** `DashboardService` calculates Net sales as Total − Tax −
  Shipping − refunds. Shipping tax is in both `base_tax_total` and
  `base_shipping_total`, so it is subtracted twice. This is a pre-existing bug.
  This change does not fix it, so Home and Analytics can show different Net sales.
- No existing table, migration, model, action or service changes. Refunds have
  no completion date column, so Returns use the completed refund's `updated_at`
  instead of a new column on `kirki_ecommerce_refunds`.

## Capabilities

### New Capabilities

- `analytics-metrics`: what each analytics number means. Facts, which orders
  count, dates and time zone, comparison, granularity, currency, customer
  identity, every metric formula and data freshness.
- `analytics-page`: the Analytics page. Navigation, date, comparison and
  currency controls, the key metrics row, the 13 cards, the info tooltips, and
  the empty, loading and error states.

### Modified Capabilities

- `theme-primitives`: add the analytics color primitives and the
  `theme.colors.analytics` semantic tokens.

## Impact

- **Backend (new):** an analytics range resolver, an analytics query service, a
  controller, a request class, one route and a US state-code data file.
- **Backend (registration only):** `config/menu.php`, `routes/api.php`.
- **Frontend (new):** `resources/app/features/analytics/` (page, cards, SVG
  chart components, service, response schemas, tests).
- **Frontend (registration only):** the route list, and the placeholders in
  `resources/app/theme/index.ts`.
- **Dependencies:** none. Charts are hand-written SVG, as in the prototype.
- **Database:** no new tables and no migrations. Queries use the existing indexes
  on `orders.paid_at`, `orders.created_at`, `orders.customer_id`,
  `orders.customer_email` and the item, coupon and tax `order_id` keys (see
  design.md for the cost on large stores).
- **Docs:** new `docs/analytics.md`.
