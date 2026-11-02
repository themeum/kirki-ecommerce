## Context

See proposal.md for the reason. The current state:

- `pages/analytics.tsx` renders a fixed `KpiRow` (4 hard-coded `KpiCard`s) and a
  fixed list of 15 `CardSlot`s. Each card component renders its own
  `AnalyticsCard` with a `testId` and its size.
- `useAnalyticsMetricQueries(params)` runs one `useQueries` entry for each of
  the 16 metric keys, with no `enabled` flag.
- `AnalyticsQueryService::build_kpis()` returns 4 key metrics.
  `summarize()` already returns `net_sales`, `total_sales`, `discounts`,
  `shipping`, `customers` and `new_customers` for the totals and for each
  series point. `items_ordered` is on the window but not on each series point.
- The app already uses `@radix-ui/react-dialog` (`components/ui/dialog.tsx`),
  `@radix-ui/react-dropdown-menu` (`components/ui/dropdown-menu.tsx`),
  `components/ui/checkbox.tsx` and `@dnd-kit` (payment methods list).
- `features/bulk-edit/hooks/use-column-visibility.ts` is the local-storage
  pattern: read in a `useState` initializer in `try`, write in an effect in
  `try`.

## Goals / Non-Goals

**Goals:**

- One layout state (order and on/off for each group) that the page, the sheet
  and the card menus read and write.
- The card registry (title, size, render) is in one place, so the page and the
  sheet use the same order and titles.

**Non-Goals:**

- No server-side storage of the layout (no user meta). It is per browser.
- No change to card widths by the merchant.
- No "View report" item in the menu.
- No new SQL in the backend.

## Decisions

### 1. Sheet is a styled Radix Dialog, in the shadcn shape

`components/ui/sheet.tsx` wraps `@radix-ui/react-dialog` like `dialog.tsx`:
`Sheet = Root`, `SheetTrigger`, `SheetClose`, a `SheetPortal` with
`getPortalContainer()`, `SheetOverlay`, and `SheetContent` with
`side?: 'top' | 'right' | 'bottom' | 'left'` (default `right`), a built-in
close button, `SheetHeader`, `SheetFooter`, `SheetTitle` and
`SheetDescription`. Styles use `defineStyles` and theme tokens, and each part
takes `cssOverride` (merged with `scopedMerge`), the same as `DialogContent`.
The slide uses Emotion `keyframes` on `[data-state=open|closed]` for each side,
in a `prefers-reduced-motion: no-preference` media query. `SheetContent` is a
column flex box; the feature puts its body in a scroll element between header
and footer.

Alternative: reuse `DialogContent` with a side style. Rejected: the shadcn
API is a separate component, and the Dialog centering and sizes do not apply.

The overlay and the panel use a new `theme.zIndex.sheet` (100000). The
WordPress admin bar is at 99999 and `dropdown` is at 100000, so no integer
fits between them. A dropdown or select that opens from inside the sheet
mounts its portal later, so at the same z-index it stacks above the sheet.
Tooltips (100100) and toasts (100200) stay above. The Dialog layers (1000 and
1001) are below the admin bar, so a full-height panel on them goes under it.

Note: `dialog.tsx` has special handling for the WordPress media frame and
TinyMCE panels on outside interaction. The sheet does not copy it, because no
sheet hosts those editors now.

### 2. Layout model and storage

`features/analytics/lib/layout.ts`:

```ts
type LayoutItem<K> = { key: K; visible: boolean };
type AnalyticsLayout = { kpis: LayoutItem<KpiKey>[]; cards: LayoutItem<CardKey>[] };
```

- `KPI_KEYS` (11, in default order) and `CARD_KEYS` (15, in page order) are the
  source for the defaults. `DEFAULT_LAYOUT` has the first 4 KPIs on and all
  cards on.
- `normalizeLayout(raw: unknown)` checks the value with a Zod schema, drops
  unknown keys and duplicates, adds missing keys at the end with their default
  `visible`, and turns on the first item of a group that has none on. A value
  that fails the schema gives `DEFAULT_LAYOUT`.
- `hooks/use-analytics-layout.ts` reads
  `kirki-ecommerce:analytics:layout` in the `useState` initializer and writes it
  in an effect, each in `try`, like `use-column-visibility.ts`. It returns the
  layout and the actions `setVisible(group, key, visible)`,
  `move(group, from, to)` and `reset()`. `setVisible` does nothing when it
  would turn off the last item of a group.

An array of `{ key, visible }` keeps the order and the state in one value, so
a reorder of a hidden item keeps its position.

Alternative: two values (`order[]` and `hidden: Set`). Rejected: two writes
for one change, and they can disagree.

