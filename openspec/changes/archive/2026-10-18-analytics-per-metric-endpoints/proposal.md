## Why

The Analytics page gets every key metric and every card from one request,
`GET /analytics/overview`. The server calculates all 16 parts before it sends
a response, so the merchant sees only skeletons until the slowest card is done.

## What Changes

- New endpoint `GET /analytics/metrics/{key}`. It accepts the same range and
  comparison parameters as before, and returns only the data of one metric key.
  The keys are `kpis` and the 15 card keys (`total_sales_over_time` …
  `inventory_health`). An unknown key returns 404.
- Each response has the shape `{ meta, data }`. `meta` holds the range, the
  comparison, the granularity, `base_currency_code` and `has_orders`.
- **BREAKING** (internal, unreleased): `GET /analytics/overview` is removed.
  `GET /analytics/regions` does not change.
- The page sends one request for each key, all in parallel. Each card and the
  key metrics row show a skeleton until their own data comes, then they show
  the data. The other cards do not wait.
- When one request fails, only that card (or the key metrics row) shows an
  error with a Retry action. The page error state shows only when all requests
  fail.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-metrics`: "Analytics endpoint access" changes from one overview
  endpoint to one endpoint per metric key. "Regions endpoint" refers to the new
  endpoint for its shared parameters and access rule.
- `analytics-page`: "Page states" changes to loading, error and retry for each
  card.

## Impact

- PHP: `routes/api.php`, `AnalyticsController`, `AnalyticsQueryService`
  (a public method per key replaces `get_overview`), the request class.
- React: `features/analytics/services/analytics.ts` (`useQueries`),
  `pages/analytics.tsx`, `schemas/catalog/analytics.ts`, `config/endpoints.ts`,
  a card error component.
- Tests: the PHP integration test helper that reads the overview, the API
  test, and the Vitest page, service and schema tests.
- Docs: `docs/analytics.md`.
- Each page load now makes 16 requests instead of 1. Each request loads
  WordPress again.
