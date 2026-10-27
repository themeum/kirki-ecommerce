## 1. Overview endpoint (PHP)

- [x] 1.1 Add `DashboardService::get_overview()` in `app/Services/` with the counted payment statuses (`paid`, `refunding`, `refunded`), the metrics aggregate, the base-currency refund sum (completed refunds, order base/invoiced ratio, skip `invoiced_total = 0`), net sales, top 5 products (grouped by `product_id`, `product_name` fallback, units then revenue, newest item's name/image) and the 5 recent orders
- [x] 1.2 Return money values as money objects: base currency for metrics and top products, order currency for recent order totals
- [x] 1.3 Add `DashboardController::overview()` and register `GET /dashboard/overview` in the admin middleware group of `routes/api.php`
- [x] 1.4 Add an integration test under `tests/Integration/` that covers: unpaid orders excluded, net sales with tax/shipping/completed refund, pending refund ignored, foreign-currency refund conversion, variants merged, unit tie broken by revenue, deleted product still listed, recent orders of any status limited to 5, non-admin request rejected
- [x] 1.5 Verify: `composer test:integration` passes, then `npm run typecheck && npm test` in `resources/app/` — `DashboardApiTest` and `AdminApiAccessTest` pass (47 tests). The full suite has 2 failures in `OnboardingApiTest` (order number prefix), which also fail with that class alone and do not use this change. PHPUnit had to run with `-d auto_prepend_file=bootstrap/abspath.php`: Composer loads the framework `helpers.php` (which exits without `ABSPATH`) before `bootstrap/abspath.php`, so a plain `vendor/bin/phpunit` exits silently with code 0.

## 2. Data layer (React)

- [x] 2.1 Add the `DASHBOARD_OVERVIEW` endpoint to `@/config/endpoints` — also exported `OrderListItemSchema` and `getPaymentBadgeInfo` from the orders public API (`features/orders/index.ts`), because ESLint blocks imports into another feature's internals
- [x] 2.2 Add `features/home/schemas/catalog/dashboard-overview.ts` (Zod v3, `MoneyObjectSchema`) and its test `dashboard-overview.test.ts` with a sample response and an empty-store response
- [x] 2.3 Add `features/home/services/dashboard.ts` with `useDashboardOverviewQuery({ enabled })` using `parseData`
- [x] 2.4 Add `features/home/lib/greeting.ts` (`getWelcomeName`: first name, then display name, then none) and its test
- [x] 2.5 Verify: `npm run typecheck && npm test` in `resources/app/`

## 3. Overview UI (React)

- [x] 3.1 Add `overview-card.tsx`: card shell with title and an action button that shows on `:hover`, `:focus-within` and under `@media (hover: none)`
- [x] 3.2 Add `metric-card.tsx` and the four metric cards (Total sales, Net sales, Orders, Products sold) in a 4/2/1-column grid
- [x] 3.3 Add `recent-orders-card.tsx`: rows with order number, customer name, date, payment badge (`features/orders/lib/order-badge`) and total; row opens the order detail; "No orders yet" empty state; "View all orders" action
- [x] 3.4 Add `top-products-card.tsx`: rows with image, name, units and revenue; "No sales yet" empty state; "View all products" action
- [x] 3.5 Add `dashboard-overview.tsx`: skeletons while loading, error message on failure, metrics row, then the two list cards side by side (stacked on narrow screens)
- [x] 3.6 Verify: `npm run typecheck && npm test` in `resources/app/`, and `npm run lint`

## 4. Home page switch (React)

- [x] 4.1 In `pages/home.tsx` (gate is the pure `isSetupComplete(steps)` in `lib/steps.ts`, with tests; an empty step list is not complete), read `useSetupChecklistQuery()`; when every step is completed, render dashboard mode (wider container, "Welcome, {name}" heading, `DashboardOverview`, template gallery); otherwise keep checklist mode unchanged
- [x] 4.2 Enable the overview query only in dashboard mode — done by mounting `DashboardOverview` only in dashboard mode, so `useDashboardOverviewQuery` needs no `enabled` option (the design's `{ enabled }` parameter was dropped)
- [x] 4.3 Confirm that completing the last step on the page switches to dashboard mode without a reload (the complete-step mutation and the sample-data import update the checklist cache); fix the cache update if one path does not — no fix needed: the confirm mutation writes the new state with `setQueryData`, and the sample-data import invalidates all queries
- [x] 4.4 Verify: `npm run typecheck && npm test` in `resources/app/`, and `npm run lint`; ask the user to check the layout and hover states visually

## 5. Documentation

- [x] 5.1 Update `docs/home.md`: dashboard mode and when it shows, metric definitions, counted orders, the overview endpoint and its response, and a "Where this differs from WooCommerce" section (all-time only, no comparisons, refunds subtracted in full from net sales, products sold not reduced by refunds)
- [x] 5.2 Verify: `npm run typecheck && npm test` in `resources/app/`

## 6. Review changes

- [x] 6.1 Add a primary "Add Product" button next to "View Live Site" in the Home header (both modes)
- [x] 6.2 Metric cards: 16px padding, 4px between label and value, value in bold (from the review screenshot)
- [x] 6.3 Add `overview-title.tsx`: title with an information icon and a translatable tooltip; use it on the four metric cards and the two list cards
- [x] 6.4 Make "View all orders" and "View all products" ghost buttons, and remove the border under the list card headers
- [x] 6.5 Show the template gallery only in checklist mode
- [x] 6.6 Center the empty states; list cards have the same height
- [x] 6.7 Use `StackedItems` for the Recent orders and Top selling products lists, as in the review design: order rows show the order number, fulfillment status as colored text, customer name, product count, total and relative time
- [x] 6.8 Add `features/home/lib/relative-time.ts` (`formatTimeAgo`, short translatable "3h ago" form) with a test, and use it in the Recent orders rows
- [x] 6.9 Top products: add `availability_status`, `track_inventory` and `inventory` per product to the endpoint (same rules as the product list, null for a deleted product) with integration tests; add `features/home/lib/stock.ts` (`getStockBadge`) with tests; rows show a 48 px image, the name with the stock badge, "{amount} generated" and "{N} units sold"
- [x] 6.10 Give "View Live Site" a white background (`background.surface`); hide the info icons until the pointer is over their card (always shown without hover); rebuild the overview skeleton to match the metric cards, the list card headers and the stacked rows
- [x] 6.11 Remove the separate overview skeleton: while loading, render the real cards (real titles and headers) with placeholder lines in each card's own row styles (`skeleton-line.tsx`), so the loaded layout does not shift
- [x] 6.12 Verify: `npm run typecheck`, lint and `npm test` in `resources/app/`; update `docs/home.md`
- [x] 6.13 Prevent the checklist-to-dashboard shift while the checklist loads: add `SetupChecklistService::is_complete()` (stored completions of the visible steps) with an integration test, send it as `is_setup_complete` in `window.kirki_ecommerce`, and use it in `pages/home.tsx` until the checklist response arrives
- [x] 6.14 Verify: `SetupChecklistApiTest`, `DashboardApiTest` and `AdminApiAccessTest` pass, PHPCS passes for both standards, and `npm run typecheck`, lint and `npm test` pass in `resources/app/`; update `docs/home.md`
