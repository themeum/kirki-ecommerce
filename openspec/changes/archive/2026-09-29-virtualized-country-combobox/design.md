## Context

See proposal.md — Why.

The constraints that shape the approach:

- `components/ui/combobox.tsx` wraps `cmdk` (v1.1.1) via the `components/ui/command.tsx` primitives. `cmdk` owns filtering, ranking, keyboard navigation, and scroll-into-view today. `CommandList` is the scroll container (`maxHeight: 240px`, `overflow-y: auto`) and `CommandItem` rows carry `minHeight: 32px`.
- `cmdk` scores and sorts by reading mounted DOM nodes. It cannot score a row that is not rendered, and its sorting reorders DOM children — both incompatible with a virtualizer that positions rows absolutely by index.
- `cmdk` exports `defaultFilter` (verified present in `dist/index.mjs` at v1.1.1), the same `command-score` based scorer it uses internally.
- `@tanstack/react-virtual` ^3.14.10 is already a dependency. `components/regions-dialog.tsx:539` is the in-repo precedent and already documents the `initialRect` workaround for first paint and for jsdom, which never fires `ResizeObserver` callbacks.
- Seven other call sites share this component and are out of scope for behavior change.
- Per CLAUDE.md section 0, this project does not verify through a browser or dev-server preview. Verification is `npm run typecheck`, `npm run lint`, and `npm test` in `resources/app/`; purely visual confirmation is the user's.

## Goals / Non-Goals

**Goals:**

- Keep the virtualized and non-virtualized paths in one component without the virtualized path's concerns (manual filtering, absolute positioning, scroll reset) leaking into the default path.
- Preserve `cmdk`'s keyboard navigation, selection, and empty-state handling rather than reimplementing them.
- Make the row height a stable, known constant so a fixed-size estimator is correct rather than approximate.

**Non-Goals:**

- Dynamic row measurement. Rows are uniform single-line text; `measureElement` would add re-render churn for no gain.
- Virtualizing the creatable "add item" row or the multi-select chips in the trigger. Those are bounded in count.
- Changing panel alignment or width rules. Those belong to the `dropdown-alignment` capability and are unchanged.

## Decisions

### Opt-in prop rather than always-on

`virtualized?: boolean` on `ComboboxProps`, defaulting to `false`. The virtualized branch is a separate render path for the option rows; everything above it (trigger, popover, search input, creatable row, empty state) is shared.

*Why:* seven of the eight call sites feed short lists where virtualization is pure overhead and where the manual-filter swap would be an unforced behavior risk. Opt-in keeps the blast radius to the one control that has the problem.

*Alternative considered:* always virtualize. Rejected — it silently changes seven call sites, and small lists gain nothing.

*Alternative considered:* a bespoke list inside `country-selector.tsx`. Rejected — it would duplicate the trigger, popover, search, multi-select, and chip logic the shared component already owns.

### Filtering moves into the component, reusing `cmdk`'s own scorer

In the virtualized path only, set `shouldFilter={false}` on `Command` and derive the visible rows in a `useMemo`: when the search string is empty, pass the options through untouched in their supplied order; otherwise score each option's label with `defaultFilter` imported from `cmdk`, drop zero scores, and sort by descending score.

*Why:* this is forced by virtualization (see Context), and reusing `defaultFilter` rather than writing a matcher makes the swap behavior-neutral — the same scorer, on the same input, in the same order. That is what lets the `searchable-select` spec require identical matching and ranking across both modes.

*Alternative considered:* a case-insensitive `includes()` matcher. Rejected by the user during grilling — it is a real UX regression, since the fuzzy scorer matches subsequences like "uk" → "United Kingdom" today.

### Empty state is computed, not delegated

With `shouldFilter={false}`, `cmdk`'s `CommandEmpty` no longer knows the match count. The virtualized path renders the empty message from its own filtered-length check instead.

### Row geometry

`estimateSize: () => 32`, matching `CommandItem`'s `minHeight`. To make that exact rather than approximate, virtualized rows get `whiteSpace: nowrap; overflow: hidden; text-overflow: ellipsis` so a long label can never wrap to a second line and desynchronise the virtualizer's offsets from reality. `overscan: 10`, matching `regions-dialog.tsx`.

`getItemKey` returns the option's `value`, so React reuses rows by identity rather than by index across a filter change.

### Keyboard navigation stays with `cmdk`

