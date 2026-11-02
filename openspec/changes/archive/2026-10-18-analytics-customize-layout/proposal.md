## Why

The Customize button on the Analytics page does nothing. Merchants see the same
4 key metrics and 15 cards in a fixed order, and they cannot hide the parts
that they do not use or show other key metrics. The backend already
calculates 7 more key-metric totals that the page does not show.

## What Changes

- Add a `Sheet` UI component in `resources/app/components/ui/sheet.tsx`. It has
  the shadcn Sheet parts (`Sheet`, `SheetTrigger`, `SheetClose`,
  `SheetContent` with `side`, `SheetHeader`, `SheetFooter`, `SheetTitle`,
  `SheetDescription`) on Radix Dialog, styled with our design system.
- The Customize button opens a sheet from the right with two groups, "Key
  metrics" and "Cards". Each item has a drag handle and a checkbox. The
  merchant can reorder items in their group and turn items on or off. The
  footer has "Reset to default" and "Done".
- Each change applies to the page immediately and is kept in local storage.
- At least 1 key metric and 1 card stay on. The last item of a group cannot be
  turned off.
- Each key metric and each card gets a three-dots menu with one item, "Hide
  from page". The menu button shows on hover or focus, and always on touch
  screens.
- The page does not request the data of a hidden card.
- The key metrics row shows 4 key metrics in each row, each 1/4 wide, and puts
  more key metrics on the next rows.
- The `kpis` metric grows from 4 to 11 key metrics: Net sales, Total sales,
  Items ordered, Discounts, New customers, Customers and Shipping charges are
  added. They are off by default. The SQL does not change.
- Card widths stay fixed (half or full). A half card alone in its row fills
  the row.

## Capabilities

### New Capabilities

- `sheet-primitive`: The `Sheet` UI component: its parts, sides, focus,
  close and style rules.
- `analytics-customize`: The Customize sheet, the "Hide from page" menu, the
  saved layout in local storage, the default layout and the rule that keeps 1
  item on in each group.

### Modified Capabilities

- `analytics-page`: "Customize button" now opens the sheet. "Key metrics row"
  shows the key metrics that are on, in the saved order, 4 in each row.
  "Cards" shows the cards that are on, in the saved order. "Page states"
  requests only the parts that are on.
- `analytics-metrics`: "Analytics endpoint access" — the `kpis` key returns
  11 key metrics.

## Impact

- PHP: `app/Services/AnalyticsQueryService.php` (`build_kpis`, `summarize`
  for the Items ordered series). Integration tests for the `kpis` key.
- React: new `components/ui/sheet.tsx`; `features/analytics` page, KPI card,
  analytics card, controls, schema, service and metric definitions; new
  customize sheet, card menu and layout hook. Tests for each.
- Uses `@dnd-kit/*`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`
  and `@radix-ui/react-checkbox`, which are already dependencies.
- Docs: `docs/analytics.md`.
- No database change. No new remote load.
