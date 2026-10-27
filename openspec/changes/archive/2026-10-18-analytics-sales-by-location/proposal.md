## Why

The Analytics page does not show where the sales, orders and customers come
from. Merchants use this to plan shipping zones, tax registration, ads and
stock. The `analytics-foundation` proposal names "Sales by location" as a later
card.

## What Changes

- Add the full-width **Sales by location** card after "Orders by time of day".
  The world choropleth map is at the left and a "Sales | Orders | Customers"
  tab with a top 5 list is at the right. Under 720px, the list goes below the
  map.
- The map colors each country by the value of the selected tab. A country
  with a bigger value is a darker purple and a country with a smaller value is
  a lighter purple. The color follows the square root of the value share. A
  country with no value is gray ("None"). The legend shows the metric name,
  the minimum value, a gradient, the maximum value and "None".
- Hovering or focusing a country with a value shows its border and a tooltip
  with the name, the value and the change. Only a click zooms. There is no
  wheel zoom and no drag pan.
- With no country selected, the list shows the top 5 countries for the
  selected tab, each with the value, a bar and the change.
- A click on a country with a value (or on its list row) zooms the map so the
  country fits in the center, and fades the other countries. The list then
  shows "<Country> by region" and the top 5 states of that country, with an
  "← All countries" link. "← All countries", Escape or a click on the sea zooms
  back out. A country with no value cannot be selected.
- The selected country stays selected when the range or the comparison
  changes, if it still has a value. Else the card goes back to All countries.
  The selection is not in the URL.
- The location of an order is its shipping address. When the order has no
  shipping country, the billing address is used. Orders with no country are
  not on the map or in the lists. In a country, orders with no state group
  into one "Unknown region" row.
- Tab metrics: **Sales** is Net sales (the same as Sales by product),
  **Orders** is placed orders, and **Customers** is the number of different
  customers with a sales order.
- The analytics overview gets a new `sales_by_location` card with all
  countries and their three metrics and changes.
- A new endpoint `GET /analytics/regions?country=XX` (with the same range and
  comparison parameters) returns the top 5 states of one country for the three
  metrics. The card fetches it on a click.
- New frontend dependencies: `d3-geo`, `topojson-client` and `world-atlas`
  (110m country geometry, bundled and lazy-loaded with the card, no remote
  load).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-metrics`: add the location metrics for each country and for each
  state of one country, and the new regions endpoint.
- `analytics-page`: add the card to the Cards table and order, and add the
  map, the tabs, the lists, the drill-down and the hover behavior.

## Impact

- `app/Services/AnalyticsQueryService.php`: a location query (country, or
  state for one country) for the three metrics, the `sales_by_location` key in
  `build_cards`, and a new regions method.
- `app/Http/Controllers/Api/AnalyticsController.php`, a new request class and
  `routes/api.php`: the `GET /analytics/regions` route.
- `resources/app/features/analytics/`: Zod schemas, a regions query hook, the
  metric definition, the empty check, a new card, a choropleth map chart, a
  pure helper for the color scale and the ranking, the page order and the
  skeleton sizes.
- `resources/app/package.json`: `d3-geo`, `topojson-client`, `world-atlas`
  and their type packages.
- Tests: PHP integration tests, and Vitest tests for the helper, the card and
  the page.
- `docs/analytics.md`: the Cards table and the new endpoint.
- No database change.
