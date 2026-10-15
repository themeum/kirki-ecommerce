## 1. Name match logic

- [x] 1.1 Add the pure name-match classifier (`none`, `reuse`, `selected-clash`, `applied-clash`) and the "already added to this product" message to `resources/app/features/products/schemas/forms/product-attribute-form.ts` → verify: schema unit tests cover each kind, case and whitespace variants, and the card's own applied id
- [x] 1.2 Add schema tests in `resources/app/features/products/tests/schemas/forms/product-attribute-form.test.ts`, including: unique new name with selected values returns a `create` plan carrying the values and colors → verify: `npm test` passes

## 2. Card switches to the matching attribute

- [x] 2.1 In `add-or-edit-attribute.tsx`, keep `activeSource` in state. Feed `existingValues` and `type` of `AttributeValuesField` from it. Pass `appliedIds` and `onReuse` to `AttributeNameInput` → verify: typecheck passes
- [x] 2.2 In `attribute-name-input.tsx`, use the classifier on blur. `reuse` calls `onReuse` and clears the error. The clash kinds show their own message → verify: component test for each kind
- [x] 2.3 `onReuse` writes `source_attribute_id`, `source_name`, `name`, `type` and `values: []` to the form → verify: the value popover lists the matched attribute's values
- [x] 2.4 In `use-apply-attribute.ts`, use the classifier in the Apply backstop in place of the direct clash check → verify: Apply with a clashing name and selected values still blocks with the right message

## 3. Color picker isolation

- [x] 3.1 In `components/ui/multi-select.tsx`, ignore box clicks whose target is outside the box DOM → verify: existing `multi-select` tests pass
- [x] 3.2 In `multi-select.tsx`, add the `pointerdown` capture flag, and put the opt-in layer-open context and `useMultiSelectChipLayer` in `components/ui/multi-select-chip-layer.ts`. Skip one box-click open when a layer was open at pointer down → verify: unit test with a chip that reports open
- [x] 3.3 Report the picker's open state through the context from the new `features/products/components/editable-swatch.tsx`, used by `withEditableSwatch` in `attribute-value-types.tsx` → verify: component test

## 4. Tests

- [x] 4.1 `attribute-list.test.tsx`: replace the current duplicate-name test. Add tests for: `+ Add new` with "size" loads Size and shows "Size"; edit of an applied attribute renamed to an existing name replaces it on Apply with no create request; existing name with selected values shows the duplicate error; name of an applied attribute shows the "already added" error; unique name with selected values sends a create request and no change to the original; unique name with none selected keeps the options → verify: `npm test` passes
- [x] 4.2 `attribute-values-field.test.tsx`: picking a color keeps the picker open and the value popover closed; an outside click on the box closes the picker only → verify: `npm test` passes

## 5. Finish

- [x] 5.1 Run `npm run typecheck`, lint and `npm test` in `resources/app/` → verify: all pass
- [x] 5.2 Confirm no `docs/` page covers the variations card (none does today), so no doc update is needed. Ask the user to check the picker and the name reuse visually, because the browser is not used in this project → verify: reported to the user
