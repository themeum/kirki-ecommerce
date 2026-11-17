## Context

- Home dashboard mode (`features/home/pages/home.tsx`, `dashboard-overview.tsx`)
  reads one endpoint, `GET /dashboard/overview`, which returns four all-time
  Home-only metrics, the 5 recent orders and the all-time top products. It is
  released (`origin/main`).
- Analytics (released) has: the metric engine (`AnalyticsQueryService`,
  `AnalyticsRangeResolver`), `GET /analytics/metrics/{key}`, the metric
  definitions (`features/analytics/lib/metric-definitions.ts`), a local-storage
  layout (`use-analytics-layout.ts`, `lib/layout.ts`), the customize sheet with
  dnd-kit sortable rows (`components/customize-sheet.tsx`) and the "Hide from
  page" card menu (`components/card-menu.tsx`).
- `features/analytics` has no `index.ts`. The module-boundary rule says another
  feature can import only from a feature's public API module.
- `AnalyticsRangeResolver::week_start()` already gives the first day of a week
  from `start_of_week`.
- The shared Sheet (`components/ui/sheet.tsx`) is modal only.
- Order payment method data: `orders.payment_metadata` (JSON text) holds
  `payment_provider.is_offline`. There is no "cash on delivery" type: offline
  methods are merchant-defined names.
- Inventory list stock filter (`VariantService`, `InventoryType`) has only
  `in_stock` and `out_of_stock`.
- Create coupon and Add customer are routes (`/coupons/new`,
  `/customers/new` through `NEW_ITEM_ID`), not dialogs.

## Goals / Non-Goals

**Goals:**

- Home numbers equal Analytics numbers for the same days.
- Only additive changes to released REST, PHP and component surfaces.
- No database, option or meta change.

**Non-Goals:**

- Goal section, Import products, Home-only amount format, links from Home
  cards to Analytics, a period comparison on Home.
- New presets in the Analytics page date dropdown.
- Server-side (per-user) layout storage.

## Decisions

### D1. Key numbers and Top selling use the Analytics API

Home calls `GET /analytics/metrics/kpis` and
`GET /analytics/metrics/sales_by_product` with `range=<preset>&compare=none`.
Period mapping: This month → `month_to_date`, This week → `week_to_date`,
Today → `today`, All time → `all_time`.
Alternative (extend `dashboard/overview` with a range) was rejected: two
definitions of the same metric names in one product.
`dashboard/overview` stays as it is. Home keeps calling it for `recent_orders`.
The extra metrics and top products work in that call is accepted; it is a few
aggregate queries.

`kpis` returns all 11 metrics with series. Home asks once and shows the
checked ones. No new "only these keys" parameter.

### D2. New range presets in `AnalyticsRangeResolver`

Add `week_to_date` and `all_time` to `PRESETS`. `week_to_date` =
`[week_start(today), today]`. `all_time` = `[day of MIN(orders.created_at) in
the request time zone, today]`, or `[today, today]` with no orders; its
comparison is forced to `null`. `AnalyticsMetricRequest` and the regions
request validate against `PRESETS`, so they accept the new values with no
other change. The frontend analytics schema/type for `range` gets the two
values, but the Analytics date control options do not change.

All time on a store with years of data gives a month granularity through the
current day-count rule. Home ignores the series.

### D3. Analytics public API

Create `features/analytics/index.ts` that exports only what Home uses:
`getMetricDefinitions`, the kpis and sales_by_product query hooks (a
`useAnalyticsMetricQuery(key, params, enabled)` single-key hook on top of the
existing service), the stored amount format reader, `CardMenu` and the
sortable customize list parts. The sortable row and group components are
moved out of `customize-sheet.tsx` into their own component file inside
`features/analytics/components/` so both sheets reuse them. The Analytics
sheet must render the same as before.

The amount format is read from the Analytics layout key
(`kirki-ecommerce:analytics:layout`) through a small exported reader that uses
`normalizeLayout`, so Home follows the Analytics choice.

### D4. Home layout model

`features/home/lib/layout.ts` mirrors the Analytics model:

```ts
type HomeLayout = {
  period: 'month' | 'week' | 'today' | 'all';
  actions: LayoutItem<ActionKey>[];   // max 3 visible
  kpis: LayoutItem<KpiKey>[];         // max 4 visible, KpiKey from analytics
  sections: LayoutItem<SectionKey>[]; // no min, no max
};
```

Storage key `kirki-ecommerce:home:layout`. `normalizeLayout` (zod v3, the same
pattern as Analytics) drops unknown keys, appends missing keys with their
default state, caps visible actions at 3 and kpis at 4 (keeps the first ones),
and maps an unknown period to `month`. `useHomeLayout()` gives `setVisible`
(refuses to go over a maximum), `move`, `setPeriod`, `reset` (keeps period).

### D5. Home page composition

`home.tsx` keeps the checklist/dashboard switch. In dashboard mode:

- `PageHeading` gets a subtitle node (period menu: existing `DropdownMenu`
  primitive) and actions = `<QuickActions/>` + customize icon button.
  If `PageHeading` has no subtitle slot, add an optional `description` prop
  (additive) to the shared component.
- `<HomeSections/>` renders sections in layout order in a CSS grid
  (`grid-template-columns: repeat(2, minmax(0,1fr))`). Key numbers gets
  `grid-column: 1 / -1`. A half-width section alone in its row gets
  `grid-column: 1 / -1`; this is computed in render from the visible list
  (count of half sections since the last full one; the last one when odd).
- Each section fetches its own data (`enabled` only when visible), so errors
  and skeletons are per section.

