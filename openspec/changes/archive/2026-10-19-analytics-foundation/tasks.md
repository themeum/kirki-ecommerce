## 1. Theme tokens

- [x] 1.1 Add the 25 analytics primitives to `primitiveColors` at the `// Analytics primitives here` placeholder in `resources/app/theme/index.ts`, and their `color-analytics-*` keys to `PRIMITIVE_CSS_VAR_KEYS`
- [x] 1.2 Fill `theme.colors.analytics` at the placeholder with the semantic tokens from `specs/theme-primitives` (chart, series, breakdown, fulfillment, map, heatmap, goal, status)
- [x] 1.3 Add a Vitest test that checks each analytics primitive's hex value and CSS variable name, that no analytics primitive equals an existing primitive, and that `fulfillment.delivered` resolves to the teal variable
- [x] 1.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 2. Lookup tables (superseded by group 11)

- [x] 2.1 Add the migrations `CreateAnalyticsOrdersTable`, `CreateAnalyticsOrderItemsTable`, `CreateAnalyticsCustomersTable` and `CreateAnalyticsRefundsTable` with the columns, foreign keys (cascade) and indexes in design D1
- [x] 2.2 Register the four migrations at the end of `config/migrations.php`
- [x] 2.3 Add the models `AnalyticsOrder`, `AnalyticsOrderItem`, `AnalyticsCustomer` and `AnalyticsRefund` with fillable fields and integer casts
- [x] 2.4 Verify: `composer test:docker:integration` passes and `composer phpcs:wporg` reports no new errors; `npm run typecheck && npm test` in `resources/app/` _(PHPUnit passes; `composer phpcs:wporg` not run, phpcs is not installed in this checkout)_

## 3. Sync (superseded by group 11)

- [x] 3.1 Integration tests (red first): an order row's money columns for the tax-exclusive and tax-inclusive worked examples; free-shipping discount kept out of Discounts; `sales_date` in Asia/Dhaka and Asia/Kolkata; `paid_at` empty falls back to `created_at`; `is_sale` for paid, refunding and refunded; `is_placed` false for every failed status
- [x] 3.2 Integration tests (red first): customer key for registered, guest, guest with a registered email, deleted customer and merged guest orders; first paid order and `is_first_paid` after each of these
- [x] 3.3 Integration tests (red first): a completed refund gets a frozen `returned_at` and a base amount by the order ratio; a pending or cancelled refund is absent; an order edit after payment updates the row; a deleted order and a deleted refund are removed; a second sync changes nothing
- [x] 3.4 Integration tests (red first): the first sync of 300 orders completes in one call; a large backlog returns `preparing` with progress and dispatches `PrepareAnalyticsJob`; a time zone change rewrites the dates
- [x] 3.5 Implement `AnalyticsRowBuilder` (one order → its order row and item rows, with store-local dates by `wp_timezone()`)
- [x] 3.6 Implement `AnalyticsSyncService` (lock, watermarks for orders, refunds and customers, anti-join for deleted customers and orders, first-paid recalculation for the touched keys, time zone fingerprint, chunked preparation) _(the sync compares each order with its stored row (`source_updated_at`) instead of keeping watermarks; see design.md)_
- [x] 3.7 Implement `PrepareAnalyticsJob` on the `analytics` queue that continues the preparation and dispatches itself again until the backlog is empty
- [x] 3.8 Verify: `composer test:docker:integration` and `composer phpcs:wporg`; `npm run typecheck && npm test` in `resources/app/` _(PHPUnit passes; `composer phpcs:wporg` not run, phpcs is not installed in this checkout)_

## 4. Metrics query service

- [x] 4.1 Integration tests (red first) for every scenario in `specs/analytics-metrics`: presets and comparison ranges (Last 30 days, Last 12 months, Previous period, leap day), granularity limits (31/32/186/187 days), Sunday week start and partial weeks, change with a zero comparison, sales metrics and AOV, Returns, product and category (two categories, deleted product, Uncategorized), coupons, payment and shipping method names with metadata fallback, taxes by shipping region, placed orders with `returned`, new and returning (Lena in Last 30 days and in September), inventory statuses with the store default threshold and backorders, EUR currency filter, old base currency left out
- [x] 4.2 Implement the range resolver (presets, custom range, comparison, granularity, week alignment by `start_of_week`)
- [x] 4.3 Implement `AnalyticsQueryService` (design D5): KPIs with sparklines, the time series, the breakdown, the top-N lists, fulfillment counts, new and returning per bucket, and inventory health through `AvailabilityService`
- [x] 4.4 Verify: `composer test:docker:integration` and `composer phpcs:wporg`; `npm run typecheck && npm test` in `resources/app/` _(analytics PHP tests green after the user-approved test fix (+2 in stock); PHP run through the Docker wrapper because PHPUnit dev deps are not installed; phpcs not installed, not run)_

