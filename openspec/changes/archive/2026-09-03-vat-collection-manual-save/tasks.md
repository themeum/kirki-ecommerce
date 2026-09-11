## 1. Remove per-change persistence from VatCollection

- [x] 1.1 In `vat-collection.tsx`, change `handleAddOrUpdateVAT` to update the
  list only: compute the new list, call `setVatCollectionList`, clear
  `editIndex`, close the popup — no `updateVatCollection` call. Lift the list
  computation and `setEditIndex` out of the `setVatCollectionList` updater
  callback so it has no side effects.
- [x] 1.2 In `vat-collection.tsx`, change `handleDeleteItem` to keep the
  pre-delete snapshot, `setVatCollectionList(updatedList)`, and the
  "VAT collection deleted" toast with its **Undo** action — but remove the
  `onAutoClose` handler that called `updateVatCollection(updatedList, 'delete')`.
- [x] 1.3 Remove `updateVatCollection` from `VatCollectionProps` and from the
  destructured props; remove any now-unused imports/types in `vat-collection.tsx`.
  (No imports became unused — `Dispatch`/`SetStateAction`/`toast` still referenced.)
- [x] 1.4 Verify: `npm run typecheck && npm test` from `resources/app/`.
  (typecheck clean; 782 tests pass; eslint clean on both files.)

## 2. Drop the unused handler on the EU region page

- [x] 2.1 In `edit-region-eu.tsx`, delete `updateEUVatCollection` and stop
  passing `updateVatCollection` to `<VatCollection>`. Keep the
  `setVatCollectionList` wrapper (`form.setValue('countries', next, { shouldDirty: true })`)
  and the `updateTaxRules` handler unchanged.
- [x] 2.2 Remove imports left unused by deleting `updateEUVatCollection`.
  (None became unused — `handleSaveData` / `updateTaxRules` still reference
  `buildUpdatedRegions`, `saveSettings`, `updateSettings`, `applyServerErrors`,
  `CountryTaxRate`, `setRegions`.)
- [x] 2.3 Confirm the Tax Rules section still reflects unsaved country edits:
  `deriveEuRegion` receives the watched `countries` list, so no `setRegions`
  call is needed on VAT edits.
- [x] 2.4 Verify: `npm run typecheck && npm test` from `resources/app/`.
  (Same run as 1.4 — clean.)

## 3. Manual behavior check

- [x] 3.1 Confirm against the spec scenarios (add / edit / delete each mark the
  form dirty and write nothing until Save; Undo restores the row; Save persists
  the shown list). Verified by code review: all three handlers now route through
  the `setVatCollectionList` wrapper → `form.setValue('countries', next, { shouldDirty: true })`
  with no API call; the Save button's `handleSaveData` sends `countries` from the
  form. This project does not use browser-based verification — visual pass handed
  to the user.
