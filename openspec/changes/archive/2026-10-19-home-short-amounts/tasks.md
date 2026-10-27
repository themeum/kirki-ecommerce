## 1. Backend

- [x] 1.1 Rename `app/DTO/AnalyticsMoneyDTO.php` to `ShortMoneyDTO.php` (class `ShortMoneyDTO`) and update its doc comment
- [x] 1.2 Add `MoneyManager::to_short_dto($minor_amount, $currency = null)` and its `@method` line on the `Money` facade
- [x] 1.3 Make `AnalyticsQueryService::money()` call `Money::to_short_dto()`
- [x] 1.4 Make `DashboardService` build `base_total_sales_money_object`, `base_net_sales_money_object` and `base_revenue_money_object` with `Money::to_short_dto()`
- [x] 1.5 Add a `to_short_dto` test to `MoneyManagerTest`
- [x] 1.6 In `DashboardApiTest`, replace the "no short_display" assertion: the metrics and top products have `short_display` (`$20.3K` for 20,345.00), and recent orders have no `short_display`
- [x] 1.7 Run the PHP unit tests and the Dashboard and Analytics integration tests in docker, and phpcs with both standards; then run `npm run typecheck && npm test` (from resources/app/)

## 2. Frontend

- [x] 2.1 Add `DashboardMoneySchema` in `features/home/schemas/catalog/dashboard-overview.ts` for the three money objects, and update `dashboard-overview.test.ts` (fixtures with `short_display`, and a missing `short_display` fails)
- [x] 2.2 Add `features/home/lib/money.ts` with `shortMoney(money)` that returns `{ text, title }`, and its test
- [x] 2.3 Add an optional `valueTitle` prop to `MetricCard`, and make `dashboard-overview.tsx` pass the short text and title for Total sales and Net sales
- [x] 2.4 Make the top products row show the short revenue, with the long sentence as `title` when it is different
- [x] 2.5 Run `npm run typecheck`, lint and `npm test` (from resources/app/)

## 3. Docs

- [x] 3.1 `docs/home.md`: metric cards and top products show short amounts with a long-amount tooltip; the REST example has `short_display`; add a "Where this differs" item (WooCommerce Home shows full amounts)
- [x] 3.2 `docs/analytics.md`: in "Short amounts", say that the dashboard overview also has `short_display`
- [x] 3.3 Run `openspec validate home-short-amounts --strict`, then `npm run typecheck && npm test` (from resources/app/)
