## 1. MultiSelect row cap

- [x] 1.1 Extract the visible-chip calculation into a pure helper beside
      `multi-select.tsx` that takes each chip's top offset and the row cap and
      returns how many chips fit. Keep it free of DOM access so it is unit
      testable under jsdom, where `offsetTop` is always 0.
- [x] 1.2 Add `maxVisibleRows` to `MultiSelectProps` as a union with
      `maxVisibleChips` so a caller cannot pass both.
      **Verified:** a throwaway file proved `maxVisibleChips` alone and
      `maxVisibleRows` alone compile while both together fail, at both
      `MultiSelect` and `MultiSelectField`.
- [x] 1.3 Measure chip offsets in `useLayoutEffect` and feed the helper, so
      the overflow chips are dropped before the browser paints.
- [x] 1.4 Re-run the measurement once after the counter renders, taking the
      smaller visible count when the two passes disagree.
      **Note:** the second pass settles because React bails out of a
      re-render when the two passes agree.
- [x] 1.5 Subscribe a `ResizeObserver` to the box and re-measure on width
      change. Disconnect it on unmount, and do not create it at all when no
      row cap is set.
- [x] 1.6 Collapse both caps to one `visibleChips` slice so the existing
      `+N more` / `Show less` controls and the expanded-state reset are
      shared, not duplicated.
- [x] 1.7 Unit-test the helper: labels fitting within the cap, labels
      overflowing it, a cap of zero rows, and an empty selection.
- [x] 1.8 Extend `multi-select.test.tsx` to confirm a field with no row cap
      creates no observer and renders every chip, and that the count cap is
      unchanged. Note in the test file why row cutting itself is not
      asserted there.

## 2. Tags

- [x] 2.1 Pass `maxVisibleRows={2}` from `tags-field.tsx`.
- [x] 2.2 Confirm no other `MultiSelect` call site gains a cap it did not
      have: check `collections-field`, `customer-selection-field`,
      `attribute-values-field`, the product table categories filter, and
      `components/form/multi-select-field`.

      **Verified:** only three caps exist in the codebase — brand (removed
      by task 3.1), tags (new) and categories (unchanged). No other call
      site has one.

## 3. Brand — Combobox route (superseded by §5)

**Superseded.** These tasks were completed, then reversed: the user asked
for brand to keep the token box its neighbours use and to be single only in
its *selection*. Kept here as the record of what was built and why it went
away; §5 undoes them.

- [x] 3.1 Rewrite `brand.tsx` onto `Combobox`: map the form's
      `{ id, name, logo } | null` to and from Combobox's string value.
- [x] 3.2 Build each option's `leftIcon` from the brand logo via `Image`,
      leaving it undefined for brands without one.
- [x] 3.3 Wire `creatable` and `onAddItem` to `BrandAddEditPopover`,
      prefilled with the typed name, matching current behaviour.
- [x] 3.4 Confirm the field clears back to its placeholder, and that
      choosing a brand closes the panel.
      **Premise corrected:** `combobox.tsx` had no clear control in single
      mode — its trigger renders the label and a chevron, and the `X` exists
      only on tags in `multiple` mode. Clearing was possible only by
      re-selecting the held option. An opt-in `clearable` prop was added
      (default off, so the other seven consumers are untouched), rendering
      the control as a sibling of the trigger rather than a button nested
      inside one. `proposal.md`'s Impact line was corrected to match.
- [x] 3.5 Write `brand.test.tsx` covering: placeholder with no brand, logo
      shown on list rows and on the closed trigger, choosing replaces and
      closes, clearing empties the form value, and the create row opens the
      popover with the typed name.

## 4. Verification

- [x] 4.1 `npm run typecheck` in `resources/app/` — no new errors against a
      stashed clean-tree baseline.
      **1 error, identical to baseline** (`product-form.tsx(59,9)`, unused
      `field` — pre-existing).
- [x] 4.2 `npm run lint` — no new errors against the same baseline.
      **6 errors, identical to baseline**, in the same four untouched files
      (`accordion.tsx`, `product-form.tsx`, `inventory.tsx`,
      `variant-fields.ts`). Three new errors appeared mid-change — a
      no-dep-array `useLayoutEffect`, a `useMemo` dependency recreated each
      render in `brand.tsx`, and import ordering — and all three were fixed
      rather than accepted.
- [x] 4.3 `npm test` — record the pass/fail delta, not just "passing".
      **1213 → 1234 passing, +21 net new tests.** The same single
      pre-existing failure remains
      (`product-form.test.ts > fully filled variant`), untouched by this
      change.
