## Context

- The Home page (`resources/app/features/home/pages/home.tsx`) comes from the
  unarchived change `merchant-home-setup-checklist`. It renders the heading, the
  `SetupChecklist` and the `TemplateGallery` in a `Page containerSize="sm"`.
- `GET /setup-checklist` returns the visible server steps with `is_completed`.
  Completion is sticky in `wp_options`. `useSetupChecklistQuery` already caches
  this response under `['SetupChecklist']`, and the complete-step mutation writes
  the new state into that cache.
- Orders store base-currency columns (`base_total`, `base_tax_total`,
  `base_shipping_total`) and the frozen `exchange_rate`. Order items store
  `quantity`, `base_total`, `product_name` and `product_image` as a snapshot.
  Refunds store only `invoiced_amount` (order currency) and a `status`
  (`pending`, `completed`, `cancelled`).
- `AppConfigService` already sends `current_user` (with `first_name` and
  `display_name`) to the SPA. `useCurrentUser()` reads it.
- No aggregate or reporting endpoint exists yet.

## Goals / Non-Goals

**Goals:**
- One request that returns all overview data, computed with SQL aggregates.
- No new tables, options or caches.

**Non-Goals:**
- Date ranges, comparisons, charts or a reports page.
- Caching or pre-computing the aggregates.
- A "top products" page. "View all products" opens the normal products list.

## Decisions

### 1. Gate on the checklist query in the page

`home.tsx` reads `useSetupChecklistQuery()`. When the data is loaded and
`steps.every((step) => step.is_completed)`, it renders dashboard mode. Otherwise
it renders the current checklist mode. The overview query is enabled only in
dashboard mode, so stores in setup do not run the aggregate queries.

While the checklist query is loading, the page uses the boot flag
`window.kirki_ecommerce.is_setup_complete` (from `Assets::get_kirki_ecommerce_configs()`).
`SetupChecklistService::is_complete()` reads only the stored completions of the
visible steps, so it does not run the step rules on every admin page load. When
the checklist response arrives, it decides the mode.

*Revised during review*: the first version showed the checklist skeleton while
the query loaded. A completed store then drew the narrow checklist skeleton and
changed to the wide overview, which shifted the layout. The flag is only the
first guess: the checklist response stays the source of truth, so the two cannot
disagree after the merchant completes a step on the page. A step whose data was
added outside Home is recorded by the next checklist request, so the flag can be
false once for that store and then corrects itself.

### 2. One `DashboardService` with three queries

`GET /dashboard/overview` → `DashboardController::overview()` →
`DashboardService::get_overview()`, which returns `metrics`, `recent_orders` and
`top_products`. The counted payment statuses are one constant list in the
service (`PaymentStatus::PAID`, `REFUNDING`, `REFUNDED`).

- **Metrics**: one aggregate over orders with counted statuses:
  `SUM(base_total)`, `SUM(base_tax_total)`, `SUM(base_shipping_total)`,
  `COUNT(*)`. Products sold: `SUM(order_items.quantity)` joined to counted orders.
- **Refunds in base currency**: `SUM(refunds.invoiced_amount * orders.base_total
  / orders.invoiced_total)` over completed refunds joined to counted orders,
  rounded to an integer minor amount. Using the order's own base/invoiced ratio
  is the same as using the frozen rate, and it does not need to know the
  direction of `exchange_rate`. Orders with `invoiced_total = 0` are skipped to
  prevent division by zero.
- **Net sales** = total − tax − shipping − refunds (base), computed in PHP from
  the sums above.
- **Top products**: order items of counted orders `GROUP BY product_id`, with
  `SUM(quantity)` and `SUM(base_total)`, `ORDER BY units DESC, revenue DESC`,
  `LIMIT 5`. Name and image come from the newest order item of each product, so a
  deleted product still has them. Items with `product_id IS NULL` are grouped by
  `product_name`.
- **Recent orders**: `ORDER BY created_at DESC, id DESC LIMIT 5`, any status.

Money values go out as money objects (`Money::prepare_amount_object_from_minor`)
like the order resources: base currency for metrics and top products, order
currency for recent order totals.

*Alternative*: reuse `GET /orders` for recent orders. Rejected: it returns full
order resources and a second request. One endpoint keeps one loading state and
one error state for the overview.

### 3. Frontend structure

In `features/home/`:
- `schemas/catalog/dashboard-overview.ts`: Zod response schema, with a test.
- `services/dashboard.ts`: `useDashboardOverviewQuery({ enabled })`, using
  `parseData`, the same as `setup-checklist.ts`.
- `components/dashboard-overview.tsx` (grid + loading/error),
  `metric-card.tsx`, `recent-orders-card.tsx`, `top-products-card.tsx` and a
  small `overview-card.tsx` shell that owns the title and the hover action.
- `lib/greeting.ts`: pure `getWelcomeName(user)`, with a test.

Both list cards use the shared `StackedItems` component. The fulfillment status
label comes from `getFulfillmentBadgeInfo` in `features/orders/lib/order-badge`. Order detail and
list links come from `RouteConfig`.

### 4. Hover action visibility in CSS

The action button stays in the DOM. The card shell hides it with
`opacity: 0` and shows it on `:hover` and `:focus-within`, and under
`@media (hover: none)` it is always shown. Keyboard users can reach it by Tab, and
no JS state is needed.

### 5. Wider container in dashboard mode only

Dashboard mode uses a larger `Page` container (the next size the `Page` component
supports, chosen during implementation). The metric grid uses CSS grid with
4 / 2 / 1 columns at the theme breakpoints. Checklist mode keeps `sm`.

### 6. Information tooltips

A small `OverviewTitle` component puts an `InfoIcon` with the shared `Tooltip`
after a title. The metric cards and `OverviewCard` use it. The shared
`InfoTooltip` is not used because it positions its icon absolutely, for input
fields.

### Correction during implementation

- **Refunds are summed in two queries, not one SQL `SUM`.** Raw SQL from the
  query builder does not get the table prefix, so a join inside `select_raw` is
  fragile. The service groups completed refunds by `order_id`, then reads those
  orders' `base_total` / `invoiced_total` and scales each refund in PHP. The row
  count is the number of refunded orders, which stays small.
- **Order filters use a subquery** (`where_in('order_id', <counted order ids>)`)
  instead of a join, for the same prefix reason.

## Risks / Trade-offs

- [Net sales subtracts the full refund, including any tax or shipping in it, so
  refunded tax is subtracted twice] → Accept for now: refunds have no tax split.
  Document this in `docs/home.md` under "Where this differs from WooCommerce".
- [All-time aggregates get slower on large order tables] → The order filter can use
  the existing `(payment_status, order_status, updated_at)` index, and there is one request per Home visit. Add
  caching later if a real store needs it.
- [Products sold does not subtract refunded units] → Refunds do not record items.
  Document this as a gap.
- [A merchant in a non-admin role cannot see the overview] → Same rule as every
  other admin endpoint.

## Migration Plan

No data migration. The endpoint and UI are new. Rollback is reverting the change.
