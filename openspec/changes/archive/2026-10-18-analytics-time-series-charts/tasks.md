## 1. Backend grouping

- [x] 1.1 In `AnalyticsRangeResolver`, set the thresholds (14 / 45 / 186 / 366 days) and return `granularity` with `granularity_size` (1, 3 or N = ceil(months / 12))
- [x] 1.2 Make `bucket_key()`, `next_bucket_key()` and `build_buckets()` use the size and the window's first day as the anchor for 3-day and N-month groups
- [x] 1.3 Add `span_label` to each bucket (`M j, Y` for one day, `M j – M j, Y` in one year, `M j, Y – M j, Y` across years)
- [x] 1.4 In `AnalyticsQueryService`, make `bucket_sql()` group 3-day and N-month buckets from the window anchor, and pass the comparison window's own anchor (note: the anchor is inlined after it is normalized to `Y-m-d` through `DateTimeImmutable`, because the SELECT list comes before the positional WHERE bindings; month groups use `YEAR() * 12 + MONTH()` so the SQL has no `%` for `$wpdb->prepare()`)
- [x] 1.5 Add `span_label` and `previous_span_label` to every series point, and `granularity_size` to the response
- [x] 1.6 Update the PHP unit and integration tests: 7, 30, 31, 90 days, 12 months, 2 years, partial groups, and comparison groups (note: written, not run here; the DST and week tests moved to ranges that keep daily and weekly points)

## 2. Frontend data and formatting

- [x] 2.1 Add `span_label`, `previous_span_label` and `granularity_size` to the analytics schemas, and copy the span labels in `toChartPoints()`
- [x] 2.2 Add `createCompactMinorFormatter()` to `money-format.ts` and a compact count formatter, with tests ("$750", "$1K", "$1.5K", "$110K", "1.2K")
- [x] 2.3 Add `formatMinorShort`, `range` and `compareRange` to `CardProps` and pass them from the page

## 3. Chart geometry and axes

- [x] 3.1 Add `useElementWidth()` (ResizeObserver, 640 fallback for 0 or missing) and make the geometry helpers take the width (note: the hook is in `features/analytics/hooks/use-element-width.ts`, as the project rules require; `ChartFrame` measures and gives the layout to each chart through a render prop)
- [x] 3.2 Draw the line, dot and bar charts at pixel width: viewBox from the measured width, no `preserveAspectRatio="none"`
- [x] 3.3 Add nice y-axis steps (1, 2, 2.5, 5 × 10^k, 0 to 4 steps) with short labels and a left gutter (note: steps are 1, 2.5, 5 × 10^k, and 1, 2, 5 below 10; see design §5)
- [x] 3.4 Show up to 12 x-axis labels, as many as fit at 64px each, evenly spaced with the first and last, never tilted or cut
- [x] 3.5 Show the span labels in the chart tooltips
- [x] 3.6 Add tests for the y steps, the label thinning, and the tooltip span label

## 4. Line chart, legend and cards

- [x] 4.1 Fill the area under the current line with `analytics.chart.soft` and add the last-point dot
- [x] 4.2 Add `ChartLegend` with the current span and the comparison span, and use it in the Total sales, Average order value and Orders over-time cards
- [x] 4.3 Pass the short formatter to the y-axis of the money and count over-time charts, including New vs returning customers

## 5. Change style

- [x] 5.1 Remove the `variant` prop from `ChangeBadge`: always colored text with trending-up/down icons, no background
- [x] 5.2 Update the key metric card, card headline, Total sales breakdown and Sales by product to the single style, and keep `StatusBadge` pills
- [x] 5.3 Update the page tests for the change style (trending icons, no pill)

## 6. Docs and checks

- [x] 6.1 Update `docs/analytics.md`: the grouping table, span labels, chart axes, and the "Where this differs" section if it mentions granularity
- [x] 6.2 Run `npm run typecheck`, lint and `npm test` in `resources/app/`
- [x] 6.3 Ask the user to run `composer test:docker` and `composer phpcs:wporg`, and to check the charts in the browser at full and half width