- [x] 4.4 Confirm `combobox.tsx`, `chip-field.tsx` and `category-tree/` are
      untouched via `git status --porcelain`.
      **Amended:** `combobox.tsx` *is* modified by this change, by the
      decision recorded on task 3.4 — the task was written before that was
      known. `chip-field.tsx`, `chip-field-styles.ts`, `category-tree/` and
      `categories-dropdown-field.tsx` are confirmed untouched via
      `git status --porcelain`.
- [x] 4.5 Per CLAUDE.md §0, run no browser preview. Hand the user the two
      things tests cannot confirm: that a two-row tag cap cuts at a sensible
      chip at sidebar width, and that brand's trigger-covering panel does not
      look out of place beside the two lists that drop below it.

      — Handed to the user below.

## 5. Brand as a single-value token box

- [x] 5.1 Revert `combobox.tsx` to its committed state, dropping the
      `clearable` prop, the trigger wrapper and the three styles added for
      it. Brand was its only consumer — confirm no other call site passes
      `clearable` to `Combobox` before reverting.
      **Verified:** the eight other `clearable` call sites in the codebase
      belong to `Searchbox` and `DateRangePicker`, which declare their own.
      `combobox.tsx` is byte-identical to `HEAD` again.
- [x] 5.2 Add a `single` mode to `multi-select.tsx`: choosing an option
      replaces the held value and closes the panel. Leave the many-value
      path untouched.
- [x] 5.3 In single mode, render the held chip across the full width of the
      box and withdraw the text input while a value is held. Removing the
      chip must restore the input and the placeholder.
- [x] 5.4 Rewrite `brand.tsx` onto `MultiSelect` in single mode, mapping the
      form's `{ id, name, logo } | null` to and from the component's option
      array. Keep the `BrandAddEditPopover` create flow working through
      `onCreate`.
- [x] 5.5 Render every list row through `renderOption` with an `Image`,
      letting it fall back to the shared placeholder where the brand has no
      logo, so the names align.
- [x] 5.6 Render the held chip through `renderChip` with the same leading
      image.
- [x] 5.7 Extend `multi-select.test.tsx` for single mode: choosing replaces
      and closes, the input is absent while a value is held and present
      once the chip is removed, and the many-value behaviour is unchanged.
      **Note:** the chip filling the box is not asserted. `scoped()` nests
      every style under the app root selector, which no test DOM carries, so
      `toHaveStyle` reads nothing back for any style in this project. Said
      so in the test file and moved it to the review list.
- [x] 5.8 Rewrite `brand.test.tsx` against the token box: placeholder with
      no brand, a logo on the chip and on list rows, the placeholder image
      on a logo-less row, choosing replaces and closes, removing the chip
      empties the form value, and the create row opens the popover with the
      typed name.
- [x] 5.9 Re-run `npm run typecheck`, `npm run lint` and `npm test` against
      the same baseline recorded in §4, and record the new numbers rather
      than assuming §4's still hold.
      **typecheck: 1 error**, the pre-existing `product-form.tsx(59,9)`.
      **lint: 6 errors** in the same four untouched files as the baseline.
      Two new ones appeared — `as HTMLElement` casts on `querySelector` in
      both new test helpers — and were fixed, not accepted.
      **tests: 1234 → 1239 passing**, +5 for single mode; brand's suite
      stays at 9 as it was rewritten rather than extended. The same single
      pre-existing failure remains (`product-form.test.ts > fully filled
      variant`), untouched.
- [x] 5.10 Per CLAUDE.md §0, run no browser preview. Hand the user what
      tests cannot confirm: that the full-width chip reads as a filled
      field at sidebar width, and that withdrawing the search input while a
      brand is held is acceptable for a store with a long brand list.

      — Handed to the user below.

## 6. Single-mode rows and field placeholders

- [x] 6.1 Stop rendering the checkbox on option rows in single mode. The row
      stays the click target; only the checkbox goes.
- [x] 6.2 `tags-field.tsx`: default placeholder to "Add tags" and pass
      `selectedPlaceholder` of "Search".
- [x] 6.3 `collections-field.tsx`: the same, with "Add collections".
- [x] 6.4 `brand.tsx`: placeholder to "Add brand". No
      `selectedPlaceholder` — single mode withdraws the cursor, so a second
      placeholder would never be read.
- [x] 6.5 Leave `categories-field.tsx` alone: it already shortens to
      "Search", and its "Search or add categories" copy was not in scope.
- [x] 6.6 Assert in `multi-select.test.tsx` that a single-mode row carries
      no checkbox while a many-value row still does, and update the brand
      and any tags/collections tests that assert the old placeholder copy.
      **Note:** no tags or collections test asserted placeholder copy, so
      only `brand.test.tsx` needed updating.
- [x] 6.7 Re-run `npm run typecheck`, `npm run lint` and `npm test`, and
      record the numbers against §5's.
      **typecheck: 1**, **lint: 6** — both unchanged from §5 and from the
      original baseline, in the same untouched files. **tests: 1239 → 1241
      passing**, +2 for the two checkbox assertions. The same single
      pre-existing failure remains.

