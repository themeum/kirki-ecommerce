## Context

The previous change (analytics-time-series-charts, archived on 2026-10-18 and
not yet committed) added 3-day groups for 15 to 45 days and N-month groups for
ranges longer than one year. It added `granularity_size`, a size and an anchor
in `AnalyticsRangeResolver::build_buckets()` / `bucket_key()` /
`next_bucket_key()`, and anchored SQL in `AnalyticsQueryService::bucket_sql()`.
The x-axis used `getXLabelIndexes()`: at most 12 labels, evenly spread, always
with the first and the last point.

The last commit (c177f050) has the day/week/month grouping with the limits 31
and 186 days. This change goes back to that grouping, and keeps the span labels,
the axes, the legend and the area fill of the previous change.

## Goals / Non-Goals

**Goals:**

- One point for each day (1–31 days), week (32–186 days) or month (more than
  186 days).
- X-axis labels at equal steps: every Nth point, N = ceil(points / 12), larger
  when the labels do not fit.

**Non-Goals:**

- No change to the y-axis, the legend, the tooltip content, the area fill or
  the sparklines.
- No interval picker for the merchant.

## Decisions

### 1. Remove the group size

`resolve_granularity()` uses `DAILY_MAX_DAYS = 31` and `WEEKLY_MAX_DAYS = 186`.
The constants `THREE_DAY_MAX_DAYS`, `MONTHLY_MAX_DAYS` and `MAX_MONTH_POINTS`,
`resolve_granularity_size()` and `months_between()` are removed. The `$size` and
`$anchor` parameters of `build_buckets()`, `bucket_key()` and `next_bucket_key()`
are removed. `span_label()` stays.

`collect_window()` and the `query_*` methods go back to a `string $granularity`
argument in place of the `$grouping` array, and `bucket_sql()` goes back to the
three plain cases (day, week start, month start). The response and the resolver
result lose `granularity_size`; the Zod schema loses the field.

Alternative: keep the size code with the size always 1. Rejected: it is dead
code with a SQL path that no range uses.

### 2. Label every Nth point

```
fit  = max(1, floor(plotWidth / 64))
step = max(ceil(count / 12), ceil(count / fit))
indexes = 0, step, 2·step, … < count
```

`getXLabelIndexes(count, plotWidth)` keeps its signature, so `AxisLabels` does
not change. Examples on a wide card: 7 → step 1 (7 labels), 30 → step 3 (10),
13 or 14 → step 2 (7), 12 → step 1 (12), 24 → step 2 (12). Narrow card, 30
points, 280px plot: fit 4 → step 8 → [0, 8, 16, 24].

Alternative: spread the labels and always keep the last point. Rejected by the
merchant: the steps are then not equal.

### 3. Comparison

The comparison uses the same granularity and stays matched by position. With no
3-day groups there is no anchor for the comparison range.

## Risks / Trade-offs

- [30 daily bars are narrow on a half card] → The bar width is already
  computed from the slot width and capped at 40px; at 30 points it gets smaller,
  but it stays visible.
- [The last point can have no label] → The tooltip still shows its span label;
  the merchant accepted this.
- [Long custom ranges give many monthly points (5 years: 60)] → Labels stay at
  most 12; the line has more points, which is the intent.
