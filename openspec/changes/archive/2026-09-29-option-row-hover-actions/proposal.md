## Why

`GroupOptionCard` renders the row list for 8 settings sections, but its edit/delete/toggle
controls are `display: none` until `activeIndex === index`, and `activeIndex` is only ever set
by the kebab `DropdownButton`'s `onOptionToggle`. The 6 sections that do not pass
`handleMoreOption` — Shipping Profiles, Shipping Methods, Tax Profiles, Schema Profiles,
Variation Library, and Email settings (admin + customer) — therefore have **permanently
unreachable row actions**. A merchant cannot edit or delete a shipping profile at all.

A new Figma design for the Shipping Profiles section makes the intended behavior explicit:
rows stack inside one bordered container, and the delete/edit buttons appear on hover. Fixing
the reveal centrally repairs all 8 sections instead of one.

## What Changes

- `GroupOptionCard` renders rows with the `Item` / `ItemGroup` / `ItemSeparator` primitives
  instead of one bordered `Card` per row, and owns the single rounded, bordered list container.
- Row actions are revealed by CSS `:hover` / `:focus-within` on the row, not by React state.
  The `ActionGroup` is absolutely positioned so it never occupies flow space — revealing it
  causes **zero layout shift**. Right-hand text under the buttons is swapped with `visibility`,
  never `display`.
- An open kebab menu keeps its row's actions visible via a `data-actions-open` attribute
  (the menu content is portaled, so `:hover` and `:focus-within` cannot hold it).
- The row `Switch` reveals with the other actions; disabled rows keep their `Inactive` badge as
  the at-rest state indicator.
- **BREAKING (internal)**: the per-row `data-box-card` hook is removed. The four consumers that
  overrode it (`shipping-profile`, `schema-profile`, `tax-profile`, `variation-library`) drop
  their duplicated `boxWrapper` border-collapse blocks. `GroupOptionCard`'s public props are
  unchanged, so no call site's signature changes.
- New `components/ui/empty-state.tsx` primitive, extracted from a block copy-pasted in 10
  files. Only the Shipping Profiles section migrates to it in this change.
- The Shipping Profiles section is restructured: pure helpers move to a JSX-free
  `shipping-profile/utils.ts` with unit tests, the query-to-state mirror becomes a `useMemo`,
  and the optimistic delete moves onto react-query `setQueryData` with snapshot rollback,
  keeping the existing 5-second undo toast.

## Capabilities

### New Capabilities
- `option-row-list`: how a settings option-row list presents its rows, reveals row actions on
  hover without shifting layout, keeps actions visible while a row menu is open, and what it
  presents when the list is empty.

### Modified Capabilities
- `shipping-settings`: the Shipping Profiles section gains reachable edit/delete actions, a
  defined empty state, usage badges derived from shipping rules, and a delete that is
  optimistic-with-undo rather than immediate.

## Impact

- `resources/app/components/group-option-card.tsx` — internals rewritten; props unchanged.
- `resources/app/components/ui/empty-state.tsx` — new primitive.
- `resources/app/pages/settings/shipping-settings/shipping-profile/` — `shipping-profile.tsx`
  rewritten; new `utils.ts` + `utils.test.ts`.
- `boxWrapper` blocks removed from `schema-profile.tsx`, `tax-profile.tsx`,
  `variation-library.tsx`.
- Visually affected without code changes of their own: Shipping Boxes, Shipping Methods, Admin
  Email, Customer Email, Available Currencies.
- No API, schema, or PHP changes. `CreateProfilePopup`'s prop shape is untouched — the product
  form consumes it via a cast.
