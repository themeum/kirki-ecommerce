## Context

- `AnalyticsQueryService` already counts the placed orders (`placed_scope`) and
  puts a UTC time on a store-local day with `local_date_sql`. That helper adds
  the exact UTC offset of each time zone transition in the window, so DST and
  half-hour offsets are correct without the MySQL time zone tables.
- `build_cards` returns one key for each card. The coupon card reads the
  comparison window from `$range['compare']`.
- The React page lists the cards in `pages/analytics.tsx`, with a skeleton size
  for each card in `CARD_SKELETON_SIZES`. Each card has a metric definition
  (title and info text), a Zod schema and an empty check in `lib/empty-cards.ts`.
- The theme already has `heatmap.increase` (`violet2`) and `heatmap.decrease`
  (`analyticsGray`) for the Change view, and `chart.mid` (`analyticsPurple300`)
  and `chart.primary` (`violet2`) for a light-to-dark purple.
- `components/ui/tabs.tsx` is a segmented control on Radix Tabs, with the look
  of the "This period | Change" toggle.

## Goals / Non-Goals

**Goals:**

- One query for each window that gives the 7 × 24 counts.
- All summary and scale calculations in one pure TS helper, so Vitest covers
  them.

**Non-Goals:**

- No `start_of_week` support for the row order. Rows are always Mon to Sun.
- No click action on a dot.
- The toggle state does not go into the URL.

## Decisions

### D1. Store-local time expression

Split `local_date_sql` into a new `local_time_sql($column, $bounds)` that
returns the `DATE_ADD(..., INTERVAL CASE ... END SECOND)` expression, and keep
`local_date_sql` as `DATE(<local_time_sql>)`. The new query uses
`WEEKDAY(<local time>)` (0 = Monday) and `HOUR(<local time>)`.

- Alternative: copy the transition logic into a second helper. Rejected,
  because the 2 copies can drift.

### D2. Payload: raw counts only

```
orders_by_time_of_day: {
  current: number[7][24],        // rows Mon..Sun, columns hour 0..23
  previous: number[7][24] | null // null when there is no comparison
}
```

The server fills missing cells with 0. It does not calculate the busiest hour,
the busiest day, the share or the scales.

- Alternative: calculate the summary in PHP. Rejected: the PHP integration
  tests cannot run in all developer environments, and the summary is pure math
  on 168 numbers. The TS helper is easy to test with Vitest.

### D3. Pure helper `lib/time-of-day.ts`

- `summarizeTimeOfDay(current)` returns the busiest cell `{ day, hour }`, the
  busiest day, the day totals, the grand total and the "after" percent. The
  scan order is Mon first, then hour 0 first, and only a strictly higher count
  replaces the best value. This gives the tie rule in the spec.
- The "after" percent is `round(100 × Σ orders with hour ≥ busiest hour / total)`.
- `dotScale(value, max)` returns a 0..1 ratio from the square root of
  `value / max`, so the dot **area** grows with the value. It returns 0 when
  `max` is 0.
- `formatHourSpan(hour)` returns "6pm–7pm"; hour 23 returns "11pm–12am".

### D4. Dot grid component

`components/charts/dot-grid.tsx` renders the grid with CSS grid, not SVG. It
uses 1 label column, 24 hour columns and 1 total column, with
`min-width: 640px` inside an `overflow-x: auto` wrapper.

- Radius = `MIN_RADIUS + (MAX_RADIUS − MIN_RADIUS) × ratio`, with
  `MIN_RADIUS = 1.5px` and `MAX_RADIUS = 11px`.
- This period color: `color-mix(in srgb, chart.primary <ratio×100>%, chart.mid)`.
  `color-mix` works with the theme's CSS variables.
- Change color: `heatmap.increase` when the difference is above 0, else
  `heatmap.decrease`.
- Each dot is a focusable `span` with `role="img"`, an `aria-label` and the
  same text in the tooltip.
- On hover and keyboard focus, a `::before` circle of a fixed 26px size with a
  1.5px `chart.crosshair` border shows centered on the dot. It is the same size
  for every dot, and it is also the focus indicator. The tooltip uses the same color tokens and type
  styles as `ChartTooltip`.

### D5. Card and placement

`components/cards/orders-by-time-of-day-card.tsx` uses `AnalyticsCard` with
`size="full"` and the test id `card-orders_by_time_of_day`. It holds the
toggle state in `useState`. When `compareRange` is null or `previous` is
null, it renders no toggle and forces This period. The comparison span in the
Change legend uses the same range-span formatter as the chart legends. The
page renders the card after `SalesByCouponCodeCard`, and `CARD_SKELETON_SIZES`
gets a `'full'` entry at the same position. The empty check is "the sum of
`current` is 0".

### D6. Orders scope

The counts use `placed_scope`, the same scope as Orders. Thus the day totals
add up to the Orders KPI for the same range.

## Risks / Trade-offs

- [168 focusable dots make a long tab order] → Accepted. This is the same
  pattern as the chart hit areas. The tooltip text is also the accessible
  name.
- [Very old browsers do not support `color-mix`] → The WordPress admin
  targets current browsers. The dot size still shows the value.
- [A range shorter than 7 days has empty weekdays] → The rows show the
  smallest dots and a total of 0. This is correct data.

## Correction during implementation

- D4 said that each dot is a focusable `span` with `role="img"`. ESLint
  (`jsx-a11y/no-noninteractive-tabindex`) does not allow `tabIndex` on that
  element. Each dot is now a `button type="button"` with no action and with
  the tooltip text as its `aria-label`, as the info-icon triggers are. The
  tooltip shows below the dot in the top 3 rows, and at the edge in the
  first and last hours, because the horizontal scroll wrapper clips content
  that goes out of it.
- In the Change view, each dot also has `data-direction` (`up`, `down` or
  `flat`), so the tests can check the color without CSS variables.
