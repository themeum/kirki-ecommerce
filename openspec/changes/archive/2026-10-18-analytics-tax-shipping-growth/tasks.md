## 1. Backend

- [x] 1.1 In `app/Services/AnalyticsQueryService.php`, move the tax region SQL into `protected query_region_taxes(string $from, string $to, $limit = null)` and the shipping method SQL into `protected query_shipping_method_charges(string $from, string $to, $limit = null)`, each with a docblock and `@since`.
- [x] 1.2 In `build_taxes_by_region()`, call the query for the range with `LIST_LIMIT`, and, when `$range['compare']` is not null and there are rows, for the comparison range with no limit. Key the previous Total tax by country and state. Add `previous_total_tax_money_object` (null with no comparison, else the money of the previous Total tax or 0) and `change` to each item.
- [x] 1.3 In `build_shipping_by_method()`, do the same with Shipping charges: add `previous_shipping_charges_money_object` and `change` to each item.
- [x] 1.4 In `tests/Integration/AnalyticsMetricsTest.php`, add tests for the change of a tax region and of a shipping method against the previous period, and for a row with no previous value (previous 0, change null).
- [x] 1.5 Run `php -l`, phpcs and phpcs-wporg on the changed PHP files.

## 2. Frontend

- [x] 2.1 In `resources/app/features/analytics/schemas/catalog/analytics.ts`, add `previous_total_tax_money_object: MoneyObjectSchema.nullish()` and `change: z.number().nullish()` to `TaxRegionItemSchema`, and `previous_shipping_charges_money_object: MoneyObjectSchema.nullish()` and `change: z.number().nullish()` to `ShippingMethodItemSchema`.
- [x] 2.2 In `resources/app/features/analytics/components/charts/hbar-list.tsx`, add an optional `note` to `HBarItem`, shown in tiny subdued text under the bar.
- [x] 2.3 In `resources/app/features/analytics/components/cards/ranked-list-cards.tsx`, change `TaxesByRegionCard` (value Total tax, note the product and shipping split, change) and `ShippingChargesByMethodCard` (value Shipping charges, detail `formatOrders(orders)`, change) to `AnalyticsCard` with `HBarList`. Remove `RankedCardShell` and the file `components/cards/ranked-list.tsx`, which have no more users.
- [x] 2.4 In `resources/app/features/analytics/tests/fixtures.ts`, add the previous value and `change` to the tax region and shipping method items.
- [x] 2.5 In `resources/app/features/analytics/tests/pages/analytics.test.tsx`, add a test that each card row shows one bar with its value, its secondary data and its growth rate.
- [x] 2.6 Run `npm run typecheck && npm test` and lint on the changed files from `resources/app/`.

## 3. Docs

- [x] 3.1 In `docs/analytics.md`, update the 2 rows of the Cards table to say bars with the change in Total tax and in Shipping charges.
- [x] 3.2 Run `openspec validate analytics-tax-shipping-growth`.
