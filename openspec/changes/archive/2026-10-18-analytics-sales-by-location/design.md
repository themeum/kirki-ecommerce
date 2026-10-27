## Context

The Analytics page gets all card data from `GET /analytics/overview`
(`AnalyticsQueryService::build_cards`). The charts are hand-written SVG and CSS
components in `resources/app/features/analytics/components/charts/`. The page
has no map library.

Orders keep two addresses as columns: `shipping_country`, `shipping_state`,
`billing_country`, `billing_state`. The country is an ISO 3166-1 alpha-2 code.
`resources/data/countries.php` (`CountryData`) gives each code a name and a
`numeric_code` (for example `US` → `840`). `get_region_name()` and
`get_state_name()` already turn a saved state (ID, name or code) into a state
name for Taxes by region. The plugin goes to the WordPress.org directory, so
it cannot load a file from another site.

## Goals / Non-Goals

**Goals:**

- A world choropleth with country colors by Sales, Orders or Customers, a
  hover border, a tooltip and a click zoom.
- A top 5 list of countries, and the top 5 regions of a selected country.
- No remote load, and a small bundle cost for the rest of the page.

**Non-Goals:**

- State or region shapes on the map. The bundled geometry has only countries.
- Wheel zoom, drag pan and zoom buttons.
- City rows.
- The selected country in the URL.

## Decisions

### 1. Geometry: `d3-geo` + `topojson-client` + `world-atlas` 110m

`world-atlas/countries-110m.json` (public domain, about 100 KB raw) has one
feature per country with the ISO numeric code as its `id`. `topojson-client`
turns it into GeoJSON, and `d3-geo` gives the projection and the SVG path
strings. The map component loads the JSON with a dynamic `import()`, so the
geometry is a separate chunk. The rest of the page does not wait for it. While
the chunk loads, the map area shows a skeleton.

Alternatives: pre-built SVG paths (no runtime library, but hand-written zoom
math and projection), and `react-simple-maps` (one more dependency, not well
maintained). The user chose this option in the grill.

### 2. Projection and zoom

- `geoMercator()`, fitted with `fitSize` to the map width and a fixed aspect
  ratio. Antarctica (`010`) is left out, so the map uses the height for the
  land.
- The paths sit in one `<g>`. A zoom sets the `transform` of that `<g>` to
  `translate(...) scale(k)`, with a CSS transition, so no path is computed
  again. Each path has `vector-effect: non-scaling-stroke`, so the borders keep
  their width at every zoom level.
- The fit uses the bounds of the **largest polygon** of the country, with a
  10% margin, and a maximum scale of 8. A country with far islands or
  territories (France with French Guiana, the United States with Hawaii) then
  fits its main land, and the other parts stay visible when they are near.
- The faded countries get a lower opacity. The selected country keeps its
  color.

### 3. Hover border

SVG draws later shapes on top, so a border on a country in the middle of the
list is hidden under its neighbors. The hovered or focused country is drawn a
second time, last in the `<g>`, with only a stroke and `pointer-events: none`.

### 4. Matching countries

The overview gives each country `code`, `numeric_code` and `name`. The map
matches `feature.id` to `numeric_code`, padded to 3 digits. Countries that the
110m geometry leaves out (Singapore, Malta, Bahrain and other small countries)
are still in the list. A click on their row selects them and shows their
regions, but the map does not zoom. Shapes in the geometry with no code (for
example Northern Cyprus, Kosovo) never have a value, so they stay gray.

### 5. Color scale

`locationColor(value, min, max)` in a pure helper returns
`color-mix(in srgb, <map.high> <p>%, <map.low>)` with
`p = round(sqrt((value − min) / (max − min)) × 100)`. When `max === min`, `p`
is 100. The two colors are the existing `analytics.map.high` and
`analytics.map.low` theme tokens. "None" uses `analytics.map.empty`, and the
hover border uses `analytics.map.outline`. No new token is needed. The same tokens draw the
legend gradient.

### 6. Backend queries

