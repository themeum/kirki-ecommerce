## Why

The product sidebar redesign landed the shared token box, but two of its
fields still behave in ways the design does not want. Brand accepts a
second pick before replacing the first, and its panel stays open
afterwards, which reads as indecision for a field that holds exactly one
value. Tags cap chips by count, so three long tags still spill past two
rows while six short ones collapse early; the cap needs to follow the
rendered rows, not a number.

### Revision — brand keeps its token box

This change first moved brand off `MultiSelect` onto
`components/ui/combobox.tsx`, on the reasoning that a token box is the
wrong frame for a single value. Seeing it built, the user asked for the
opposite: brand should look like its neighbours — a chip inside the same
bordered box — and only its *selection* should be single. That is the shape
`product-sidebar-fields` already specifies, so its requirement is now
modified rather than replaced, and single-value behaviour moves into
`MultiSelect` as a mode any field can ask for. The Combobox route, and the
opt-in `clearable` prop added to serve it, are reverted.

## What Changes

- `MultiSelect` gains a single-selection mode. Choosing an option replaces
  whatever was held and closes the panel; the held chip fills the width of
  the box; the text cursor is withdrawn while a value is held and returns
  when the chip is removed.
- Brand stays on `MultiSelect` and adopts that mode. Every list row carries
  an image ahead of the name — the brand's logo, or the shared placeholder
  where it has none — so the names stay aligned down the list.
- `MultiSelect` gains a `maxVisibleRows` cap that measures where chips wrap
  and collapses everything from the capped row onward behind the existing
  `+N more` / `Show less` pair. The count-based `maxVisibleChips` stays for
  categories; the two are alternative spellings of one overflow rule.
- Tags adopt `maxVisibleRows={2}`.
- The token box rests at the same height as a plain text field while it
  holds nothing, instead of standing a row taller than every other control
  in the sidebar, and grows from there once chips arrive.
- `MultiSelect` accepts a per-option style for the option row itself, and
  the categories field uses it to move each row's checkbox inward with its
  name instead of indenting the name alone.

## Capabilities

### New Capabilities

<!-- None. All three affected capabilities already exist. -->

### Modified Capabilities

- `multi-select`: the chip overflow cap may be expressed in rendered rows as
  well as in a chip count, and the measurement must resolve before paint;
  and a field may put the component in a mode that holds a single value.
- `product-sidebar-fields`: brand keeps its token box, with the held chip
  filling the box and every list row carrying an image whether or not the
  brand has a logo.
- `product-category-field`: the tree indent moves the whole option row, so
  a child's checkbox steps inward from its parent's.

## Impact

- `resources/app/components/ui/multi-select.tsx` — new `maxVisibleRows`
  prop, row measurement, a resize subscription, a `single` mode, a shorter
  resting box, and an optional per-option row style.
- `resources/app/components/ui/combobox.tsx` — **unchanged**. The
  `clearable` prop added mid-change for the Combobox route is reverted with
  it; brand was its only consumer.
- `resources/app/features/products/components/product-form/sections/right-panel/brand.tsx`
  — built on `MultiSelect` in single mode.
- `resources/app/features/tags/components/fields/tags-field.tsx` — passes
  the new cap.
- `resources/app/features/categories/components/fields/categories-field.tsx`
  — indents through the new row style rather than inside `renderOption`.
- Co-located Vitest suites for both components.
- No PHP, DB, or API surface is touched.

## Dependencies

None outstanding. `product-sidebar-fields` and `product-category-field`
were delta-only inside `redesign-product-multi-select-fields` when this
change was proposed; that change has since been synced and archived, so
both capabilities are present in `openspec/specs/`.
