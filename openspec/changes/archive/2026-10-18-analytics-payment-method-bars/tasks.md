## 1. Backend

- [x] 1.1 In `app/Services/AnalyticsQueryService.php`, move the payment method SQL into `protected query_payment_method_sales(string $from, string $to, $limit = null)` with a docblock and `@since`. It returns rows with `id`, `orders` and `total_sales`, most Total sales first.
- [x] 1.2 In `build_sales_by_payment_method()`, call it for the range with `LIST_LIMIT`, and, when `$range['compare']` is not null, for the comparison range with no limit. Add `previous_total_sales_money_object` (null with no comparison, else the money of the previous Total sales or 0) and `change` (from `change()`) to each item.
- [x] 1.3 In `tests/Integration/AnalyticsMetricsTest.php`, add a test for the change of a payment method against the previous period, and a test for a method with no previous sales (previous 0, change null).
- [x] 1.4 Run `php -l`, phpcs and phpcs-wporg on the changed PHP files. Then run `npm run typecheck && npm test` from `resources/app/`. PHP lint, phpcs and phpcs-wporg are clean. The PHP integration tests cannot run in this environment.

## 2. Frontend

- [x] 2.1 In `resources/app/features/analytics/schemas/catalog/analytics.ts`, add `previous_total_sales_money_object: MoneyObjectSchema.nullish()` and `change: z.number().nullish()` to `PaymentMethodItemSchema`.
- [x] 2.2 In `resources/app/features/analytics/components/cards/ranked-list-cards.tsx`, change `SalesByPaymentMethodCard` to an `AnalyticsCard` with `HBarList`: label is the name, value is `Number(total_sales_money_object.raw)`, display is `formatMoney(...)`, detail is `formatOrders(orders)`, change is `change`.
- [x] 2.3 In `resources/app/features/analytics/tests/fixtures.ts`, add `change` and `previous_total_sales_money_object` to the payment method items.
- [x] 2.4 In `resources/app/features/analytics/tests/pages/analytics.test.tsx`, add a test that the card shows one bar with Total sales, "N orders" and the growth rate for each method.
- [x] 2.5 Run `npm run typecheck && npm test` and lint on the changed files from `resources/app/`.

## 3. Docs

- [x] 3.1 In `docs/analytics.md`, update the Sales by payment method row of the Cards table to say bars with Total sales, order count and the change in Total sales.
- [x] 3.2 Run `openspec validate analytics-payment-method-bars`, then `npm run typecheck && npm test` from `resources/app/`.
