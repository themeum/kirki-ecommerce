## Why

On the Sales by location map, only a country with a value reacts to the
mouse. A merchant who hovers a gray country sees nothing, so the map looks
broken and the merchant cannot find out which country it is.

## What Changes

- Hovering a country with no value shows the same border as a country with a
  value, and a tooltip with the country name and "No data".
- A country with no value keeps the default cursor, does nothing on a click,
  and stays out of the keyboard order (no change to the click and keyboard
  behavior).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-page`: the "Sales by location map" requirement changes the hover
  behavior of a country with no value.

## Impact

- `resources/app/features/analytics/components/charts/choropleth-map.tsx`
- `resources/app/features/analytics/tests/components/sales-by-location-card.test.tsx`
- `docs/analytics.md` (the Sales by location row)
- No API change and no new dependency.
