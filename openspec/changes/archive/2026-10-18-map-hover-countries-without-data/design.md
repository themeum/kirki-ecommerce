## Context

`ChoroplethMap` draws each country as a `<path>`. A country with a value gets
`role="button"`, `tabIndex`, click, key, mouse and focus handlers. A country
with no value gets none of them. The hover border is one extra `<path>` with
the active shape and no pointer events, and the tooltip reads the active area.

## Goals / Non-Goals

**Goals:** a border and a "<name> · No data" tooltip on hover for a country
with no value.

**Non-Goals:** no click, no focus, no selection and no cursor change for a
country with no value. No change to the colors or the legend.

## Decisions

- The active state keeps one id for both kinds of country. The border shows
  for any active shape. The tooltip shows the area of the shape when it has
  one, and else the shape name from the map geometry and "No data". Reason:
  one state and one border path, so the two kinds look the same.
- A country with no value gets only `onMouseMove` and `onMouseLeave`. It gets
  no role, no `tabIndex` and no click handler. Reason: it is not an action, so
  it must not be a button for a screen reader or a keyboard user.
- The name comes from the geometry (`properties.name`), because the API sends
  no row for a country with no value.

## Risks / Trade-offs

- The geometry name can be different from the WooCommerce country name (for
  example "United States of America"). This applies only to countries with no
  value, and the risk is small.