`cmdk` moves selection between mounted rows and calls `scrollIntoView({ block: 'nearest' })` on the newly selected one. That scroll drives the virtualizer to mount the next batch, so arrow-key traversal walks the list an overscan-worth at a time rather than stopping at the last mounted row. This is why `overscan` is 10 and not 1 or 2 — it is load-bearing for keyboard navigation, not just paint smoothness.

*Alternative considered:* taking over keyboard navigation with our own active index plus `scrollToIndex`. Rejected as premature — it means reimplementing selection, wrap-around, and Enter handling that `cmdk` already provides correctly.

### Panel height and width

The virtualizer's sizer div gets an explicit `height: totalSize`, nested inside `CommandList`'s existing `maxHeight`. The container therefore settles at `min(maxHeight, totalSize)` on its own — a two-result query yields a two-row-tall panel with no dead space, satisfying the spec's panel-height requirement without a height calculation of our own. `maxHeight` is kept; it is not switched to a fixed `height`.

A consequence worth naming: absolutely positioned rows contribute no intrinsic width, so in virtualized mode the panel's width is driven by the trigger rather than by the widest label. This removes any width jitter while scrolling, at the cost of ellipsizing an unusually long country name instead of widening the panel.

### The scroll element must be held in state, not a ref object

`getScrollElement` reads the list node from `useState`, set via a callback ref on `CommandList` — not from a `useRef`.

*Why:* Radix mounts the popover's content in its own commit, without re-rendering `Combobox`. The virtualizer resolves its scroll element in a layout effect on the `Combobox` render, which therefore runs while a ref object would still read `null`. It bails out and never re-runs, so the scroll listener is never attached. The failure is quiet rather than obvious: `initialRect` still yields a valid first range, so the first ~18 rows paint correctly and the list simply stops partway down — with a real 220px list that boundary lands on the 19th country. Storing the node in state re-renders `Combobox` once the node exists, which is what lets the layout effect pick it up. It also re-attaches correctly when the popover is closed and reopened onto a fresh node.

*Cost:* one extra render per open. Negligible next to mounting 250 rows.

### Scroll reset on query change

When the search string changes, reset the virtualizer to offset 0. Without this, a merchant who has scrolled down and then narrows the list is left staring at a blank region past the end of the new, shorter list.

### Country selector

Opts in, memoizes its `options` array (it currently rebuilds it on every render, which defeats row identity), and maps `country.flag` to the new `leftIcon`. Flags render at `fontSize: 16`, matching the existing precedent in `features/settings/tax/strategies/eu/components/vat-collection.tsx:107`.

### Leading icon: reserve space per list, not per option

`ComboboxOption` gains `leftIcon?: ReactNode`, the name and type already used in `components/ui/checkbox.tsx`, `components/option-accordion.tsx`, `features/products/lib/price/utils.tsx`, and the EU VAT components — which already build `leftIcon: country.flag`.

Space for the icon is reserved when *any* option in the list carries one, not per row. A list with no icons anywhere renders exactly as today with no reserved gutter; a mixed list keeps every label on the same left edge. This is what lets both of the spec's alignment scenarios hold at once.

## Risks / Trade-offs

- **Arrow-key traversal stalls at the overscan boundary** → `overscan: 10` keeps a buffer of mounted rows below the viewport for `cmdk`'s `scrollIntoView` to land on and scroll into. Covered by an explicit keyboard-navigation test.
- **`defaultFilter` is not part of `cmdk`'s documented public API surface**, so a future `cmdk` upgrade could drop it → it is exported from the package root at v1.1.1 and typed in `dist/index.d.ts`. A unit test asserting a known match (e.g. "uk" ranking "United Kingdom" above non-matches) turns a silent regression into a failing test.
- **Long country names ellipsize instead of widening the panel** (see Panel width above) → accepted trade-off for stable row height and no scroll-time width jitter. Flagged for the user's visual check, since this project does not verify in a browser.
- **jsdom has no layout engine**, so the virtualizer measures zero and renders no rows → pass `initialRect`, the same workaround `regions-dialog.tsx` and its test already document.
- **Rendering-mode drift between the two paths.** Two code paths through one component can diverge over time → the spec pins the observable contract (same matches, same ranking) and the tests assert it, so drift fails CI rather than shipping.

## Migration Plan

Not applicable — no data, API, or persisted-state change. The new prop defaults to off, so the change is inert for every call site that does not opt in, and reverting is a matter of dropping the `virtualized` prop from `country-selector.tsx`.
