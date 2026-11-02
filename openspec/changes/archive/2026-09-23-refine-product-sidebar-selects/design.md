## Context

The sidebar's select fields need refining. Brand holds one value but
behaves like a many-value field; tags need an overflow cap that follows
rendered rows rather than a chip count; the shared box stands a row taller
than every other control beside it; and the category tree indents its names
but not its checkboxes. Everything here is frontend-only.

## Goals / Non-Goals

**Goals**
- Brand keeps the shared token box and holds a single value, with an image
  on every list row.
- `MultiSelect` can cap chips by row, measured before paint.
- An empty token box is the same height as every other control in the
  sidebar.
- A tree indent moves the checkbox, not just the label.

**Non-Goals**
- No change to how a brand is stored or sent to the API.
- No change to categories beyond where its rows indent from — its count cap
  of one, its search behaviour and its create flow all stand.
- No change to `combobox.tsx`, which ends this change identical to its
  committed state.

## Decisions

### Brand stays on `MultiSelect`, which gains a single mode

Combobox was built first and reverted. Its case was that a token box is a
multi-value frame and a brand is one value. The case that won is that
"holds one value" is a property of the selection, not of the frame: the
three sidebar fields should read as one family, and only brand's arithmetic
should differ. So single-value behaviour moves into `MultiSelect` itself,
where any field can ask for it:

- Choosing replaces the held value instead of appending, and closes the
  panel — there is nothing further to collect.
- While a value is held the chip takes the whole row and the text input is
  not rendered. A single value has nothing to wrap against, and a text
  cursor sitting beside a full-width chip invites a second pick the field
  cannot accept.
- Search, the create row and removal through the chip's own control are the
  existing paths, unchanged.

The form holds `{ id, name, logo } | null` while `MultiSelect` works in
option arrays, so `brand.tsx` maps a held brand to a one-element array on
the way out and reads `next[0] ?? null` on the way back.

Every list row renders an `Image`, not only the rows that have a logo:
`Image` already falls back to the shared placeholder, so passing the logo
unconditionally keeps every name starting at the same x-position. A row
that rendered no image where its neighbours did would ragged the list.

**Accepted consequence:** a held brand cannot be replaced by typing — the
chip is removed first, which restores the cursor. The alternative was a
two-row box, chip above and cursor below, which is heavier than this field
deserves in a sidebar. Flagged for review, since no test can judge it.

**Reverted with the Combobox route:** the opt-in `clearable` prop added to
`combobox.tsx` mid-change. Brand was its only consumer, so it leaves with
the route it was added for.

### Row capping is a measured two-pass, not a guess

A row cap cannot be computed from the chip count, and a chip's width is not
known until it is laid out. So `MultiSelect` renders every chip, reads each
one's `offsetTop` in `useLayoutEffect`, and hides the ones whose top exceeds
the capped row's top. `useLayoutEffect` runs after layout but before the
browser paints, so the discarded chips are never visible — which is what
CLAUDE.md's no-layout-shift rule requires. A `useEffect` here would flash.

Two complications, both handled rather than ignored:

- **The counter displaces chips.** Rendering `+N more` consumes width on the
  last visible row and can push the chip before it onto the next row, which
  changes N. The measurement therefore runs again after the counter is in
  place, and is capped at two passes: if the second pass disagrees with the
  first, the smaller visible count wins. Converging further is not worth the
  frames.
- **Width changes.** A `ResizeObserver` on the box re-runs the measurement,
  so collapsing the browser or the sidebar re-cuts the row rather than
  leaving a stale count.

### The two caps are mutually exclusive in the type

`maxVisibleChips` and `maxVisibleRows` express one rule two ways, and
honouring both at once has no sensible meaning. The props type makes them a
union so a caller cannot pass both, rather than leaving a runtime precedence
rule to document. Internally both collapse to a single `visibleChips` slice,
so the expand/collapse controls and the "expanded state resets when the
selection falls back within the cap" rule stay shared.

### The resting height comes from the input, not from the box

The box stood at 42px — 24px of forced input height, 8px of padding above
and below, 1px of border each side — against 32px for `Input`. The gap is
the forced height: 24px was never a line of text, it was a number chosen to
leave room for a chip. Two ways to close it, and only one of them stays
closed:

- Pin the box to 32px and shrink the padding to match. The next typography
  change reopens the gap silently.
- Let the input be as tall as its own line (20px at `small`), cut the
  padding to 4px, and let the box's `minHeight: 32px` do the rest. Content
  comes to 28px, the minimum wins, and the box is 32px because `Input` is
  32px — both are `minHeight`, both sit above their content.

The second is taken. A chip is 28px (a 20px line in 4px of padding), so a
filled box lands at 38px rather than 32px, which is intended: the field
grows to hold what it holds. The user asked only for the empty state.

### The row indent is a style, not a layout prop

Category rows indent by depth, but `renderOption` composes content *after*
the checkbox, so an indent written there moves the name and leaves the
checkbox in a fixed column — the list reads flat with a ragged margin.
Three ways to reach the row itself:

- Teach `MultiSelect` about depth. It would then know what a tree is, which
  is exactly what `renderOption` exists to avoid.
- Have the categories field pull the checkbox back with a negative margin.
  It fights a style it does not own, and breaks the moment the checkbox
  moves.
- Accept an optional per-option style for the row and let the caller decide
  what it means.

The third is taken: `optionStyle?: (option) => CSSProperties | undefined`,
set as the row's inline `style`. It says nothing about trees, and a caller
that supplies nothing gets what it gets today. Categories uses it for
`paddingLeft`, added to the row's existing padding through `calc` rather
than replacing it, and drops it while a search is running — search already
flattens the list, so there is no depth left to show.

Inline rather than an emotion `css` object, for two reasons that point the
same way. CLAUDE.md reserves the `style` prop for runtime-computed values,
and a depth-scaled indent is exactly that — which is why the field already
used `style` before this change. And `scoped()` nests every emotion rule
under the app root selector that no test DOM carries, so an emotion indent
would be unreadable by `toHaveStyle`; the existing test asserting `32px`
would have gone on passing against a span that no longer existed.

## Risks / Trade-offs

- **Measurement returns to a component that had shed it.** The prior change
  deliberately replaced measurement with a count cap. This reintroduces it,
  but only behind `maxVisibleRows` — a field that sets no row cap runs no
  measurement and no observer, so categories and every other call site keep
  the cheap path.
- **Neither of these is testable by assertion.** Every style in this
  project is nested under the app root selector by `scoped()`, which no
  test DOM carries, so `toHaveStyle` reads nothing back. The box height and
  the indent are therefore verified by reading the rule, not by rendering
  it — the same limit already recorded against the single-mode chip. What
  tests *can* hold is that the indent reaches the row element rather than a
  span inside it, and that it is absent while searching.
- **jsdom reports no layout.** `offsetTop` is 0 for every element under
  Vitest, so row capping cannot be verified by rendering alone. The
  measurement is therefore extracted into a pure function taking chip
  rectangles and returning a visible count, which is unit-tested directly;
  the component test covers only that an uncapped and a count-capped field
  are unaffected. This is a real coverage limit and is called out in tasks.

## Migration Plan

None — no stored data or API payload changes shape. `brand.tsx` is replaced
in one step; there is no interim state where both frames exist.

## Open Questions

None.