The layout lives in the `Analytics` page component and goes down as props to
`MetricsContent` and `AnalyticsControls` (which owns the sheet). No context:
the tree is 2 levels deep.

### 3. Card registry

`features/analytics/lib/card-registry.tsx` maps each `CardKey` to
`{ size: 'half' | 'full', render(data, meta, params) }`. Titles come from
`getMetricDefinitions()`. `MetricsContent` maps the visible layout cards to
`CardSlot`s from this registry, in layout order. The registry replaces the 15
hand-written `CardSlot` blocks; the per-card render code moves into it without
a change.

`KpiRow` uses a similar map, `KPI_FORMATS`, from KPI key to
`'money' | 'count' | 'percent'`, to choose `formatMoney`, `formatNumber` or
`formatPercent`.

### 4. Hide-from-page menu on `AnalyticsCard`

`AnalyticsCard` gets an optional `menu?: { onHide: () => void; canHide: boolean }`.
When it is set, the title row shows a `CardMenu` (dropdown with one
`DropdownMenuItem` "Hide from page", X icon, `disabled={!canHide}`) at the end.
The trigger is a ghost icon button with `MoreHorizontal`, named "More actions
for <title>". It reuses the hover/focus rule of the info icon: it gets a
`data-card-menu` attribute, and the card styles show it on `:hover`,
`[data-focused="true"]`, `[data-menu-open="true"]` and `(hover: none)`.

The card components do not know about the layout. To avoid a new prop on 15
card components, `CardSlot` gives the menu through a small React context,
`CardMenuContext`, that `AnalyticsCard` reads. `CardError`, `KpiCard` and the
card skeleton get the same menu, so a merchant can hide a card that fails.
Skeletons do not get a menu.

Alternative: add `onHide` to `CardProps` and each card. Rejected: 15 files
change for a prop that they only pass through.

### 5. Queries for visible parts only

`useAnalyticsMetricQueries(params, enabledKeys)` sets
`enabled: enabledKeys.has(key)` for each entry. `kpis` is always enabled,
because at least 1 KPI is on. `hasAllFailed` checks only the enabled keys. A
disabled query has `data` undefined and is not an error, so a card that is
turned on shows its skeleton by the existing `CardSlot` rule.

### 6. KPI grid

The KPI row stays a CSS grid with `repeat(4, minmax(0, 1fr))` (2 below 1100px,
1 below 600px). A grid keeps each KPI at 1/4 on a line that is not full, which
is the grill decision. The skeleton count is the number of visible KPIs.

### 7. Cards row

The cards row stays `flex-wrap` with half cards at `flex: 1 1 calc(50% - 8px)`.
Flex-grow already makes a half card that is alone in its row fill it. No change
is needed, only tests.

### 8. Sortable lists in the sheet

`components/customize-sheet.tsx` has two `DndContext`s, one for each group,
each with a `SortableContext` and `verticalListSortingStrategy`,
`restrictToVerticalAxis` and a `restrictToList` modifier that keeps the row
inside the measured `StackedItems` list, the same as the payment methods list.
`restrictToParentElement` does not work here: dnd-kit measures the dragged
node's parent, and each `StackedItem` has its own wrapper of the row's size, so
the row could not move. Two contexts make a move between groups impossible. Sensors: `PointerSensor` and `KeyboardSensor`
with `sortableKeyboardCoordinates`, the same as the payment methods list. The
handle has the accessible name "Reorder <title>". `onDragEnd` calls
`move(group, from, to)`.

### 9. Backend KPIs

`build_kpis()` adds 7 entries with `money_metric` or `count_metric` and
`build_series`. The new keys map to the totals keys: `net_sales`,
`total_sales`, `discounts`, `shipping_charges` → `shipping`, `customers`,
`new_customers`, `items_ordered`. For `items_ordered`, `summarize()` takes a
4th argument, the items ordered of the period, and the window builder passes
`placed_by_bucket[key]['items_ordered']` for each point and the sum for the
totals. The window already has these numbers; no query changes.

## Risks / Trade-offs

- [The `kpis` response is larger: 11 series instead of 4] → The series come
  from the same window, so the SQL cost is the same. The JSON grows by about
  7 short arrays.
- [Layout is per browser, not per user] → Two admins on one browser share a
  layout. This is the same as the bulk-edit column visibility, and the user
  asked for local storage.
- [A context for the card menu is less clear than a prop] → It is limited to
  `AnalyticsCard` and `CardSlot`, and it has one test.
- [Disabled queries keep old data in the cache] → When a card is turned on
  again with the same range, TanStack Query shows the cached data and fetches
  again (`staleTime: 0`). This is wanted.

## Migration Plan

No migration. A browser with no saved layout gets the default layout, which is
the same as the page now. Rollback: revert the commit; the saved key is
ignored.
