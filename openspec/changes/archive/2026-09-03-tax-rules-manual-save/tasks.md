## 1. Add `rules` to the three region form schemas

- [x] 1.1 In `tax-region-eu-form.ts`, add `rules: z.array(TaxRuleSchema).default([])`
  to `TaxRegionEuFormShape` and pass `rules: values.rules` through the
  `.transform()` output. Import `TaxRuleSchema` from
  `@/features/settings/tax/schemas/catalog/tax`.
- [x] 1.2 In `tax-region-general-form.ts`, add the same `rules` field to
  `TaxRegionGeneralFormShape` and the `.transform()` output (rules pass through
  regardless of central/per-state mode — do not clear them).
- [x] 1.3 In `tax-region-state-form.ts`, add the same `rules` field to
  `TaxRegionStateFormShape` and the `.transform()` output.
- [x] 1.4 Update the payload tests: `tax-region-eu-form.test.ts`,
  `tax-region-general-form.test.ts`, `tax-region-state-form.test.ts` — assert a
  representative rule array round-trips unchanged through `.parse()`, and that
  `getDefaults(...)` / the empty-input case yields `rules: []`.
- [x] 1.5 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 2. EU region page — stage rule edits, drop the auto-save

- [x] 2.1 In `edit-region-eu.tsx`, add `rules: eu?.rules ?? []` to the
  `form.reset({...})` call in the `taxSettingsData` hydration effect.
- [x] 2.2 Add a watched `rules` value (`useWatch({ control: form.control, name: 'rules' })`)
  and pass it as `rules={...}` to `<TaxRules>`. Pass
  `updateTaxRules={useCallback((next) => form.setValue('rules', next, { shouldDirty: true }), [form])}`.
- [x] 2.3 Delete the `updateTaxRules` handler, and the `euRegion` `useMemo` +
  `deriveEuRegion` import (now unused — `euRegion` was only read for its
  `rules`). Leave `deriveEuRegion` in `region-tax.ts`.
- [x] 2.4 In `handleSaveData` / `buildUpdatedRegions`, thread the form's `rules`
  into the EU region — pass `{ rules: values.rules }` as the `applyEuRegionUpdate`
  override (or fold into its `values` handling). Delete the `from === 'delete'`
  branch of `handleSaveData` and the `from` parameter.
