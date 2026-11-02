## Why

The over-time charts now group a 30-day range into 10 points of 3 days and a
long range into points of N months. The merchant loses the daily shape of the
line. The merchant wants to see every day, week or month as a point, and the
x-axis must limit only the number of labels, not the number of points.

## What Changes

- Chart points are one day, one week or one month only:
  - 1 to 31 days: one point for each day (Last 30 days: 30 points).
  - 32 to 186 days: one point for each week (Last 90 days: 13 or 14 points).
  - More than 186 days: one point for each month (Last 12 months: 12 or 13
    points, two years: 24 points).
- The 3-day groups and the N-month groups are removed, in the resolver and in
  the SQL.
- The `granularity_size` response field is removed. It was added in the
  previous change and was never released.
- The x-axis labels every Nth point, from the first point, with
  N = ceil(points / 12). The steps between labels are always equal:
  - 30 days: every 3rd day, 10 labels.
  - 13 or 14 weeks: every 2nd week, 7 labels.
  - 12 months: every month, 12 labels.
  - 7 days: every day, 7 labels.
- When the labels do not fit the card width, N becomes larger until they fit.
- The last point does not always have a label.
- The point label and the span label stay. A one-day point has the span label
  "Oct 8, 2026", a week has "Oct 5 – Oct 11, 2026".

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-metrics`: "Chart granularity" uses day, week or month points with
  the limits 31 and 186 days, and has no group size.
- `analytics-page`: "Chart axes" labels every Nth point with equal steps.
  "Chart tooltips" replaces the 3-day scenario with a week scenario.

## Impact

- PHP: `app/Services/AnalyticsRangeResolver.php`,
  `app/Services/AnalyticsQueryService.php`.
- PHP tests: `tests/Integration/AnalyticsRangeTest.php`,
  `tests/Integration/AnalyticsDstTest.php`,
  `tests/Integration/AnalyticsOverviewApiTest.php`.
- Frontend: `components/charts/chart-geometry.ts` (`getXLabelIndexes`),
  `schemas/catalog/analytics.ts`, and the chart tests.
- Docs: `docs/analytics.md`.
- No new dependencies. The API response loses `granularity_size`.
