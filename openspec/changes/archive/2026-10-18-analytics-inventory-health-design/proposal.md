## Why

The Inventory health card does not match the new design. The counts show as a
number with a status pill, the variant rows show a bare quantity, and the
"Live" note is plain text. The list can also show in-stock variants, which do
not need attention.

## What Changes

- The 3 counts show as tiles with a light background. Each tile shows the count
  in bold and the status name under it in a subdued color. The Out of stock
  count is red, the Low stock count is amber, and the In stock count uses the
  default text color.
- The variant list shows in a box with a border and a divider between rows.
  Each row shows the product name, the variant name under it in a subdued
  color, and a status badge on the right: red "Out of stock" or amber "Low
  stock". The row does not show the quantity.
- The list shows only out-of-stock and low-stock variants, lowest stock first,
  up to 4. When no variant is out of stock or low stock, the list does not
  show.
- The note "Live, not affected by the date range" has a green dot before it.
  The dot has a ripple animation that repeats. The animation stops when the
  user asks for reduced motion.
- Backend: `lowest` contains only tracked variants with status `out_of_stock`
  or `low_stock`.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `analytics-metrics`: Inventory metrics also define which variants the list
  contains.
- `analytics-page`: the Inventory health row in the Cards table changes, and a
  new requirement describes the card layout and the live indicator.

## Impact

- `app/Services/AnalyticsQueryService.php`: `build_inventory_health()` keeps
  only out-of-stock and low-stock variants in the lowest list.
- `resources/app/features/analytics/components/cards/inventory-health-card.tsx`:
  new layout, row badges and the live indicator.
- Tests: `tests/Integration/AnalyticsMetricsTest.php`,
  `resources/app/features/analytics/tests/pages/analytics.test.tsx`.
- `docs/analytics.md`: the Inventory health row.
- No new endpoint, no schema change, no migration, no new dependency.
