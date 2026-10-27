## Why

The over-time charts on the Analytics page do not match the design and are hard
to read. A 30-day range has 30 crowded points. The y-axis has no values. The
x-axis shows only the first and last labels. The SVG stretches to the card
width, so the text is distorted and the dots are ellipses. The changes show as
background chips, not as colored text with trending icons. This change is the
next step of the Analytics recap, after the date controls.

## What Changes

- New chart grouping by range length: 1–14 days: one point per day. 15–45 days:
  3-day groups (30 days = 10 points). 46–186 days: weeks. 187–366 days: months.
  More than 366 days: groups of N months, with N = ceil(months / 12), so a chart
  has 12 points or fewer. 3-day and N-month groups start at the first day of the
  range. Weeks keep the site start-of-week setting. The first and last group can
  be partial. All time-series charts and the key metric sparklines use it.
- Each series point gets a span label (for example "Oct 8 – Oct 10, 2026") for
  the tooltip. The x-axis label stays the group start ("Oct 8", or "Oct 2026"
  for month groups).
- The charts draw at the real pixel width of the card, with no stretch. Text is
  not distorted and dots are circles.
- The x-axis shows at most 12 evenly spaced labels, always with the first and
  last. On a narrow card it shows fewer, as many as fit. Labels are never tilted
  or cut.
- The y-axis shows 5 values at round steps from 0, in a short form: "$750",
  "$1K", "$1.5K", "$110K", "$2.3M". Money uses the base currency symbol, placed
  as in the chart tooltips. Count charts show "1.2K" with no symbol.
- The line charts fill the area under the current-period line and show a dot on
  its last point.
- The line, dot and bar over-time charts get a legend with the current span and
  the comparison span. The comparison item does not show when Compare is None.
- Every change on the page (key metrics, card headlines, Total sales breakdown,
  Sales by product) shows as colored text with a trending-up or trending-down
  icon, with no background. The pill variant of the change badge is removed.
  Status badges keep their pills.
- `docs/analytics.md` is updated for the new grouping and the chart axes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-metrics`: Chart granularity gets the new thresholds, 3-day and
  N-month groups, and the span label of each point.
- `analytics-page`: the key metrics row and the cards show changes as colored
  text with trending icons. New requirements for the chart axes, the area fill
  and last-point dot, and the chart legend. Chart tooltips show the span label.

## Impact

- PHP: `app/Services/AnalyticsRangeResolver.php` (thresholds, group size,
  bucket keys and labels), `app/Services/AnalyticsQueryService.php` (SQL group
  expression, span labels in the series), and their tests.
- React: `features/analytics/components/charts/*` (pixel-width drawing, axes,
  fill, dot, legend), `change-badge.tsx`, `card-headline.tsx`, the over-time
  cards, `total-sales-breakdown-card.tsx`, `sales-by-product-card.tsx`,
  `lib/format.ts` (short values), `schemas/catalog/analytics.ts` (span labels),
  and their tests.
- API: `GET /analytics/overview` series points get `span_label` and
  `previous_span_label`. The response gets `granularity_size` (3 for 3-day
  groups, N for N-month groups, else 1) next to `granularity` (day, week or
  month). No field is removed.
- Docs: `docs/analytics.md`.
