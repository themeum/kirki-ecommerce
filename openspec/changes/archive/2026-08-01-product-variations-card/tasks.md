## 1. Combobox color support

- [x] 1.1 Add `color?: string` to `ComboboxOption` in `resources/app/components/ui/combobox.tsx`
- [x] 1.2 Render a swatch in the trigger chip (`triggerLabel()`) when `option.color` is set
- [x] 1.3 Render the same swatch before the label in each `CommandItem` row
- [x] 1.4 Add `styles.swatch` (16px, `radius.full`, `backgroundColor` from the option color)

## 2. AttributeValuesField

- [x] 2.1 Create `resources/app/components/form/attribute-values-field.tsx`: `Controller` + `Field`/`FieldLabel`/`FieldError` + `Combobox` (`multiple`, `creatable`)
- [x] 2.2 Fetch attribute values via `useAttributesQuery`, resolve options for the matched `attributeId`
- [x] 2.3 Map selected `ProductAttributeValueFormValues[]` ↔ `string[]` of ids at the Controller boundary
- [x] 2.4 Wire `onAddItem`: color type opens `VariationPopover`; list type calls `useCreateAttributeValueMutation` directly
- [x] 2.5 Map server errors via `getErrorsObject` → `setError('values', ...)`
- [x] 2.6 Delete `resources/app/pages/products/product-form/sections/variants/attribute-list/add-or-edit-variation.tsx`
- [x] 2.7 Replace `<AddOrEditVariation />` with `<AttributeValuesField ... disabled={!formData?.id} />` in `add-or-edit-attribute.tsx`

## 3. Schema and Apply semantics

- [x] 3.1 Tighten `ProductAttributeFormSchema` in `resources/app/schemas/forms/product-attribute-form.ts` (`id`/`name` required, `values.min(1)`)
- [x] 3.2 Rename `handleSaveAttribute` → `handleApply`: `form.trigger()` → `setValue` (`attributes`/`variants`/`has_variants`) → close, no `onSave` call
- [x] 3.3 Remove `onSave` prop from `AddOrEditAttribute`, `SortableCard`, `AttributeList`, `Variants`
- [x] 3.4 Remove the `handleSave({ focusOnError: false })` call site passed to `<Variants />` in `product-form.tsx`

## 4. Layout and spacing

- [x] 4.1 Wrap `AttributeList` + `VariationTable` in `<Flex direction="column" gap={4}>` inside `variants.tsx`'s `CardContent`
- [x] 4.2 Fix the full-bleed divider already rendered inside `VariationTable` (was an inline `margin: auto -16px` hack) to use an explicit `cssOverride`, since it renders its own conditional `Separator` — no second divider needed in `variants.tsx`
- [x] 4.3 Wrap the sortable attribute list and "+ Add" button in `<Flex direction="column" gap={4}>` in `attribute-list.tsx`
- [x] 4.4 Switch the editor card in `add-or-edit-attribute.tsx` from `cardStyles.innerContent` (12px) to `cardStyles.innerCardContent` (16px)
- [x] 4.5 Fix label casing to "Show in Product Page as"

## 5. Unsaved-changes guard

- [x] 5.1 Sync `form.formState.isDirty` to `setUnsavedDataStatus` in `product-form.tsx`, clearing on unmount

## 6. Verify

- [x] 6.1 `npx tsc --noEmit` passes in `resources/app` (no `lint` script exists in this repo)
- [ ] 6.2 Manual: Values field disabled until a Variation Name is chosen
- [ ] 6.3 Manual: multi-select with swatches for color attributes; creatable path for both list and color types
- [ ] 6.4 Manual: Apply fires no product network request; header Save is the only persist path
- [ ] 6.5 Manual: unsaved-changes prompt appears after Apply + navigate-away, not after Save
- [ ] 6.6 Manual: card spacing/divider matches the design screenshots
- [x] 6.7 Regression-check `MultiSelectField`/`ComboboxField` consumers after the `Combobox` change (structurally compatible; confirmed by clean typecheck)