- [x] 2.5 Remove imports left unused by 2.3–2.4 (`updateSettings`,
  `useInvalidateTaxSettings`, `toastMutationError`, `EuTaxRegion` if no longer
  referenced — check line ~110's cast first).
- [x] 2.6 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 3. General region page (country-wide) — stage rule edits

- [x] 3.1 In `general-edit-region.tsx`, add `rules: region?.rules ?? []` to the
  `form.reset({...})` call in the `regions`/`code` hydration effect.
- [x] 3.2 Pass a watched `rules` value and a
  `form.setValue('rules', next, { shouldDirty: true })` callback (via `useCallback`)
  into `<TaxRules>`; delete `updateRegionRules`.
- [x] 3.3 In `handleSaveData`, wrap the region update so the form's rules are
  written on Save:
  `applyRegionRules(applyRegionTaxUpdate(regions, code, values), code, values.rules)`.
  Leave `applyRegionTaxUpdate` and its test unchanged (still used by
  `handleAddCities`).
- [x] 3.4 Remove imports left unused by 3.2 (`applyRegionRules` is now used in
  `handleSaveData`, so keep it).
- [x] 3.5 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 4. State page — stage rule edits

- [x] 4.1 In `general-edit-region-state.tsx`, add `rules: storedState.rules ?? []`
  to the `form.reset({...})` call in the `storedState` hydration effect.
- [x] 4.2 Pass a watched `rules` value and a
  `form.setValue('rules', next, { shouldDirty: true })` callback (via `useCallback`)
  into `<TaxRules>`; delete `updateStateRules`.
- [x] 4.3 Confirm `handleSaveData` persists rules: `updateRegionState(regions, code,
  stateId, values)` already merges `values.rules` via `{ ...state, ...patch }`
  now that the payload carries `rules`. Check whether `saveRegions`'s
  `from === 'delete'` branch is now dead here (still used elsewhere? — it is not;
  leave it only if another caller in the file needs it, otherwise remove the
  branch and `updateSettings` / `useInvalidateTaxSettings` / `toastMutationError`
  imports).
- [x] 4.4 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 5. `TaxRules` + `TaxRulesDialog` — one source of truth, keep the undo toast

- [x] 5.1 In `tax-rules.tsx`, remove the `rulesObj` `useState` and its mirroring
  `useEffect`; render the list and compute indices from the `rules` prop.
- [x] 5.2 Rework `handleDeleteRules` to snapshot the current `rules`, call
  `updateTaxRules(filtered)`, and keep the "Tax rule deleted" toast with **Undo**
  → `updateTaxRules(snapshot)`. Remove the `onAutoClose` persist call.
- [x] 5.3 Drop the `from` parameter from the `updateTaxRules` prop type in both
  `tax-rules.tsx` and `tax-rules-dialog.tsx`.
- [x] 5.4 In `tax-rules-dialog.tsx`, remove `rulesObj` / `setRulesObj` props;
  have `handleSubmit` compute the next list from the `rules` prop + form values,
  call `updateTaxRules(next)`, and close. Remove the standalone
  `void updateTaxRules(...)` / `setRulesObj(...)` pair.
- [x] 5.5 Update `tax-rules.tsx` call sites of `<TaxRulesDialog>` to pass the
  `rules` prop instead of `rulesObj` / `setRulesObj`.
- [x] 5.6 Remove any imports/types left unused in both files.
- [x] 5.7 Verify: `npm run typecheck && npm test` from `resources/app/`.

## 6. Behavior check against the spec

- [x] 6.1 Code-review each of the three pages: add / edit / delete route through
  `form.setValue('rules', …, { shouldDirty: true })` with no API call; Save's
  `handleSaveData` includes the form's rules in the `tax_regions` payload;
  Discard (`form.reset()`) reverts the list.
  - EU: `updateTaxRules` → `form.setValue('rules', …, { shouldDirty: true })`;
    `handleSaveData` → `buildUpdatedRegions` → `applyEuRegionUpdate(regions,
    values, { rules: values.rules })`; discard `form.reset()`. ✓
  - General country-wide: `updateRegionRules` (renamed intent, same name) →
    `form.setValue`; `handleSaveData` → `applyRegionRules(applyRegionTaxUpdate(
    regions, code, values), code, values.rules)`; discard `form.reset()`. In
    per-state mode `<TaxRules>` is not rendered so hydrated rules ride through
    Save unchanged. ✓
  - State page: `updateStateRules` → `form.setValue`; `handleSaveData` →
    `updateRegionState(regions, code, stateId, values)` where `values` now
    carries `rules` (merged via `{ ...state, ...patch }`); discard `form.reset()`. ✓
- [x] 6.2 Confirm the delete Undo restores the rule locally and that letting the
  toast dismiss leaves the form dirty with the rule removed and nothing
  persisted. `handleDeleteRules` calls `updateTaxRules(filtered)` (dirty, no
  API), Undo calls `updateTaxRules(snapshot)`; no `onAutoClose`. ✓
- [x] 6.3 `region-tax.ts`'s `deriveEuRegion` is now unused by production code
  (only its own test in `region-tax.test.ts` references it). Left in place — not
  removing exported lib API + its test as a side effect of this change. Visual
  pass handed to the user; this project does not use browser-based verification.
- [x] 6.4 Verify: `npm run typecheck && npm test` from `resources/app/` —
  typecheck clean, eslint clean on all 8 touched files + tests dir, 782 tests
  pass.
