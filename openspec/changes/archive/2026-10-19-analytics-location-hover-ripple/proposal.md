## Why

On the Sales by location card, the country list is at the right and the map is
at the left. When a merchant reads a row, it is not easy to find that country on
the map, mainly a small or a light-colored one. A short purple ripple on the
map shows where the country is.

## What Changes

- A mouse hover or keyboard focus on a country row in the Sales by location
  list shows one purple ring that starts at the center of the country on the
  map, grows and fades.
- The ripple plays one time for each new hover or focus. It does not repeat
  while the row stays hovered.
- With reduced motion, a static purple ring shows at the country center while
  the row has hover or focus.
- A region row (after a country is selected) shows no ripple. The bundled map
  has country shapes only, so it cannot show a region.
- A country that has no shape in the bundled map shows no ripple.
- The map hover keeps its current border and tooltip. A row hover does not show
  them.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics-page`: adds the row-hover ripple requirement for the Sales by
  location card.

## Impact

- `resources/app/features/analytics/components/charts/hbar-list.tsx`: an
  optional highlight callback on a selectable row.
- `resources/app/features/analytics/components/cards/sales-by-location-card.tsx`:
  keeps the highlighted country and gives it to the map.
- `resources/app/features/analytics/components/charts/choropleth-map.tsx`:
  draws the ring. It uses the existing `theme.colors.analytics.map.ping` token.
- Tests in `features/analytics/tests/components/`.
- `docs/analytics.md`: the card text and the "Where this differs" item about
  regions.
- No API, PHP or new package change.
