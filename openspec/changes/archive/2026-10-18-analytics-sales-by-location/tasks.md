## 1. Backend metrics

- [x] 1.1 In `AnalyticsQueryService`, add the location `CASE` expressions for the country and the state (shipping address, else billing address)
- [x] 1.2 Add a query method that returns Sales (item Net sales of sales orders), Orders (placed orders) and Customers (distinct customers of sales orders) for one range, grouped by country, or by state for one country
- [x] 1.3 Add `build_sales_by_location($range)`: merge the current and comparison results, add `code`, `numeric_code`, `name` and the changes, drop the empty country, and add `'sales_by_location'` to `build_cards` after `orders_by_time_of_day`
- [x] 1.4 Add `regions(array $range, string $country)`: the top 5 states for each metric, with the state name from `get_state_name()` or "Unknown region"

## 2. Regions endpoint

- [x] 2.1 Add `AnalyticsRegionsRequest` with the overview rules and a required `country` that is a key of `CountryData::index()`
- [x] 2.2 Add `AnalyticsController::regions()` and the `GET /analytics/regions` route with the same access as the overview

## 3. Backend tests

- [x] 3.1 Integration tests in `AnalyticsMetricsTest`: shipping wins over billing, billing when no shipping country, no country left out, unpaid order counts only in Orders, one customer with 2 orders, the country change
- [x] 3.2 Integration tests for the regions: "Unknown region" row, top 5 for each metric, 422 for an unknown country, 403 without `manage_options`

## 4. Frontend data

- [x] 4.1 Add `d3-geo`, `topojson-client`, `world-atlas` and the `@types/d3-geo` and `@types/topojson-client` dev packages
- [x] 4.2 Add the Zod schemas for the `sales_by_location` card and the regions response, and `endpoints.ANALYTICS_REGIONS`
- [x] 4.3 Add `useAnalyticsRegionsQuery(params, country)` in `services/analytics.ts`
- [x] 4.4 Add the metric definition (title "Sales by location" and the info text) and the empty check (no countries)
- [x] 4.5 Add `lib/location.ts` with `locationColor`, `topLocations` and the value format for each metric, and a light purple map token if no existing token fits

## 5. Frontend components

- [x] 5.1 Add an optional `onSelect` to the `HBarList` items, rendered as a `button` row
- [x] 5.2 Add `charts/choropleth-map.tsx`: lazy geometry with a skeleton, Mercator fit without Antarctica, country fills, hover/focus border drawn on top, tooltip, keyboard select, sea click, and the animated zoom to the largest polygon of the selected country
- [x] 5.3 Add `cards/sales-by-location-card.tsx`: the map and list layout (stacked under 720px), the tabs, the country list, the region list with "← All countries", the loading and error states of the regions, Escape, the derived selection and the legend
- [x] 5.4 Add the card to `pages/analytics.tsx` after Orders by time of day, and update the skeleton sizes

## 6. Frontend tests

- [x] 6.1 `lib/location.test.ts`: the color scale ends and the square root, `max === min`, and the top 5 order
- [x] 6.2 Card tests: top 5 countries, tab change recolors the map and the list, a country with no value has no button, a click selects and fetches the regions once, a tab change in a country makes no new request, Escape and "← All countries" go back, a range change keeps or clears the country, no change with comparison None
- [x] 6.3 Update the page test fixtures and the card count

## 7. Docs and checks

- [x] 7.1 Update `docs/analytics.md`: the Cards table, the location rule and the regions endpoint
- [x] 7.2 Run `npm run typecheck`, `npm run lint` and `npm test` in `resources/app/`, and `php -l` and phpcs on the changed PHP files
