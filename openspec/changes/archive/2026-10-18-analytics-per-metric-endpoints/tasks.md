## 1. Backend: one endpoint per metric key

- [x] 1.1 Rename `AnalyticsOverviewRequest` to `AnalyticsMetricRequest` (same rules and checks) and make `AnalyticsRegionsRequest` extend it
- [x] 1.2 In `AnalyticsQueryService`, add the `METRIC_KEYS` constant (`kpis` and the 15 card keys in page order), `build_meta()`, and `get_metric(string $key, array $params)` that returns `['meta' => …, 'data' => …]`; collect the windows only for `kpis` and the 5 window-based cards; remove `get_overview()` and `build_cards()`
- [x] 1.3 Add `AnalyticsController::metric()`: 404 with "Unknown analytics metric." for a key that is not in `METRIC_KEYS`, otherwise the JSON response; remove `overview()`
- [x] 1.4 In `routes/api.php`, replace `/analytics/overview` with `/analytics/metrics/{key}`
- [x] 1.5 Update `tests/Support/SeedsAnalyticsData.php` `overview()` so it calls every key and assembles `meta + kpis + cards`; rename `AnalyticsOverviewApiTest` to `AnalyticsMetricsApiTest` and add tests for one key only, the `kpis` key, the `{ meta, data }` shape, the unknown key (404) and the removed overview route (404)
- [x] 1.6 Run `php -l`, phpcs (wporg and docblocks) on the changed PHP files, then `npm run typecheck && npm test` in resources/app/

## 2. Frontend: parallel queries and per-card states

- [x] 2.1 In `schemas/catalog/analytics.ts`, add `AnalyticsMetaSchema` and export `AnalyticsCardsSchema` and `AnalyticsKpisSchema` and a `MetricKey` type; remove `AnalyticsOverviewSchema`; update the schema tests
- [x] 2.2 In `config/endpoints.ts`, replace `ANALYTICS_OVERVIEW` with `ANALYTICS_METRIC: (key) => '/analytics/metrics/' + key` (follow the style of the other parameter endpoints)
- [x] 2.3 In `services/analytics.ts`, replace `useAnalyticsOverviewQuery` with `useAnalyticsMetricQueries(params)` that uses `useQueries`, one query per key, key `['AnalyticsMetric', key, params]`; update the service tests
- [x] 2.4 Change `lib/empty-cards.ts` to check one card payload
- [x] 2.5 Add a `CardError` component (compact error and "Retry") next to the skeletons, with `displayName` and `__()`
- [x] 2.6 Rewrite the page: meta from the first query with data, KPI row and each card slot render skeleton / error / data from their own query, page error state only when all queries fail; replace `CARD_SKELETON_SIZES` with a key-to-size list in page order
- [x] 2.7 Update the fixtures and the page tests (mock one response per key) and add tests for: one card loads first, one card fails, retry one card, all fail
- [x] 2.8 Run `npm run typecheck && npm test` and lint in resources/app/

## 3. Docs

- [x] 3.1 Update `docs/analytics.md`: the endpoint list, the key list, the `{ meta, data }` shape, and the per-card loading and error states
- [x] 3.2 Run `openspec validate analytics-per-metric-endpoints`, then `npm run typecheck && npm test` in resources/app/
