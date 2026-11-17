## 1. Analytics range presets (backend)

- [x] 1.1 Add `week_to_date` and `all_time` to `AnalyticsRangeResolver::PRESETS` and `resolve_range()` (`week_to_date` uses `week_start(today)`; `all_time` starts on the request-time-zone day of the first order, or today when there are no orders)
- [x] 1.2 Force the comparison to none for `all_time` in the resolver
- [x] 1.3 PHP tests for both presets: Monday and Sunday week start, first day of week, all time with and without orders, all time with `compare=previous_period` returns no comparison (`bash kirki-ecommerce-test integration --filter=Analytics`)
- [x] 1.4 Add the two values to the frontend analytics `range` type/schema without changing the Analytics date control options; update `url-state` tests so an Analytics URL with these values still falls back the same way as before
- [x] 1.5 Verify: `npm run typecheck && npm test` (resources/app/) and the PHP tests pass

## 2. Shared order and stock conditions (backend)

- [x] 2.1 Add one reusable place for the "offline payment" order condition (`payment_metadata` → `payment_provider.is_offline`) and the "to ship" / "to collect" conditions (design D6)
- [x] 2.2 Extract the inventory `out_of_stock` condition from `VariantService` into a reusable method, keep the list behaviour the same
- [x] 2.3 Add `InventoryType::LOW_STOCK`, its condition (tracked, `available_quantity > 0`, `<= COALESCE(threshold, store default)`), and accept it in `VariantListRequest`
- [x] 2.4 Add `attention` (`to_ship`, `to_collect`) to `OrderListRequest`, its DTO and the order list query
- [x] 2.5 PHP tests: attention filter (unpaid offline, unpaid online, failed 8 days ago, archived, cancelled), unknown attention value → 422, low_stock filter (own threshold, store default, 0 available excluded), out_of_stock unchanged
- [x] 2.6 Verify: `npm run typecheck && npm test` (resources/app/) and the PHP tests pass

## 3. Attention endpoint (backend)

- [x] 3.1 Add `DashboardService::get_attention()` with `to_ship` (count, late_count), `to_collect` (count, money object of summed `base_total`), `out_of_stock` count and `low_stock` (5 rows + total), reusing the conditions from group 2
- [x] 3.2 Add `DashboardController::attention` and `GET /dashboard/attention` with the same admin permission as `overview`
- [x] 3.3 PHP tests: counts match the order list attention filter and inventory filters for the same fixture; non-admin rejected; empty store returns zeros
- [x] 3.4 Run phpcs (docker, `phpcs-wporg.xml.dist`) on the changed PHP files
- [x] 3.5 Verify: `npm run typecheck && npm test` (resources/app/) and the PHP tests pass

## 4. Floating Sheet primitive

- [x] 4.1 Add optional `floatable={{ storageKey }}` to `Sheet` (root; moved from `SheetContent`, see design D9 correction): move icon in the header, pointer drag on the header, viewport clamp on move/drop/resize, dock button ("Dock to the right") before Close, no float below 640px
- [x] 4.2 Floating mode: non-modal root, no overlay, no scroll lock, no focus trap, outside clicks do not close; docked mode unchanged
- [x] 4.3 Persist `{ mode, x, y }` per `storageKey` in local storage with try/catch
- [x] 4.4 Extend `components/ui/sheet.test.tsx`: option off has no move icon; drag floats; dock returns; remembered state; off-screen position clamped; Escape closes when floating
- [x] 4.5 Turn floating on for the Customize analytics sheet (`kirki-ecommerce:analytics:customize-sheet`); add a test to `customize-sheet.test.tsx`
- [x] 4.6 Verify: `npm run typecheck && npm test`

## 5. Analytics public API and shared parts

- [x] 5.1 Move the sortable row/group components out of `customize-sheet.tsx` into their own file; Analytics sheet tests still pass unchanged
- [x] 5.2 Add `useAnalyticsMetricQuery(key, params, enabled)` and a `readAnalyticsAmountFormat()` helper (uses `normalizeLayout` on the Analytics storage key)
- [x] 5.3 Create `features/analytics/index.ts` exporting only what Home uses (metric definitions, query hook, amount reader, money formatting, `CardMenu`, sortable list parts, KPI key type)
- [x] 5.4 Verify: `npm run typecheck && npm test` and lint (no deep import across features)