Quick action targets: Create order → `Orders.CreateOrder`; View live site →
`site_url` in a new tab; Add product → `Products.CreateProduct`; Create
coupon → `Coupons.EditCoupon({id: NEW_ITEM_ID})`; Add customer →
`Customers.CustomerDetail({id: NEW_ITEM_ID})`. No `?create=1` flag is needed
(the earlier plan assumed dialogs; they are routes).

### D6. Attention endpoint

`GET /dashboard/attention` → `DashboardController::attention` →
`DashboardService::get_attention()`. Same admin permission as `overview`.
Queries:

- Offline test: `JSON_EXTRACT(payment_metadata, '$.payment_provider.is_offline') = true`.
  `payment_metadata` is a text column; MySQL 5.7+/MariaDB 10.2+ parse it with
  `JSON_EXTRACT`. Put the condition in one place (an order query scope or a
  service method) and reuse it in the order list `attention` filter so the
  count and the list cannot drift.
- `to_ship`: `archived_at IS NULL AND fulfillment_status IN (unfulfilled,
  processing) AND (payment_status = paid OR (payment_status = unpaid AND
  offline))`. `late_count`: `COALESCE(paid_at, created_at) < now - 2 days`.
- `to_collect`: `archived_at IS NULL AND ((payment_status = unpaid AND offline
  AND fulfillment_status <> cancelled) OR (payment_status = failed AND
  created_at >= now - 7 days))`; sum of `base_total` as a money object.
- `out_of_stock`: count with the same condition as the inventory
  `out_of_stock` filter (extract that condition from `VariantService` into a
  reusable method, then call it from both).
- `low_stock`: tracked variants with `available_quantity > 0 AND
  available_quantity <= COALESCE(low_stock_threshold, <store default>)`,
  sorted by `available_quantity, id`, limit 5, plus total count. The same
  condition backs the new inventory `low_stock` filter.

Design choice (no COD type in the data): every unpaid offline order counts in
both "to ship" and "to collect". The design file excluded COD before delivery
from "to collect"; this cannot be done without a COD type. Recorded here as an
accepted gap.

### D7. Order list `attention` parameter

`OrderListRequest`: `'attention' => 'nullable|string|in:to_ship,to_collect'`,
DTO field, and the order list query applies the shared conditions from D6.
Frontend: the order list URL params schema gets `attention`; the list shows a
removable `Chip` for it (not in the filter popup). Additive: absent parameter
= old behaviour.

### D8. Inventory `low_stock`

Add `InventoryType::LOW_STOCK = 'low_stock'`, the condition in
`VariantService`, and the option in `inventoryTypeOptions`. The store default
threshold is read from `Settings::get('product.low_stock_threshold', 0)`, the
same as `DashboardService::get_product_stock`.

### D9. Floating Sheet

`Sheet` (root) gets optional `floatable?: { storageKey: string }`. Docked:
current Radix Dialog modal behaviour. Floating: render with `modal={false}`
on the Radix root (passed from `Sheet` through context), no overlay, panel
`position: fixed` with `left/top` from state, `onInteractOutside` prevented so
page clicks do not close it. Drag: pointer events on the header (pointer
capture), clamp to the viewport on move, on drop and on window resize.
Persist `{ mode, x, y }` in local storage under `storageKey`, with try/catch.
Below 640px the sheet always docks. The dock button (`PanelRight` icon,
"Dock to the right") sits before the close button. Analytics uses
`kirki-ecommerce:analytics:customize-sheet`, Home uses
`kirki-ecommerce:home:customize-sheet`.

Switching `modal` while open remounts focus handling. Accept a focus move to
the panel on mode change.

**Correction during implementation:** Radix renders a different content
element for `modal` and non-modal dialogs, so a mode change while the sheet is
open remounts the content. Two consequences:

- The option lives on the `Sheet` root, which owns `modal`, not on
  `SheetContent`. The root keeps the float state in a context
  (`components/ui/use-sheet-float.ts`) that `SheetContent` and `SheetHeader`
  read.
- The drag uses `pointermove`/`pointerup` listeners on `window`, not pointer
  capture on the header, because the header element is replaced when the
  panel starts to float. The panel floats only after a 4px move, so a click on
  the header does nothing. Clicks on buttons, links and fields in the header
  never start a drag.

### D10. Docs

`docs/home.md` per CLAUDE.md §6: quick start, period, key numbers, sections,
needs your attention rules, restock soon, customize sheet, storage, API
additions, and "Where this differs from WooCommerce / Shopify home" (no
comparison, local-storage only, no COD type, no goal).

## Risks / Trade-offs

- **Numbers change for existing stores** (all time → this month, Home
  definitions → Analytics definitions). Accepted by the product owner; the
  docs and the info tooltips state the definitions.
- **`kpis` for All time on big stores** can be slow (series over many
  months). Mitigation: the same query cost as Analytics "Last 12 months"
  times the years; acceptable for now; measure during apply.
- **`JSON_EXTRACT` on `payment_metadata`** is not indexed. Counts run on the
  unpaid/failed subset filtered by the indexed `payment_status` first.
- **Two layouts read the Analytics amount format** – if Analytics changes its
  storage shape, Home must follow. Mitigated by reading through the exported
  `normalizeLayout`.
- **Floating mode** changes modal semantics of a shared primitive. It is
  opt-in per sheet, and the docked path is unchanged, so other sheets are not
  affected.

## Backward compatibility

- REST: new range values, new `attention` and `low_stock` values, new route.
  All additive; old requests behave the same.
- `GET /dashboard/overview` response is unchanged.
- PHP: new constants and methods only; extracted query conditions keep the
  old public method signatures.
- Components: `SheetContent` and `PageHeading` get optional props only.
- No stored data change. Local storage keys are new.
