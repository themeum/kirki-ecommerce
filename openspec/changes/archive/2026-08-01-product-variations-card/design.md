## Context

`TagManager` (a `Suggestions`-based free-text chip input) is used for Variation Values today. It lacks explicit selected/unselected option state and doesn't match the multi-select-combobox pattern already established elsewhere in the form directory (`MultiSelectField` over `Combobox`). However, `Combobox`'s existing option shape (`{ label, value }`, `string[]` values) can't represent color swatches or the `{ value: id, title, color }[]` object shape the attribute form already uses.

## Decisions

### 1. Extend `Combobox` rather than build a new primitive

Add an optional `color?: string` to `ComboboxOption`. When present, both the trigger chip and the dropdown row render a swatch (mirroring `Chip`'s `--chip-swatch-color` pattern). This is additive: the three existing `Combobox` consumers (`MultiSelectField`, `ComboboxField`, and the Variation Name field in `add-or-edit-attribute.tsx`) are unaffected since none pass `color`.

Alternative considered: a standalone `components/ui/multi-select.tsx`. Rejected — it would duplicate the popover/cmdk/keyboard-handling logic `Combobox` already has, for a feature (swatches) that other multi-selects may want later (e.g. a future tag-color picker).

### 2. New domain-aware field: `AttributeValuesField`

`components/form/` currently holds only generic RHF wrappers with no entity knowledge. Variation Values needs to know about `AttributeValue`, resolve options from a specific `Attribute`, and — for `color`-type attributes — open `VariationPopover` to collect a hex value before creating a new value server-side. This is domain logic, but it is *form-field* domain logic (one `Controller`, one visible control), so it's colocated as `components/form/attribute-values-field.tsx` alongside the other field wrappers rather than nested under `pages/products/...`.

The field owns:
- Fetching the attribute's value list (`useAttributesQuery`)
- The create-new-value mutation (`useCreateAttributeValueMutation`)
- Rendering `VariationPopover` for color-type creation

This fully absorbs `add-or-edit-variation.tsx`, which is deleted.

### 3. Value shape stays `{ value: id, title, color }[]` at the form boundary

`Combobox` operates on `string[]` of ids internally. `AttributeValuesField` maps `ComboboxOption[]` (derived from the matched attribute's values) to/from the existing `ProductAttributeValueFormValues[]` shape at its `Controller` boundary, so `handleSaveAttribute`/`handleApply` in `add-or-edit-attribute.tsx` and the outer `buildProductPayload` mapping require no changes.

### 4. Apply becomes a local commit, not a submit

Today `onSave` threads from `product-form.tsx`'s `handleSave({ focusOnError: false })` down through three components so Apply can await a full product save. Per the existing `product-form` spec (`useFieldArray for dynamic collections`), sub-forms must push confirmed values into the parent field array on their own — not trigger a submit. Apply is changed to: `form.trigger()` (validates the tightened `ProductAttributeFormSchema`) → `setValue('attributes' | 'variants' | 'has_variants', ...)` → close the editor. The `onSave` prop and its threading are deleted.

### 5. Unsaved-changes visibility

Because Apply no longer triggers a network call, there's no longer an implicit "this data is now persisted" signal. The product form already has nowhere it reports dirty state to `libs/unsaved-store` (that store today is wired only into settings pages). `product-form.tsx` starts syncing `form.formState.isDirty` into the store, reusing the `UnsavedChangesController` already mounted globally in `routes.tsx` — no new UI.