## 6. Home layout model

- [x] 6.1 Add `features/home/lib/layout.ts`: keys, defaults (design D4 and the "Reset to default" requirement), zod v3 `normalizeLayout` (unknown keys dropped, missing keys appended, caps 3/4, unknown period → month)
- [x] 6.2 Add `useHomeLayout()` (`setVisible` with max checks, `move`, `setPeriod`, `reset` keeping period) with storage key `kirki-ecommerce:home:layout`
- [x] 6.3 Add `period → range` mapping (`month_to_date`, `week_to_date`, `today`, `all_time`)
- [x] 6.4 Tests in `features/home/tests/lib/layout.test.ts` and `tests/hooks/use-home-layout.test.tsx`: defaults, broken JSON, too many kpis, new section appended, max refusal, reset keeps period, no local storage
- [x] 6.5 Verify: `npm run typecheck && npm test`

## 7. Home header: period, quick actions, customize

- [x] 7.1 Add the period subtitle and menu (dashboard mode only) — no `PageHeading` change: its `text` prop already takes an element
- [x] 7.2 Add `QuickActions` (targets per design D5, primary = first checked, right-most) and the Customize home icon button with tooltip
- [x] 7.3 Keep checklist-mode header unchanged
- [x] 7.4 Tests: default header, main button moves on reorder, View live site opens a new tab, checklist mode has no subtitle and no Customize button
- [x] 7.5 Verify: `npm run typecheck && npm test`

## 8. Customize home sheet

- [x] 8.1 Build `CustomizeHomeSheet` with the three groups, info tooltips, `N/3` and `N/4` counts, "Main button" note, disabled muted items at a maximum, Reset to default and Done, `floatable` with `kirki-ecommerce:home:customize-sheet`
- [x] 8.2 Tests: default sheet state, maximums, all sections off, keyboard reorder, reset
- [x] 8.3 Verify: `npm run typecheck && npm test`

## 9. Home sections

- [x] 9.1 Add the attention service and zod response schema (`features/home/schemas/catalog/`) with a schema test
- [x] 9.2 `KeyNumbersSection`: kpis query for the period with `compare=none`, cards with title, value, info tooltip, Hide from page menu, Analytics amount format, no change/link; "No key numbers chosen." state
- [x] 9.3 `TopProductsCard`: switch to `sales_by_product` for the period; show net sales + units at the right; stock as a colored text line (no badge); "No sales yet"
- [x] 9.4 `NeedsAttentionCard`: rows, sort (pending first), "Clear", "N of 3 need you" / "All caught up", sub-lines, links (orders with `attention`, inventory with `out_of_stock`)
- [x] 9.5 `RestockSoonCard`: rows, "N left", row link to inventory edit, "View inventory" to `low_stock`, empty state
- [x] 9.6 `HomeSections`: grid order, Key numbers full width, lone half section full width, all-hidden empty state, per-section skeleton/error, hidden sections do not fetch; info icon + Hide from page on Recent orders and the new cards
- [x] 9.7 Remove Home code that only served the old metric cards (`MetricCard` usage, `getMetricCards`) if nothing else uses it; keep `dashboard/overview` service for recent orders
- [x] 9.8 Tests for each section (loading, error, empty, data) and for the grid placement rule
- [x] 9.9 Verify: `npm run typecheck && npm test`

## 10. Order list and inventory list UI

- [x] 10.1 Order list: read `attention` from the address, send it to the API, show a removable "To ship" / "To collect" chip; removing it clears the address value
- [x] 10.2 Inventory list: add the "Low stock" option to `inventoryTypeOptions`
- [x] 10.3 Tests for the chip and the new option
- [x] 10.4 Verify: `npm run typecheck && npm test`

## 11. Docs and wrap-up

- [x] 11.1 Write `docs/home.md` (structure of `docs/emails.md`, with a "Where this differs from WooCommerce / Shopify" section)
- [x] 11.2 Check every new user-facing string uses "Kirki eCommerce" where the product is named, and the `kirki-ecommerce` text domain
- [x] 11.3 Final verify: `npm run typecheck && npm test`, lint, PHP tests and phpcs; write the Backward compatibility note in the final response
