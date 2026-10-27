## Context

`AnalyticsQueryService::get_overview()` resolves the range, runs
`collect_window()` (6 SQL queries) for the current window and for the
comparison window, then builds the KPIs and all 15 cards. The KPIs and 5 cards
(Total sales over time, Total sales breakdown, Average order value over time,
Orders over time, New vs returning customers) read the window totals and
series. The other 10 cards run their own queries. Inventory health ignores the
range.

The page uses one TanStack Query (`useAnalyticsOverviewQuery`) and renders
skeletons for everything until it resolves. About 98 PHP integration
assertions read the overview payload through the `overview()` helper in
`tests/Support/SeedsAnalyticsData.php`.

## Goals / Non-Goals

**Goals:**
- A card shows as soon as its own data is ready.
- A key that fails does not hide the other cards.
- The payload of each card stays the same as its part of the old `cards`
  object, so the card components and the Zod card schemas do not change.

**Non-Goals:**
- No server cache. No change to the SQL queries.
- No change to `GET /analytics/regions` or to the URL state of the page.
- No batching of keys into groups (the user chose one key per card).

## Decisions

### 1. One route with a key parameter

`Route::get('/analytics/metrics/{key}', [AnalyticsController::class, 'metric'])`.
The controller reads `$request->string('key')`. When the key is not in
`AnalyticsQueryService::METRIC_KEYS`, it returns 404 with the message
"Unknown analytics metric.", before the range validation result is used.
The request class `AnalyticsOverviewRequest` is renamed to
`AnalyticsMetricRequest`, with the same rules. `AnalyticsRegionsRequest`
extends it, as it extends the old class now.

Alternative: a route per key. Rejected: 16 routes with the same handler.

### 2. A builder map in the service

`METRIC_KEYS` is a constant list: `kpis` and the 15 card keys in page order.
`get_metric(string $key, array $params)` sets the table prefix and the base
currency, resolves the range, and calls a builder for the key. A builder that
needs the windows calls `collect_window()` for the current and the comparison
window, as `get_overview()` does now. The other builders call only their own
`build_*` method. `build_cards()` is split by key; the existing `build_*`
methods do not change.

Response: `['meta' => $this->build_meta($range), 'data' => <builder result>]`.
`build_meta()` returns `range`, `compare`, `granularity`,
`base_currency_code` and `has_orders` (one `LIMIT 1` query).

Alternative: a `summary` key for the window-based parts. Rejected by the
user; the extra window queries run in parallel requests.

### 3. `get_overview()` is removed, and the test helper assembles the old shape

The PHP test helper `overview()` calls the endpoint once for each key in
`METRIC_KEYS` and builds `meta + ['kpis' => …, 'cards' => […]]`. Then the
existing assertions stay the same. `AnalyticsOverviewApiTest` becomes
`AnalyticsMetricsApiTest` and adds the 404 and the `{ meta, data }` shape tests.

### 4. Frontend: `useQueries`, one query per key

`useAnalyticsMetricQueries(params)` calls `useQueries` with one query per key.
The query key is `['AnalyticsMetric', key, params]`. Each query parses
`{ meta, data }` with `AnalyticsMetaSchema` and the card schema for that key
(`AnalyticsCardsSchema.shape[key]`, or `AnalyticsKpisSchema` for `kpis`).
`Promise.all()` is not used, because it resolves only when all requests are
done.

The page takes `meta` from the first query that has data. Until a meta
exists, the banner does not show. Each card slot renders:
- `CardSkeleton` with its size while the query is pending,
- `CardError` (title-less compact error with "Retry", which calls that
  query's `refetch`) when it failed,
- the card when it has data.
The KPI row renders 4 `KpiSkeleton`, one error with Retry across the row, or
the 4 KPI cards. When every query failed, the page shows `QueryErrorState`
with a Retry that refetches all queries.

The empty checks in `lib/empty-cards.ts` take one card payload instead of the
full `cards` object.

### 5. Skeleton sizes come from the card order

`CARD_SKELETON_SIZES` is replaced by a list of `{ key, size }` in page order,
so the skeleton of a card has the same position and width as the card.

## Risks / Trade-offs

- [16 requests per page load, each loads WordPress] → Most browsers send 6 at
  a time on HTTP/1.1, so some cards wait for a free connection. The key order
  puts the KPIs and the top cards first.
- [The window queries run up to 6 times for the current window] → Each request
  is in its own PHP process, so they run in parallel. Total database work
  is higher than before.
- [The meta of two responses can differ if the day changes between requests]
  → The page uses the meta of the first response. The risk is small and the
  next load corrects it.

## Migration Plan

The feature is not released. Remove the old endpoint in the same change. No
data migration.

## Corrections during implementation

- **Card error has the card title.** `CardError` renders `AnalyticsCard` with the
  title and info of the card and the shared `QueryErrorState`, the same error
  the regions list uses. The merchant can then see which card failed.
- **Each card uses its own meta.** A card reads the currency, the range, the
  comparison and `has_orders` from the meta of its own response, so its data
  and its formatting always agree. Only the banner uses the first meta that
  comes.
- **Sizes are on the slot, not in a list.** A generic `CardSlot` gets the key,
  the size and the query of each card, and renders the skeleton, the error or
  the card. This replaces `CARD_SKELETON_SIZES` and the key-to-size list.
- **Type name.** The key type is `AnalyticsMetricKey`, because
  `lib/metric-definitions.ts` already has a `MetricKey` type with other keys.