## 5. REST endpoint and menu

- [x] 5.1 Integration tests (red first): `GET /analytics/overview` returns 403 without `manage_options`, 422 for an unknown preset and for a custom range that ends after today, `preparing` during preparation, and the full shape with `*_money_object` keys for a seeded store
- [x] 5.2 Implement `AnalyticsOverviewRequest`, `AnalyticsController::overview` and the route in `routes/api.php` _(the standard admin route group is used, so the 403 payload is the WordPress error with `data.status`)_
- [x] 5.3 Add the `Analytics` menu class (`kirki-ecommerce#/analytics`, `manage_options`) and register it after `Orders` in `config/menu.php`
- [x] 5.4 Verify: `composer test:docker:integration` and `composer phpcs:wporg`; `npm run typecheck && npm test` in `resources/app/` _(green after the user-approved test fix: the 403 body may carry WordPress `data.status` but no metrics; phpcs not installed, not run)_

## 6. Frontend data layer

- [x] 6.1 Vitest tests (red first) for `lib/`: preset labels and dates, URL query parse and serialize with defaults, change percent and direction (empty for a zero comparison), money and number formatting from money objects
- [x] 6.2 Add `schemas/catalog/analytics.ts` (lenient response schema) with its schema test against a representative response, including the `preparing` response
- [x] 6.3 Add `services/analytics.ts` with `useAnalyticsOverviewQuery` (query key from the URL state, `parseData`, `refetchInterval` 5000 ms only while `preparing`)
- [x] 6.4 Add `lib/metric-definitions.ts` with every title and tooltip text from `specs/analytics-page`, wrapped for translation
- [x] 6.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 7. Charts and shared components

- [x] 7.1 Component tests (red first): `AnalyticsCardTitle` icon hidden by default, shown on hover and on keyboard focus, always shown when there is no hover, tooltip text is the accessible name; chart tooltip shows current and comparison values on hover and focus
- [x] 7.2 Implement `AnalyticsCardTitle` (focusable info icon button and `Tooltip`) and the card shell with the hover, focus-within and no-hover reveal styles
- [x] 7.3 Implement the SVG charts `LineChart`, `BarChart` (with stacked mode), `DotChart`, `Sparkline`, `HBarList` and `SegmentedBar` with the shared tooltip, using only `theme.colors.analytics` tokens
- [x] 7.4 Verify: `npm run typecheck && npm test` in `resources/app/`

## 8. Analytics page

- [x] 8.1 Component tests (red first): default controls; currency control hidden for a single-currency store; controls kept in the URL; four KPIs in order with "No comparison" when compare is none; 13 cards in order; no card, KPI or breakdown line is a link; rounding note for a non-base currency; skeleton, error with retry, empty-store banner, empty range state and preparing state with progress
- [x] 8.2 Add the route `#/analytics` and `pages/analytics.tsx` with the date, comparison and currency controls (date picker from `components/ui/calendar`) _(the focus reveal uses a `data-focused` attribute set by the card, because jsdom does not re-evaluate `:focus-within` after a focus change)_
- [x] 8.3 Implement the KPI row (value, change badge, sparkline)
- [x] 8.4 Implement the 13 cards from `specs/analytics-page` with the grid rules (at most two in a row, full cards, a lone card fills its row, one column under 720px)
- [x] 8.5 Implement the loading, error, empty-store, empty-range and preparing states
- [x] 8.6 Verify: `npm run typecheck && npm test` and `npm run lint` in `resources/app/` _(typecheck and 1778 tests pass; the page-test lint error was fixed with user approval; one lint error remains in `components/ui/query-error-state.tsx`, an existing file this change does not touch)_

## 9. Documentation

