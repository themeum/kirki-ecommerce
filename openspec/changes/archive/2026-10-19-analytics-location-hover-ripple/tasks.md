## 1. Bar list

- [x] 1.1 Add `onHighlight?: (active: boolean) => void` to `HBarItem` in `hbar-list.tsx` and call it from the select button on mouseenter, focus, mouseleave and blur
- [x] 1.2 Add tests in `tests/components/charts.test.tsx`: the callback gets `true` and `false`, and a row with no `onSelect` gets no handlers

## 2. Map ring

- [x] 2.1 Add `rippleNumericCode: string | null` to `ChoroplethMapProps` and draw the keyed ring circle outside the zoom group at the zoomed centroid of the largest polygon
- [x] 2.2 Add the ripple keyframes and styles with `theme.colors.analytics.map.ping`, and the reduced-motion static ring
- [x] 2.3 Add tests: the ring shows for a code with a shape, it does not show for a code with no shape or for `null`, and it is hidden from assistive technology

## 3. Card wiring

- [x] 3.1 Keep `highlightedCode` in `sales-by-location-card.tsx`, give `onHighlight` only to country rows, and give the map `rippleNumericCode`
- [x] 3.2 Add tests in `tests/components/sales-by-location-card.test.tsx` for the spec scenarios: hover, hover again (new circle), move to another row, keyboard focus, region row, and a country with no map shape

## 4. Docs and checks

- [x] 4.1 Update `docs/analytics.md`: the Sales by location row in the cards table, and the "Where this differs" item that says region rows show no ripple
- [x] 4.2 Run `npm run typecheck`, lint and `npm test` in `resources/app`
