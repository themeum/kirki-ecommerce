## Why

The Taxes collected by region and Shipping charges by method cards show a
ranked list with no bars and no growth rate. The other list cards show
horizontal bars with the change against the comparison period. The merchant cannot see which regions or shipping
methods grow or drop.

## What Changes

- The Taxes collected by region card shows the top 5 regions as horizontal
  bars. Each row shows the region name, the Total tax and the change in Total
  tax. The product and shipping tax split shows under the bar in a subdued
  color.
- The Shipping charges by method card shows the top 5 methods as horizontal
  bars. Each row shows the method name, the Shipping charges, the order count
  ("7 orders") in a subdued color and the change in Shipping charges.
- The bar length is the row's value relative to the row with the highest value.
- Backend: each tax region row gets `previous_total_tax_money_object` and
  `change`. Each shipping method row gets `previous_shipping_charges_money_object`
  and `change`. The change is empty when there is no comparison or the previous
  value is 0.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `analytics-metrics`: Tax metrics and shipping method metrics also give the
  value in the comparison period and the change.
- `analytics-page`: the 2 rows in the Cards table change.

## Impact

- `app/Services/AnalyticsQueryService.php`: the queries of
  `build_taxes_by_region` and `build_shipping_by_method` move into
  `query_region_taxes()` and `query_shipping_method_charges()` so that the
  comparison window uses the same query.
- `resources/app/features/analytics/schemas/catalog/analytics.ts`: 2 optional
  fields on `TaxRegionItemSchema` and on `ShippingMethodItemSchema`.
- `resources/app/features/analytics/components/charts/hbar-list.tsx`: an
  optional `note` on each item, shown under the bar.
- `resources/app/features/analytics/components/cards/ranked-list-cards.tsx`:
  the 2 cards use `HBarList`. `RankedCardShell` has no more users and goes.
- `resources/app/features/analytics/components/cards/ranked-list.tsx`: no more
  users, removed.
- Tests: `tests/Integration/AnalyticsMetricsTest.php`,
  `resources/app/features/analytics/tests/fixtures.ts` and
  `resources/app/features/analytics/tests/pages/analytics.test.tsx`.
- `docs/analytics.md`: the 2 Cards rows.
- No new endpoint, no migration, no new dependency.
