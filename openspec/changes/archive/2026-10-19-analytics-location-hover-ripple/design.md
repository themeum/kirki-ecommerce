## Context

The Sales by location card (`sales-by-location-card.tsx`) shows a
`ChoroplethMap` and an `HBarList`. Country rows are buttons because they have
`onSelect`. Region rows have no `onSelect`. The map draws `world-atlas`
countries-110m with `geoMercator`, and it has a zoom group for a selected
country. The theme has the unused token `theme.colors.analytics.map.ping`
(violet2). The Inventory health card already has a `ripple` keyframe for its
live dot.

## Goals / Non-Goals

**Goals:**
- One ripple on the map for each new hover or focus on a country row.
- Reduced-motion support.

**Non-Goals:**
- Region, state or district ripples. They need an admin-1 geometry file, which
  is large and not in the bundle.
- A ripple on a hover of the map itself.
- A border or tooltip on a row hover.

## Decisions

1. **`HBarItem.onHighlight?: (active: boolean) => void`.** The select button
   calls it with `true` on `mouseenter` and `focus`, and with `false` on
   `mouseleave` and `blur`. Only selectable rows get it, so region rows cannot
   start a ripple. Alternative: hover props on the list. Rejected, because a
   row-level callback keeps the list generic.

2. **The card keeps `highlightedCode: string | null`** (the ISO code) and gives
   the map `rippleNumericCode` from the matching country's `numeric_code`
   through `toMapCode`. The last event wins: a `false` clears the state only
   when it is for the code that is in the state, so a fast move from row A to
   row B does not clear B.

3. **The map draws one `<circle>` outside the zoom group**, keyed by the numeric
   code, at the centroid of `largestPolygon` of that shape, mapped through the
   zoom transform (the same math as `focusPoint`). Outside the zoom group, the
   ring size stays in screen pixels. The key makes React mount a new circle for
   each new hover, so the CSS animation starts again with no counter. When the
   hover goes, the card sends `null` and the circle unmounts.
   The largest polygon is used so that a country with far islands (for example
   France with French Guiana) gets its ring on the main land.

4. **Animation:** a local `keyframes` that scales the circle from 1 to 4 and
   fades opacity from 0.9 to 0, 800 ms, `ease-out`, one iteration,
   `animation-fill-mode: forwards`, `transform-box: fill-box`,
   `transform-origin: center`. The circle has `fill="none"`,
   `stroke={theme.colors.analytics.map.ping}`, a 2px stroke with
   `vector-effect: non-scaling-stroke`, `pointer-events: none` and
   `aria-hidden`. A base radius of 6px gives a 24px final ring.
   Under `prefers-reduced-motion: reduce` the animation is `none` and the
   circle shows at scale 4 and opacity 1.

5. **No shape, no ring.** When the code has no shape or no polygon, the map
   draws nothing.

## Risks / Trade-offs

- [The 110m data has no shape for some small countries] → No ring for them.
  The spec states this.
- [jsdom does not run CSS animations] → Tests check that the circle mounts,
  where it is, that it remounts on a new hover and that it unmounts on leave.
  They do not check the animation frames.
