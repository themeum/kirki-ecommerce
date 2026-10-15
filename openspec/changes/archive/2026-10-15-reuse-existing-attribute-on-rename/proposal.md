## Why

A merchant who types the name of an attribute that already exists, such as "Size", gets a blocking duplicate-name error. They cannot reuse the attribute and must cancel and pick it from `+ Add`. Separately, picking a color in a chip's color picker closes the picker and opens the values dropdown, so the color cannot be adjusted in one go.

## What Changes

- On blur, a name that matches an existing store attribute (trimmed, case-insensitive) and has no selected values switches the card to that attribute. Its values, type and stored name load. This works for `+ Add new`, presets, `+ Add` picks and edits of an applied attribute.
- A name that matches an existing attribute while values are selected still shows "An attribute with this name already exists."
- A name that matches an attribute already applied to this product shows "This attribute is already added to this product." and loads nothing.
- Renaming with selected values to a unique name keeps creating a new attribute with copies of the values. The original attribute keeps its values. This is existing behaviour and now has a test that proves it.
- Picking a color in a chip's color picker keeps the picker open and never opens the values dropdown. An outside click only closes the picker.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `product-variations-card`: the "Attribute name input" requirement changes from "clash blocks Apply" to "clash reuses the attribute when no values are selected". The "Recoloring a selected value" requirement gains the picker/dropdown isolation rule. A new requirement covers reusing an existing attribute by name.

## Impact

- `resources/app/features/products/components/fields/attribute-name-input.tsx`
- `resources/app/features/products/components/fields/attribute-values-field.tsx`
- `resources/app/features/products/components/attribute-value-types.tsx`
- `resources/app/features/products/components/product-form/sections/variants/attribute-list/add-or-edit-attribute.tsx`
- `resources/app/features/products/components/product-form/sections/variants/attribute-list/use-apply-attribute.ts`
- `resources/app/features/products/schemas/forms/product-attribute-form.ts`
- `resources/app/components/ui/multi-select.tsx` (non-breaking change for other consumers)
- No API or database change.
