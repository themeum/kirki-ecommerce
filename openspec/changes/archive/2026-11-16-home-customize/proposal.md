## Why

The Home overview shows a fixed set of four all-time numbers and two lists. A
merchant cannot see how the store does this month, cannot pick the numbers that
matter to them, and cannot see the work that waits for them (orders to ship,
money to collect, stock to refill). Analytics already has the metric engine,
the metric definitions and a customize sheet, so Home can reuse them and stay
consistent with Analytics.

## What Changes

- Dashboard-mode header gets a subtitle "Your store at a glance: <period ▾>"
  with This month (default), This week, Today and All time. Home never shows a
  comparison with an earlier period.
- Dashboard-mode header actions become merchant-chosen **quick actions** (at
  most 3) from: Create order, View live site, Add product, Create coupon, Add
  customer. Default: Create order (main button) and View live site. The first
  checked action is the primary button.
- A **Customize** icon button (sliders) right of the quick actions opens a
  "Customize home" sheet with three groups: Quick actions (n/3), Key numbers
  (n/4) and Sections. Each item has a drag handle and a checkbox. Footer:
  Reset to default, Done.
- **Key numbers** section: the 11 Analytics key metrics, with the Analytics
  engine (`GET analytics/metrics/kpis`, `compare=none`) and the Analytics
  definitions and info texts. At most 4 on. Default on: Total sales, Net sales,
  Orders, Items ordered. Replaces the four Home-only metric cards.
- **Top selling products** uses `GET analytics/metrics/sales_by_product` for
  the selected period, ranked by net sales.
- New **Needs your attention** section with three checks: Orders to ship,
  Payments to collect, Out of stock. Each row shows a count, an info tooltip
  and opens the matching filtered list.
- New **Restock soon** section (off by default): tracked variants at or under
  their low-stock threshold, fewest left first, 5 rows.
- Sections (Key numbers, Recent orders, Top selling products, Restock soon,
  Needs your attention) can be reordered and turned on or off, with no
  maximum. Every card has an info tooltip and a "Hide from page" menu.
- The layout and the period are saved in browser local storage.
- The shared **Sheet** gets an optional floating mode: drag the header to float
  the panel, select the dock button to put it back at the right. Home and
  Analytics customize sheets both use it.
- Additive API changes:
  - Analytics range presets `week_to_date` and `all_time`.
  - Order list parameter `attention` (`to_ship`, `to_collect`).
  - Inventory list stock filter value `low_stock`.
  - New endpoint `GET /dashboard/attention`.
- `GET /dashboard/overview` keeps its response shape. Home stops reading its
  `metrics` and `top_products` fields but they stay in the response.
- Checklist mode (setup not complete) does not change.
- Not in scope: the Goal section, Import products, a Home-only amount format,
  links from Home cards to Analytics.

**Default behaviour change (agreed):** after the update, a completed store sees
"This month" numbers from the Analytics engine instead of all-time Home-only
numbers, and the header shows Create order and View live site instead of View
Live Site and Add Product. No setting or stored data changes.

## Capabilities

### New Capabilities

- `home-customize`: the Customize home sheet, the quick actions, the period
  subtitle, the Key numbers section, the section layout, the card menus and
  the local-storage layout.
- `home-attention`: the Needs your attention and Restock soon sections and the
  `GET /dashboard/attention` endpoint.

### Modified Capabilities

- `merchant-home-dashboard`: the header, the metric cards, the Top selling
  products data source, the info tooltips and the overview layout change in
  dashboard mode.
- `analytics-metrics`: two new date range presets, `week_to_date` and
  `all_time`.
- `sheet-primitive`: optional floating mode with a dock button.
- `analytics-customize`: the Customize analytics sheet can float.
- `order-list-filters`: new `attention` filter.
- `catalog-list-filters`: the inventory stock filter gets a low stock value.

## Impact

- **Frontend** (`resources/app/`): `features/home` (page header, overview,
  new sections, layout hook, customize sheet), `features/analytics` (new public
  API `index.ts` for the metric definitions, metric queries, amount format,
  card menu and sortable list; floating sheet), `components/ui/sheet.tsx`,
  `features/orders` (attention filter chip), `features/inventory` (low stock
  option).
- **Backend** (`app/`): `AnalyticsRangeResolver`, `AnalyticsMetricRequest`,
  `OrderListRequest` and the order list query, `VariantListRequest`,
  `InventoryType` and `VariantService`, new `DashboardController::attention`
  and `DashboardService` method, `routes/api.php`.
- **Docs:** new `docs/home.md`.
- **Released surfaces touched (all additive):** Analytics REST range values,
  order list REST parameters, variant list REST parameters, a new REST route,
  the Sheet component props. No database, option or meta change.
