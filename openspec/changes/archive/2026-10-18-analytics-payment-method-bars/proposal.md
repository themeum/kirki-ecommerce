## Why

The Sales by payment method card shows a plain ranked list with no growth rate.
The other list cards (Sales by category, Sales by coupon code, Sales by
location) show horizontal bars with the change against the comparison period.
The merchant cannot see which payment methods grow or drop.

## What Changes

- The Sales by payment method card shows the top 5 methods by Total sales as
  horizontal bars. Each row shows the method name, the Total sales, the order
  count ("209 orders") in a subdued color and the change in Total sales.
- The bar length is the method's Total sales relative to the method with the
  most Total sales.
- Backend: each payment method row gets `previous_total_sales_money_object` and
  `change`. The change compares Total sales with the comparison period. It is
  empty when there is no comparison or the previous Total sales is 0.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `analytics-metrics`: Payment method metrics also give the Total sales in the
  comparison period and the change.
- `analytics-page`: the Sales by payment method card row in the Cards table
  changes, and a new "Sales by payment method bars" requirement describes the
  bars.

## Impact

- `app/Services/AnalyticsQueryService.php`: `build_sales_by_payment_method`
  moves its query into `query_payment_method_sales()` so that the comparison
  window uses the same query.
- `resources/app/features/analytics/schemas/catalog/analytics.ts`: two
  optional fields on `PaymentMethodItemSchema`.
- `resources/app/features/analytics/components/cards/ranked-list-cards.tsx`:
  `SalesByPaymentMethodCard` uses `HBarList`.
- Tests: `tests/Integration/AnalyticsMetricsTest.php`,
  `resources/app/features/analytics/tests/fixtures.ts` and
  `resources/app/features/analytics/tests/pages/analytics.test.tsx`.
- `docs/analytics.md`: the Cards row.
- No new endpoint, no migration, no new dependency.
