## Why

The codebase carried two implementations of the same widget. `Suggestions` (`components/ui/suggestions.tsx`, reached through the pass-through wrapper `components/tag-manager/tag-manager.tsx`) was a popover-search multi-select with chips below the input, used by Tags, Collections, Shipping Zone, Customer Details and the product table category filter. `Combobox` (`components/ui/combobox.tsx`) was the cmdk-based single-select.

`AttributeValuesField` was built on `Combobox` and, to reach the Variation Values design, modified that shared primitive: a `chipsPosition` prop, a `color` field on `ComboboxOption`, and a second render branch — reshaping a primitive every other consumer depends on, into a design that already existed next to it. Every future decoration (an image beside the swatch, a subtitle) would reopen it again.

`Suggestions` had the same flaw one level down: its option type accumulated `color`, `icon`, `tagIcon` and `subText`, and it had no keyboard navigation at all — bare `role="option"` divs with click and Enter handlers.

## What Changes

- Add `MultiSelect` (`components/ui/multi-select.tsx`): `Suggestions`' layout, cmdk's behaviour. Generic over the option type, controlled with **option objects** rather than ids, and extended through `renderOption` / `renderChip` render slots instead of option-data flags
- Add `ChipField` (`components/ui/chip-field.tsx`): the bordered control-plus-chips frame, so read-only pickers that open their own dialog do not have to be a multi-select
- Add `ColorSwatch` (`components/ui/color-swatch.tsx`), replacing the swatch markup duplicated across `chip`, `suggestions` and `combobox`
- Add domain field components that own their own query, create mutation and RHF value mapping: `TagsField`, `CollectionsField`, plus a rewritten `AttributeValuesField` and a rewritten generic `MultiSelectField`
- Move per-attribute-type presentation and creation behaviour into an `attribute-value-types` registry, so a new attribute type is an entry rather than an edit to the field
- Revert `combobox.tsx` to its pre-change state; it goes back to being the single-select primitive
- Delete `Suggestions`, `TagManager`, `SelectedTags` (dead) and `TagManagerField`; migrate every call site

## Capabilities

### New Capabilities

- `multi-select`: The `MultiSelect` primitive and the form fields built on it

### Modified Capabilities

- `product-variations-card`: Variation Values is now backed by `MultiSelect` and the attribute value type registry rather than a modified `Combobox`

## Impact

- New: [`components/ui/multi-select.tsx`](resources/app/components/ui/multi-select.tsx), [`components/ui/chip-field.tsx`](resources/app/components/ui/chip-field.tsx), [`components/ui/color-swatch.tsx`](resources/app/components/ui/color-swatch.tsx), [`components/form/tags-field.tsx`](resources/app/components/form/tags-field.tsx), [`components/form/collections-field.tsx`](resources/app/components/form/collections-field.tsx), [`components/form/attribute-value-types.tsx`](resources/app/components/form/attribute-value-types.tsx)
- Rewritten: [`components/form/attribute-values-field.tsx`](resources/app/components/form/attribute-values-field.tsx), [`components/form/multi-select-field.tsx`](resources/app/components/form/multi-select-field.tsx)
- Deleted: `components/ui/suggestions.tsx`, `components/tag-manager/`, `components/form/tag-manager-field.tsx`, `preview-pages/tag-manager-preview.tsx`
- Migrated: product form Tags and Collections, `customer-details`, `shipping-zone`, `categories-filter`, `selling-location`, `types/filters/coupon.ts`
- No backend or API changes
