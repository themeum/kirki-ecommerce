## 1. Primitives

- [x] 1.1 Add `components/ui/color-swatch.tsx`, replacing the swatch markup duplicated in `chip`, `suggestions` and `combobox`
- [x] 1.2 Add `components/ui/chip-field.tsx`: bordered frame with a `control` slot, a chips row, and error/disabled states, plus `chipFieldControlCss` for the control input
- [x] 1.3 Add `components/ui/multi-select.tsx` composing `ChipField`, generic over `TOption extends { value, title }`
- [x] 1.4 Drive the option list with `Command` / `CommandList` / `CommandItem`, using cmdk's `Command.Input` in the control slot
- [x] 1.5 Control with option objects (`value` / `onChange` / `getOptionId`), not ids
- [x] 1.6 Expose `renderOption` / `renderChip`, defaulting to `option.title`
- [x] 1.7 Await a promise-returning `onCreate`: pending create row, clear and close only on resolve
- [x] 1.8 Toggle semantics — selected options stay in the list with a checked state
- [x] 1.9 Stop keydown propagation on the chips row so Enter activates a chip's remove button

## 2. Form fields

- [x] 2.1 Add `components/form/tags-field.tsx` (`useTagsQuery` / `useCreateTagMutation`, `{ id, name }[]`, error key `name`)
- [x] 2.2 Add `components/form/collections-field.tsx` (`useCollectionsQuery` / `useCreateCollectionMutation`, `{ id, title }[]`, error key `title`)
- [x] 2.3 Add `components/form/attribute-value-types.tsx` mapping a type slug to `{ renderOption, renderChip, createVia }` with a `list` fallback
- [x] 2.4 Rewrite `components/form/attribute-values-field.tsx` on `MultiSelect` plus the registry; drop the `optionsById` merge block
- [x] 2.5 Rewrite `components/form/multi-select-field.tsx` as the generic RHF wrapper with `valueAs` and `creatable`
- [x] 2.6 Rethrow from each field's `onCreate` after mapping the error, so the popover stays open

## 3. Migration and deletion

- [x] 3.1 Revert `components/ui/combobox.tsx` to its pre-change state
- [x] 3.2 Collapse `right-panel/tags.tsx` and `right-panel/collections.tsx` onto the new fields
- [x] 3.3 Migrate `customer-details.tsx` to `MultiSelectField` with `valueAs="strings"` and `creatable`
- [x] 3.4 Migrate `shipping-zone.tsx` to `ChipField` plus `Chip` (not a multi-select); drop the `as unknown as SelectOption` casts
- [x] 3.5 Migrate `categories-filter.tsx` to `MultiSelect`
- [x] 3.6 Migrate `selling-location.tsx` to the new `MultiSelectField` with `valueAs="strings"`
- [x] 3.7 Repoint `types/filters/coupon.ts` at `SuggestionOption` in `types/pages/common.ts`
- [x] 3.8 Delete `ui/suggestions.tsx`, `components/tag-manager/`, `form/tag-manager-field.tsx`, `preview-pages/tag-manager-preview.tsx`
- [x] 3.9 Replace the tag-manager preview with `preview-pages/multi-select-preview.tsx` and repoint `tryouts.tsx`

## 4. Verification

- [x] 4.1 `npm run typecheck` clean
- [x] 4.2 `npm run build` clean
- [ ] 4.3 Preview gallery: plain, swatch, creatable-resolves, creatable-rejects (popover stays open, text preserved), disabled
- [ ] 4.4 Product form Tags and Collections: select, deselect from chip, deselect from the list, create new, create a duplicate name
- [ ] 4.5 Variants → Add attribute, type List: values select and create inline
- [ ] 4.6 Variants → Add attribute, type Color: create opens the dialog, the saved value appears as a chip with its swatch before the attributes query refetches
- [ ] 4.7 Keyboard: arrow keys move through options, Enter selects, Escape closes, Enter on a chip's remove button removes it
- [ ] 4.8 Regression pass: Customer details tags, Shipping zone regions, Product table category filter, Settings → selling location