- [x] 9.1 Write `docs/analytics.md` in the `docs/emails.md` structure: table of contents, quick start, the controls, every metric with its formula (the same text as the tooltips plus details), data freshness and preparation, and a "Where this differs from Shopify and WooCommerce" section (sales counted by paid date, returns not split into product, shipping and tax, live categories, no sessions or conversion, Home dashboard Net sales differs)
- [x] 9.2 Verify: `npm run typecheck && npm test` in `resources/app/`

## 10. Final verification

- [ ] 10.1 Run `composer test:docker`, `composer phpcs:wporg`, and `npm run typecheck && npm test && npm run lint` in `resources/app/` _(Integration: 1017 tests, only the 2 known `OnboardingApiTest` failures; frontend green; lint has only the existing `query-error-state.tsx` error; Unit has 19 existing `UtilsIsAccountPageTest` errors (`str_starts_with` on PHP 7.4); `composer test:docker` and `phpcs:wporg` cannot run until dev deps and WPCS are installed)_
- [ ] 10.2 Ask the user to check the page visually against `kirki-analytics-v1.html` (the browser preview is not used in this project)

## 11. Query the source tables (lookup tables removed)

- [x] 11.1 Tests (red first, test-writer): delete `AnalyticsSyncRowsTest` and `AnalyticsSyncLifecycleTest` and the preparing, chunk and time-budget cases in the other test files, the schema test and the service polling test; keep every metric assertion that goes through the endpoint; add tests for an unknown currency (`ZZZ`, `ab`) → 422 on `currency`, a valid currency with no orders → 200 with zeros, a product sold and then deleted through `ProductService` → saved name, `is_deleted`, `product_id` null, a refund edited after completion → Returns move to the edit day, a guest order followed by a customer created with that email → one customer, and a first visit returning metrics at once
- [x] 11.2 Delete the four `CreateAnalytics*Table` migrations and their lines in `config/migrations.php`, the `Analytics*` models, `AnalyticsSyncService`, `AnalyticsRowBuilder` and `PrepareAnalyticsJob`
- [x] 11.3 Rewrite `AnalyticsQueryService` on the source tables (design D1–D5): UTC range bounds, the offset `CASE` for local dates, the item derived table, the customer key expression, the first-paid derived table, Returns from `refunds`, the `LEFT JOIN products` for deleted products _(item sums use a correlated subquery on `order_items.order_id` instead of a derived table; see design.md)_
- [x] 11.4 Validate `currency` in `AnalyticsOverviewRequest` (`size:3` and a known ISO 4217 code) and remove the preparing branch from `AnalyticsController`
- [x] 11.5 Wrap the names in `resources/data/us-state-codes.php` in `__()` and add PR, GU, VI, AS, MP and UM
- [x] 11.6 Frontend: remove the preparing state, the `refetchInterval` polling and the `preparing`/`progress` schema fields
- [x] 11.7 Docs: remove the preparation text from `docs/analytics.md`, document the `o:` order-only customer and the Returns date rule, and correct the WooCommerce bullet in "Where this differs" (WooCommerce Analytics lets the merchant choose the date type: created, paid or completed)
- [x] 11.8 Verify: the PHP Integration suite through the Docker wrapper, `npm run typecheck && npm test && npm run lint` in `resources/app/`, and a check that nothing references the removed classes or tables _(Integration: only the 2 known `OnboardingApiTest` failures; frontend green; lint has only the existing `query-error-state.tsx` error; see "Correction during implementation: request-time queries" in design.md)_

## 12. Verifier fixes (second verification)

- [x] 12.1 Tests (red first, test-writer): America/New_York, a March range crossing the spring-forward change and a November range crossing the fall-back change, with orders on both sides of each change, asserting the day points and the totals; America/Santiago (or Atlantic/Azores), a range ending on the DST-gap day, with an order at 00:30 local on the next day that must not count
- [x] 12.2 Fix `AnalyticsQueryService::utc_bounds()` so the end bound is local 00:00 of the calendar day after `to`, built from the date and not by `modify('+1 day')` on a zoned time
- [x] 12.3 Replace the `IN (… UNION …)` email branch of the first-paid query with a join to a derived table of window emails (materialized once), and build the first-paid table once per window for the bucket and total customer queries
- [x] 12.4 Docs: Returns are dated by the day the refund last changed (normally the day it completed); the currency filter does not convert orders placed in other currencies
- [x] 12.5 Verify: PHP `--filter Analytics` and the full Integration suite through the Docker wrapper; `npm run typecheck && npm test && npm run lint` in `resources/app/`

