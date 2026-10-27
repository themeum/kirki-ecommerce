## 1. Backend counts

- [x] 1.1 Split `local_time_sql()` out of `local_date_sql()` in `AnalyticsQueryService` (D1). `local_date_sql()` wraps it in `DATE()`
- [x] 1.2 Add `query_orders_by_time_of_day(array $bounds)`. It uses `placed_scope`, groups by `WEEKDAY` and `HOUR` of the local `created_at`, and returns a zero-filled 7 × 24 array
- [x] 1.3 Add `build_orders_by_time_of_day(array $range)`. It returns `current` and `previous` (null without a comparison), and is wired into `build_cards` as `orders_by_time_of_day`
- [x] 1.4 Add integration tests in `tests/Integration/AnalyticsMetricsTest.php` for the Asia/Dhaka and Asia/Kolkata scenarios, a failed order, and the comparison counts (written; the PHP integration tests do not run in this environment, so not run yet)
- [x] 1.5 Run `php -l` and phpcs on the changed PHP files, then `npm run typecheck && npm test` in `resources/app/`

## 2. Frontend data and helper

- [x] 2.1 Add `orders_by_time_of_day` to the cards Zod schema (7 rows of 24 numbers, `previous` nullable), and update the test fixtures
- [x] 2.2 Add the `orders_by_time_of_day` metric definition (title and info text) and its empty check in `lib/empty-cards.ts`
- [x] 2.3 Add `lib/time-of-day.ts` with `summarizeTimeOfDay`, `dotScale` and `formatHourSpan` (D3), and its Vitest tests for the summary, the tie rules, the zero total and the 11pm span
- [x] 2.4 Run `npm run typecheck && npm test` in `resources/app/`

## 3. Card and grid

- [x] 3.1 Add `components/charts/dot-grid.tsx` (D4): the day labels, the hour labels, the dots with their tooltip and aria-label, the day totals, and the 640px minimum width in a horizontal scroll wrapper
- [x] 3.2 Add `components/cards/orders-by-time-of-day-card.tsx` (D5): the summary line, the toggle (hidden without a comparison), the 2 legends and the empty state
- [x] 3.3 Render the card after Sales by coupon code in `pages/analytics.tsx`, and add a `'full'` skeleton size at the same position
- [x] 3.4 Add Vitest tests: the summary text, the toggle hidden with Compare None, the Change dot colors and tooltip text, and the card order on the page
- [x] 3.5 Run `npm run typecheck && npm run lint && npm test` in `resources/app/` (lint reports one error in `components/ui/query-error-state.tsx`. That file is not part of this change, and the error was there before)

## 4. Docs

- [x] 4.1 Add the Orders by time of day row to the Cards table in `docs/analytics.md`, after Sales by coupon code, and describe the busiest-hour share and the Change view
- [x] 4.2 Run `openspec validate analytics-orders-by-time-of-day --strict`, then `npm run typecheck && npm test` in `resources/app/`
