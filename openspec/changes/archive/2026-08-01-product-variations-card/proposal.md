## Why

The **Product Variations** card's attribute editor has three defects. The **Variation Values** field uses `TagManager`, a free-text chip input with no real option list, where a multi-select combobox is correct. The values field is interactive before a **Variation Name** is chosen, even though its options are derived from that selection. And the **Apply** button saves the entire product (`handleSave`), so an unrelated validation error elsewhere in the form silently fails Apply and leaves the editor open with no feedback — this also violates the existing `product-form` spec, which already requires sub-form Apply actions to push confirmed values into the parent field array rather than trigger a submit. The card also has uneven spacing versus the design: no gap between the attribute list and variation table, no divider, and a cramped 12px editor card.

## What Changes

- Replace `TagManager` in the Variation Values field with a new **`AttributeValuesField`**, a multi-select combobox built on an extended `Combobox` (adds color-swatch support)
- Disable Variation Values until a Variation Name is selected
- Change **Apply** to validate and commit the attribute into product form state only (`setValue` on `attributes`/`variants`/`has_variants`); it no longer calls the whole-product save
- Remove the `onSave` prop chain (`product-form.tsx` → `variants.tsx` → `attribute-list.tsx` → `add-or-edit-attribute.tsx`) now that Apply doesn't need it
- Tighten `ProductAttributeFormSchema` (name/id required, values non-empty) so Apply's validation is meaningful
- Fix card and field spacing: 16px gaps throughout the card, a full-bleed divider between the attribute list and the variation table, 16px editor-card padding
- Sync product form dirty state into the existing `libs/unsaved-store`, since applied-but-unsaved attribute changes can no longer be inferred from a successful network call

## Capabilities

### New Capabilities

- `product-variations-card`: Defines the Variation Values control type and gating, Apply's local-commit semantics, and the card's layout/spacing.

### Modified Capabilities

- `product-form`: Adds a requirement that section sub-form Apply actions never trigger a whole-product save, and that the form reports dirty state to the unsaved-changes store.

## Impact

- **UI**: `resources/app/components/ui/combobox.tsx`, `resources/app/components/form/attribute-values-field.tsx` (new), `resources/app/pages/products/product-form/sections/variants/variants.tsx`, `.../attribute-list/attribute-list.tsx`, `.../attribute-list/add-or-edit-attribute.tsx`
- **Removed**: `.../attribute-list/add-or-edit-variation.tsx` (absorbed into `AttributeValuesField`)
- **Schema**: `resources/app/schemas/forms/product-attribute-form.ts`
- **Form lifecycle**: `resources/app/pages/products/product-form/product-form.tsx` (unsaved-store wiring)
- **Out of scope**: `variation-dialog.tsx` (color picker dialog), `variation-table/*`, `createVariantCombinations`, the outer `ProductFormSchema` and payload mapping, API layer
