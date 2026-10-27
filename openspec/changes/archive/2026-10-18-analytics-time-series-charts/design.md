## Context

- `AnalyticsRangeResolver` picks the granularity from the day count (31 days or
  fewer: day; up to 186: week; more: month) and builds the buckets: key, start,
  end and label. `AnalyticsQueryService::bucket_sql()` turns the local date of a
  row into the same bucket key in SQL, and the series is built by key. Customer
  counts use `COUNT(DISTINCT …)` for each bucket, so the grouping must stay in
  SQL. Daily rows cannot be added up in PHP.
- The charts (`line-chart`, `dot-chart`, `bar-chart`) draw in a fixed
  640 × 220 viewBox with `preserveAspectRatio="none"`. The SVG is stretched to
  the card width, so text and circles are distorted. `AxisLabels` draws only
  the first and last label. No y-axis values are drawn.
- `ChangeBadge` has two variants: `pill` (default) and `text` (key metrics
  only, from the last commit).
- Money in charts is formatted by `createMinorFormatter()`, which uses
  `Intl.NumberFormat('en-US', { style: 'currency', currency })`.

## Goals / Non-Goals

**Goals:**

- One grouping rule, in the backend, for every time series and sparkline.
- Charts that keep text and circles undistorted at every width, with readable
  axes.
- One change style on the whole page.

**Non-Goals:**

- No new chart library.
- No change to the sparkline look, except that it uses the new grouping.
- No change to the New vs returning customers legend, which shows the two
  totals.
- No zoom, brush or scroll on the charts.

## Decisions

### 1. Granularity is a unit plus a size

The resolver returns `granularity` (`day`, `week`, `month`) and a new
`granularity_size` (1, 3 or N). 3-day groups are `day` × 3. N-month groups are
`month` × N. Week is always size 1. Other code that reads `granularity` (labels,
`week_start`) keeps working.

Thresholds: `DAILY_MAX_DAYS = 14`, `THREE_DAY_MAX_DAYS = 45`,
`WEEKLY_MAX_DAYS = 186`, `MONTHLY_MAX_DAYS = 366`. Above 366 days,
N = ceil(months / 12), where months counts the calendar months that the range
touches.

Alternative: new string values such as `3_days`. Rejected: every `===`
comparison on the granularity would need a new branch.

### 2. Bucket keys are anchored to the range start

- `day` × 3: key = `from + floor(days_since_from / 3) * 3` days. SQL:
  `DATE_ADD(%from, INTERVAL FLOOR(DATEDIFF(d, %from) / 3) * 3 DAY)`.
- `month` × N: key = first day of the month `from_month + floor(months_since /
  N) * N`. SQL: `DATE_ADD(%from_month, INTERVAL FLOOR(PERIOD_DIFF(
  DATE_FORMAT(d, '%Y%m'), DATE_FORMAT(%from_month, '%Y%m')) / N) * N MONTH)`.
- Size 1 keeps the current expressions.

`bucket_key()` and `bucket_sql()` get the anchor (the window's first day) and
the size. The comparison window passes its own first day, so its groups start
on the comparison start. `build_buckets()` steps by the size.

The anchor date goes into SQL through `$wpdb->prepare()`, as the other range
bounds do.

### 3. Labels

- `label`: the bucket start. `M j` for day and week, `M Y` for month (size 1
  or N), as now.
- `span_label`: `M j, Y` for a one-day bucket. Otherwise
  `M j – M j, Y` when the start and end are in the same year, and
  `M j, Y – M j, Y` when they are not. Month buckets use the same day format,
  so the tooltip shows the exact days that the point covers.
- The series points get `span_label`, and the matched comparison points give
  `previous_span_label`. The frontend schema adds both as `nullish` strings.
  `toChartPoints()` copies them.

### 4. Charts draw at pixel width

A small `useElementWidth()` hook (ResizeObserver on the chart frame) gives the
width. The SVG viewBox becomes `0 0 {width} {height}`, with no
`preserveAspectRatio="none"`. The geometry helpers take the width as an
argument instead of the `CHART_WIDTH` constant. When ResizeObserver is
missing (tests), or before the first measure, the width is 640.

The plot gets a left gutter for the y-axis labels. The gutter width is measured
from the longest y label (character count × an average glyph width at 11px),
so no DOM text measure is necessary.

Alternative: draw the labels as HTML over a stretched SVG. Rejected: the
circles would still be ellipses.

### 5. Y-axis steps and short format

`niceStep(max / 4)`: the smallest of 1, 2.5 and 5 × 10^k that is at least
`max / 4`. Below 10, the steps are 1, 2 and 5, so count axes do not show
values such as 2.5. (A step of 2 above 10 was rejected: a top value of 700 would
give an axis to 800, not to 1K.) The axis is 0 to 4 × step, with a line and a label at each step.
Negative values are not possible in these charts, so the min stays 0.

Short format: `Intl.NumberFormat('en-US', { notation: 'compact',
maximumFractionDigits: 1 })`, with `style: 'currency', currency` for money.
This gives "$750", "$1K", "$1.5K" and "$110K", and the symbol is placed as in
`createMinorFormatter()`. A `createCompactMinorFormatter(currencyCode)` sits
next to it in `money-format.ts`. `CardProps` gets `formatMinorShort`. Count
charts use a plain compact number formatter.

### 6. X-axis label thinning

`maxLabels = min(12, floor(plotWidth / LABEL_SLOT))`, with `LABEL_SLOT` = 64px
(the "Oct 2026" width at 11px plus a gap). When the point count is more than
`maxLabels`, the labels are at indexes `round(i * (count - 1) / (maxLabels -
1))`, so the first and last points always have a label. Every label is
centered on its point and moved in from the card edge by half its estimated
width, so the first and last labels do not get cut.

### 7. Fill, last-point dot and legend

- Line chart: an area path from the current line down to the zero line, closed
  for each unbroken segment, with `fill` = the existing
  `analytics.chart.soft` token. Dot: an
  `r=4` circle at the last non-null current point.
- `ChartLegend` (in `chart-shared.tsx`): a solid sample with the current span
  and a dashed (line) or light (bar) sample with the comparison span. The spans
  use `formatRangeDates()` from `lib/date-range.ts`. Line, dot and bar charts
  take an optional `legend` prop. `CardProps` gets `range` and `compareRange`
  (from the `from`/`to` values of the overview response), and the three cards
  pass them.

### 8. One change style

`ChangeBadge` loses the `variant` prop and always renders the text style.
`ArrowUp` and `ArrowDown` are no longer used there. `pillStyles` and
`toneStyles` stay for `StatusBadge`. The page tests that assert `data-tone`
keep working.

## Risks / Trade-offs

- [ResizeObserver gives 0 in a hidden tab] → Keep the 640 fallback when the
  measured width is 0.
- [Estimated y-label width can be off for some fonts] → Add 8px padding to the
  gutter. The labels are short (at most 6 characters).
- [Week charts have up to 28 points] → Accepted. Only the labels are thinned.
  The hit areas get narrower, but they stay at 20px or more on a full card.
- [PERIOD_DIFF and DATEDIFF are MySQL-specific] → The plugin already uses
  `DAYOFWEEK` and `DATE_SUB`, and it supports only MySQL and MariaDB.
