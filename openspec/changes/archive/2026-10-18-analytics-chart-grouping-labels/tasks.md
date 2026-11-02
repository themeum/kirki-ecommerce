## 1. Backend grouping

- [x] 1.1 In `AnalyticsRangeResolver`, set `DAILY_MAX_DAYS = 31`, remove `THREE_DAY_MAX_DAYS`, `MONTHLY_MAX_DAYS`, `MAX_MONTH_POINTS`, `resolve_granularity_size()`, `months_between()` and `granularity_size`, and remove the size and anchor parameters from `build_buckets()`, `bucket_key()` and `next_bucket_key()`; keep `span_label()`
- [x] 1.2 In `AnalyticsQueryService`, go back to a `string $granularity` argument in `collect_window()` and the `query_*` methods, return `bucket_sql()` to the day / week start / month start cases, and remove `granularity_size` from the response
- [x] 1.3 Update `AnalyticsRangeTest`: granularity provider (7 → day, 30 → day, 31 → day, 32 → week, 90 → week, 186 → week, 187 → month), 30-day range gives 30 points with span label "Sep 19, 2026", 90-day range gives 13 weeks from Jul 21, two-year range gives 24 months, comparison gives 30 daily points from Sep 19, 2025; remove the 3-day and N-month tests and the `granularity_size` asserts
  - Note: the tests use the fixture day Oct 14, 2026, so the 30-day range starts on Sep 15 and the 90-day range gives 14 weeks from Jul 17. The year-span test uses a weekly range (Dec 1, 2025 to Jan 31, 2026), because a 30-day range is now daily.
- [x] 1.4 Update `AnalyticsOverviewApiTest` (no `granularity_size` key, last_30 gives 30 daily points) and check that the `AnalyticsDstTest` ranges still give daily points
- [x] 1.5 Run phpcs on the changed PHP files, then run `npm run typecheck && npm test` in resources/app/

## 2. Frontend labels

- [x] 2.1 Rewrite `getXLabelIndexes()` in `chart-geometry.ts` to label every Nth point from the first, with N = max(ceil(count / 12), ceil(count / fit))
- [x] 2.2 Remove `granularity_size` from `schemas/catalog/analytics.ts`
- [x] 2.3 Update `charts.test.tsx`: 7 → all 7, 30 → [0, 3, …, 27], 13 → [0, 2, …, 12], 12 → all 12, 24 → every 2nd, narrow 30 points at 280px → [0, 8, 16, 24]
- [x] 2.4 Run `npm run typecheck && npm run lint && npm test` in resources/app/

## 3. Docs

- [x] 3.1 Update `docs/analytics.md`: the grouping table (1–31 days, 32–186 days, more than 186 days), the x-axis label rule, the tooltip example, and the "The chart grouping is fixed" difference
- [x] 3.2 Run `npm run typecheck && npm test` in resources/app/
