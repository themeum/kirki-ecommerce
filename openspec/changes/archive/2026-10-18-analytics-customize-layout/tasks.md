## 1. Backend key metrics

- [x] 1.1 In `AnalyticsQueryService`, give `summarize()` the items ordered of the period and pass it for each series point and for the totals
- [x] 1.2 Add `net_sales`, `total_sales`, `items_ordered`, `discounts`, `new_customers`, `customers` and `shipping_charges` to `build_kpis()`, each with its change and series
- [x] 1.3 Update the integration tests for the `kpis` key (11 keys, Items ordered series) and run `composer phpcs` and `composer phpcs:wporg` on the changed files (phpcs and phpcs:wporg pass; the integration tests need the WordPress test library, which is not installed here)

## 2. Sheet component

- [x] 2.1 Create `resources/app/components/ui/sheet.tsx` with `Sheet`, `SheetTrigger`, `SheetClose`, `SheetPortal`, `SheetOverlay`, `SheetContent` (`side`, close button), `SheetHeader`, `SheetFooter`, `SheetTitle` and `SheetDescription`
- [x] 2.2 Add `sheet.test.tsx`: open from the trigger, default side, Escape and close button close it, focus goes back to the trigger, accessible name from the title

## 3. Schema, definitions and layout state

- [x] 3.1 Extend `AnalyticsKpisSchema`, `KpiKey` and the test fixtures with the 7 new key metrics
- [x] 3.2 Add the 7 titles and tooltips to `metric-definitions.ts`
- [x] 3.3 Create `lib/layout.ts` with `KPI_KEYS`, `CARD_KEYS`, `DEFAULT_LAYOUT` and `normalizeLayout()`, and its unit tests (unknown keys, missing keys, duplicates, none on, broken value)
- [x] 3.4 Create `hooks/use-analytics-layout.ts` (local storage read and write, `setVisible`, `move`, `reset`, last-item lock) and its tests, including blocked storage

## 4. Page

- [x] 4.1 Add `enabledKeys` to `useAnalyticsMetricQueries` and update its tests
- [x] 4.2 Create `lib/card-registry.tsx` with the size and render of each card, and move the per-card render code from `pages/analytics.tsx` into it
- [x] 4.3 Render the KPI row and the cards from the layout, in layout order; KPI formats from a map; KPI skeletons for the visible KPIs; `hasAllFailed` over the enabled keys only
- [x] 4.4 Add `CardMenuContext` and the "Hide from page" menu to `AnalyticsCard` (hover, focus, open and touch rules), and give it to cards, KPI cards and error cards through `CardSlot` and `KpiRow`

## 5. Customize sheet

- [x] 5.1 Create `components/customize-sheet.tsx` with the Key metrics and Cards groups, the help texts with the on count, the "Full width" note, checkboxes with the last-item lock, and the "Reset to default" and "Done" footer
- [x] 5.2 Make each group sortable with its own `DndContext` (pointer and keyboard, vertical, in the parent only) and a handle named "Reorder <title>"
- [x] 5.3 Open the sheet from the Customize button in `AnalyticsControls`; replace the "does nothing" test

## 6. Tests

- [x] 6.1 Page tests: hidden card not requested and not shown, turn a card on shows a skeleton and then data, saved order applies, Hide from page from a card and a KPI, last item locked, 5 KPIs give 4 + 1 with a grid, reset
- [x] 6.2 Customize sheet tests: groups and default checks, toggles, keyboard reorder, no move between groups, Full width note, Done closes
- [x] 6.3 Run `npm run typecheck`, `npm run lint` and `npm test` in `resources/app/`, and Prettier on the changed files

## 7. Docs and specs

- [x] 7.1 Update `docs/analytics.md`: the Customize section, the 11 key metrics and their tooltips, the saved layout, the requests for visible parts only, and the per-browser layout in "Where this differs"
- [x] 7.2 Run `openspec validate analytics-customize-layout --strict`
