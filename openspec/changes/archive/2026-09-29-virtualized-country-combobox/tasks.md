## 1. Leading icon on the searchable select

- [x] 1.1 Add `leftIcon?: ReactNode` to `ComboboxOption` in `resources/app/components/ui/combobox.tsx`, matching the existing `leftIcon?: ReactNode` convention in `components/ui/checkbox.tsx` and `components/option-accordion.tsx`
- [x] 1.2 Derive a single `hasLeadingIcons` flag from `options.some((option) => option.leftIcon)` so icon space is reserved per list, not per row
- [x] 1.3 Render the leading icon before the label in the option row, reserving a fixed-width slot for rows without one only when `hasLeadingIcons` is true, so a list with no icons renders exactly as today
- [x] 1.4 Render the leading icon before the label on the closed trigger for the single-select selected option
- [x] 1.5 Render the leading icon before the label inside each chip in multi-select mode, leaving the existing remove control untouched
- [x] 1.6 Add the icon slot styles to the component's `defineStyles` block using `theme` tokens, per CLAUDE.md's styling rule

## 2. Virtualized rendering path

- [x] 2.1 Add `virtualized?: boolean` to `ComboboxProps`, defaulting to `false`
- [x] 2.2 Import `defaultFilter` from `cmdk` and build the filtered rows in a `useMemo`: pass options through untouched when the search string is empty, otherwise score each option's label, drop zero scores, and sort by descending score
- [x] 2.3 Set `shouldFilter={false}` on `Command` only when `virtualized` is true, leaving the default path on cmdk's own filtering
- [x] 2.4 Attach a ref to `CommandList` and wire `useVirtualizer` with `getScrollElement`, `estimateSize: () => 32`, `overscan: 10`, `getItemKey` returning the option's `value`, and an `initialRect` — following the precedent in `components/regions-dialog.tsx:539`
- [x] 2.5 Render the virtualized rows inside a sizer div with explicit `height: totalSize` and `position: relative`, with each row absolutely positioned by its virtual item offset
- [x] 2.6 Give virtualized rows `whiteSpace: nowrap`, `overflow: hidden`, and `text-overflow: ellipsis` so a long label cannot wrap and desynchronise the virtualizer's offsets
- [x] 2.7 Render the empty-state message from the filtered length in the virtualized path, since `CommandEmpty` no longer knows the match count with `shouldFilter={false}`
- [x] 2.8 Reset the virtualizer to offset 0 when the search string changes
- [x] 2.9 Confirm `CommandList` keeps `maxHeight` rather than a fixed `height`, so the panel settles at `min(maxHeight, totalSize)` and a short result set leaves no dead space

## 3. Country selector

- [x] 3.1 Memoize the `options` array in `resources/app/components/country-selector.tsx` so row identity survives re-renders
- [x] 3.2 Map `country.flag` to `leftIcon`, rendered in a span at `fontSize: 16` per the spec, matching the precedent in `features/settings/tax/strategies/eu/components/vat-collection.tsx:107`
- [x] 3.3 Pass `virtualized` to `Combobox`
- [x] 3.4 Verify `resources/app/components/state-selector.tsx` and `components/form/state-field.tsx` are untouched, and that `components/form/country-field.tsx` needs no change since it only forwards to `CountrySelector`

## 4. Tests

- [x] 4.1 Create `resources/app/components/ui/combobox.test.tsx` with the jsdom `ResizeObserver` note already used in `components/regions-dialog.test.tsx`
- [x] 4.2 Test that a virtualized list of several hundred options mounts only a small subset of rows while the scroll extent reflects the full count
- [x] 4.3 Test that a query returns the same matches in the same order in both virtualized and non-virtualized modes, plus a fuzzy subsequence guard on `cmdk`'s `defaultFilter` — **premise corrected:** "uk" ranks "Ukraine" first, not "United Kingdom" (a literal prefix outscores an acronym subsequence). The test now asserts "United Kingdom" is among the matches at all, which is what a degradation to `includes()` would break, and that "Ukraine" ranks first
- [x] 4.4 Test that a query matching nothing shows the empty-results message and renders no option rows
- [x] 4.5 Test arrow-key traversal past the initially mounted rows, the load-bearing case for `overscan: 10`
- [x] 4.6 Test that a leading icon renders in the option row, on the closed trigger after selection, and in a multi-select chip
- [x] 4.7 Test that a list with no leading icons renders no reserved icon slot
- [x] 4.8 Add `resources/app/components/country-selector.test.tsx` asserting flags render beside country names and that a country with no flag still renders its name

## 6. Post-implementation fix

- [x] 6.1 Hold the scroll element in state via a callback ref instead of `useRef` — Radix mounts the popover content in its own commit, so the virtualizer's layout effect resolved a `null` scroll element and never subscribed to scroll. The first ~18 rows still painted from `initialRect`, so the list silently stopped at the 19th country
- [x] 6.2 Add the missing regression test: assert that firing a scroll event mounts later rows. Every prior test only asserted the initial range, which renders identically whether or not the scroll listener is attached — that is why the bug shipped
- [x] 6.3 Confirm the fix in the running app (browser check requested by the user, overriding CLAUDE.md section 0 for this diagnosis)

## 5. Verification

- [x] 5.1 `npm run typecheck` in `resources/app/`
- [x] 5.2 `npm run lint` in `resources/app/`
- [x] 5.3 `npm test` in `resources/app/` — confirm the seven non-opted-in `Combobox` call sites have no failing tests
- [x] 5.4 Report to the user that flag rendering and the long-country-name ellipsis noted in design.md need their visual check, since CLAUDE.md section 0 rules out browser verification in this project