One SQL expression picks the address:

```sql
CASE WHEN COALESCE(o.shipping_country, '') <> '' THEN o.shipping_country ELSE COALESCE(o.billing_country, '') END
```

and the same `CASE` (on the shipping country) picks the state from the same
address. Three queries per range, each grouped by country (or by state with a
`country = %s` condition):

- **Sales:** items of sales orders (`sales_scope`), Σ (`base_total` −
  `base_tax_total`), the same as Sales by product.
- **Orders:** `placed_scope`, `COUNT(*)`.
- **Customers:** `sales_scope`, `COUNT(DISTINCT <customer identity>)`, with the
  same identity expression as the Customers metric.

The PHP merges the three results and the comparison results by key, and
calculates the change with the existing change helper. Rows with an empty
country are dropped. `build_cards` gets
`'sales_by_location' => ['countries' => [...]]` with all countries (no
limit). Each row has `code`, `numeric_code`, `name`, and for each metric a
value and a change. Sales uses the money object format of the other cards.

`regions(array $range, string $country)` runs the same three queries grouped
by state and returns `{sales: [...], orders: [...], customers: [...]}`. Each
list has the top `LIST_LIMIT` (5) rows by that metric, with `name` from
`get_state_name()`, or "Unknown region" for an empty state.

Alternative: put the regions of every country in the overview. The user chose
fetch on click to keep the overview small.

### 7. Regions endpoint

`GET /analytics/regions`, in the same route group and with the same capability
as `/analytics/overview`. A new `AnalyticsRegionsRequest` uses the overview
request rules and adds `country`: required, and a key of
`CountryData::index()`. The controller resolves the range in the same way as
`overview` and calls `regions()`.

### 8. Frontend structure

- `schemas`: `LocationRowSchema`, the `sales_by_location` card and
  `AnalyticsRegionsSchema`.
- `services/analytics.ts`: `useAnalyticsRegionsQuery(params, country)`, with
  the key `['AnalyticsRegions', params, country]` and `enabled: !!country`.
  `endpoints.ANALYTICS_REGIONS`.
- `lib/location.ts`: `locationColor`, `topLocations(rows, metric)` and the
  value format for each metric.
- `components/charts/choropleth-map.tsx`: the projection, the paths, the
  hover border, the tooltip, the zoom and the keyboard handling. Countries
  with a value are `<path role="button" tabIndex={0}>` with an
  `aria-label`. Countries with no value have no role and no handlers. A
  `<rect>` under the paths is the sea, and a click on it clears the selection.
- `components/cards/sales-by-location-card.tsx`: the tabs, the state of the
  selected tab and the selected country, the list header with
  "← All countries", the legend, Escape on the card, and the regions query.
- `HBarList` gets an optional `onSelect` on each item. An item with
  `onSelect` renders its row as a `button`. Other cards do not change.
- The selected country is component state. The card derives
  `selected = countries.some(c => c.code === state) ? state : null`, so a
  country with no value in a new range is cleared with no effect hook.

## Risks / Trade-offs

- **Bundle size** → The geometry and `d3-geo` are in a lazy chunk (about
  100 KB raw, about 35 KB gzip for the JSON). Only `d3-geo` is imported, not
  all of `d3`.
- **Small countries are missing from 110m** → They stay in the list and their
  regions show. The 50m geometry (about 750 KB) is not worth the cost.
- **Disputed borders** → The geometry shows Natural Earth's de facto borders.
  This is the same as other commerce analytics tools.
- **Many focus stops** → Only countries with a value can be focused. A store
  with orders from 60 countries has 60 stops in the map. The list rows are a
  shorter keyboard path.
- **jsdom has no layout** → The tests check the paths, roles, labels, `fill`
  and the transform attribute. A visual check of the zoom is for the user.
- **A derived selection comes back** → If a range clears a country and a later
  range has it again, it is selected again. This is acceptable.

## Migration Plan

No database change. Add the npm dependencies, then deploy the plugin as usual.

## Open Questions

None.