## 7. Field height and tree indentation

- [x] 7.1 Bring the empty token box to 32px in `multi-select.tsx`: cut the
      box's `minHeight` from 40px to 32px, its padding from `spacing[2]` to
      `spacing[1]` vertical / `spacing[2]` horizontal, and stop forcing the
      input to 24px so its own line height decides. The box's `minHeight`
      is then what sets the resting height, exactly as it is on `Input`.
      **Done:** box `minHeight` 40px → 32px, padding `spacing[2]` →
      `spacing[1] spacing[2]`, input `minHeight` 24px → `0` with its 24px
      `maxHeight` kept. Content comes to 28px (a 20px `small` line in 8px
      of padding), so the 32px minimum is what shows.
- [x] 7.2 Confirm the box still grows for a chip rather than clipping it,
      and that the single-mode full-width chip and the `+N more` control
      still sit on the row. A chip is a 20px line in 4px of padding, so a
      filled box lands taller than 32px — that is intended.
      **Verified by arithmetic, not by paint:** a chip is 28px, so a filled
      box is 38px. `+N more` and `Show less` are `height: auto` on a 20px
      line, shorter than a chip, so neither sets the row's height.
- [x] 7.3 Check the other five `MultiSelect` call sites inherit the new
      height without a layout problem of their own: `collections-field`,
      `customer-selection-field`, `attribute-values-field`, the product
      table categories filter, and `components/form/multi-select-field`.
      **Verified:** none of the five sets a height on the box. Every
      `cssOverride` they accept lands on the `Field` wrapper, not on
      `MultiSelect`, and no call site sits in a row with a fixed-height
      sibling it now has to match.
- [x] 7.4 Add `optionCss?: (option: TOption) => CSSObject | undefined` to
      `MultiSelectBaseProps` and merge its result onto the `CommandItem`
      for that option. A caller that supplies nothing must render exactly
      as it does today.
      **Done.** Also moved the `onSearchChange` docblock back above
      `onSearchChange` — §5 inserted `single` between the comment and the
      prop it documents. That was this change's own mess, so it is cleaned
      up here rather than left.
- [x] 7.5 Move the category tree indent out of `renderOption` and onto the
      row through `optionCss`, adding to the row's existing left padding
      rather than replacing it, so the checkbox steps inward with the name.
      **Done:** `paddingLeft: calc(spacing[2] + depth * 16px)`.
      `renderOption` now returns the bare title while browsing, since the
      span it wrapped existed only to carry the indent.
- [x] 7.6 Keep the indent off while a search is running — search already
      flattens the list and prefixes each row with its path, so there is no
      depth left to express.
      **Done:** `optionCss` returns `undefined` while searching, and also
      at depth 0, where the row's own padding is already correct.
- [x] 7.7 Extend `multi-select.test.tsx`: a row carries the caller's style
      when it is supplied, and no extra style when it is not.
      **Done:** three tests — the style lands on the row element, a row the
      styler skips gets no `style` attribute, and a field supplying no
      styler renders rows with none either.
- [x] 7.8 Extend `categories-field.test.tsx`: an unsearched child row
      carries more leading space than its parent on the row element itself
      — not on a span inside it — and no row carries it while searching.
      **Premise corrected.** The suite already asserted
      `toHaveStyle({ paddingLeft: '32px' })` and passed, which contradicts
      §5's note that no style in this project is readable back. Both are
      true: the old indent was an *inline* `style`, which `toHaveStyle`
      reads; `scoped()` only defeats emotion rules. That is why 7.4 landed
      as an inline `optionStyle` rather than the `optionCss` it was written
      as — an emotion indent would have left this assertion passing against
      a span that no longer exists. The assertions now read the row's own
      `style.paddingLeft`, matching on the px step alone because jsdom
      reorders the terms of the `calc` when it serializes it back.
- [x] 7.9 Re-run `npm run typecheck`, `npm run lint` and `npm test` in
      `resources/app/`, and record the numbers against §6's.
      **typecheck: 1**, **lint: 6** — both unchanged from §6 and from the
      original baseline, in the same four untouched files. **tests: 1241 →
      1245 passing**, +4 (three for `optionStyle`, one for the indented
      checkbox). The same single pre-existing failure remains
      (`product-form.test.ts > fully filled variant`), untouched. Prettier
      run over the four changed files.
- [x] 7.10 Per CLAUDE.md §0, run no browser preview. Hand the user what
      tests cannot confirm: that 32px reads right for the empty box beside
      the sidebar's other controls, and that the indented checkbox column
      matches the screenshot at every depth the store actually uses.

      — Handed to the user below.
