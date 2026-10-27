## Why

The Analytics page does not show when the customers place their orders. The
`analytics-foundation` proposal names "Orders by time of day" as a later card.
Merchants use it to plan staff, promotions and email send times.

## What Changes

- Add the full-width **Orders by time of day** card after the "New vs returning
  customers" and "Sales by coupon code" row.
- The card shows a 7 × 24 dot grid. The rows are the weekdays, from Monday to
  Sunday. The columns are the hours, from 12am to 11pm, in the store time zone.
  The total of each day shows on the right of its row.
- A summary line shows 3 values:
  - **Busiest hour:** the weekday and hour with the most orders, for example
    "Fri 6pm–7pm".
  - **Busiest day:** the weekday with the most orders, for example "Tuesday".
  - **After <busiest hour start>:** the percent of orders placed from that
    hour to midnight, for example "After 6pm 38% of orders".
- A "This period | Change" toggle:
  - **This period:** a bigger and darker dot means more orders.
  - **Change:** the dot size is the absolute difference from the comparison
    period. A purple dot means more orders. A gray dot means fewer orders.
  - When the comparison is None, the toggle is hidden and only This period
    shows.
- Each dot has a hover and focus tooltip and an aria-label.
- On narrow screens the grid keeps a minimum width of 640px and scrolls
  horizontally in the card.
- The analytics endpoint gets a new `orders_by_time_of_day` card with the
  current counts and the comparison counts for each weekday and hour.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-metrics`: add the orders count for each store-local weekday and
  hour.
- `analytics-page`: add the card to the Cards table and order, and add the dot
  grid, summary, toggle, tooltip and narrow-screen behavior.

## Impact

- `app/Services/AnalyticsQueryService.php`: a new hour-and-weekday query on
  the placed orders, and a new `orders_by_time_of_day` key in `build_cards`.
- `resources/app/features/analytics/`: the Zod schema, the empty check, the
  metric definition, a new card and dot-grid chart, a pure helper for the
  summary and the dot scales, the page order and skeleton sizes.
- Tests: a PHP integration test, and Vitest tests for the helper, the card and
  the page.
- `docs/analytics.md`: the Cards table.
- No new dependencies. No database change.
