## Context

See proposal.md — Why. `vat-collection-manual-save` already did this for the EU
page's VAT list; the difference here is that `rules` is **not yet a form field**
on any of the three region schemas, and three pages are involved.

Current wiring (all three pages):

- `<TaxRules>` receives `rules` (from the `regions` useState, derived per page),
  an `updateTaxRules(list, from?)` callback, and mirrors `rules` into a local
  `rulesObj` useState via `useEffect`.
- `TaxRulesDialog.handleSubmit` computes the next list, calls `setRulesObj`, then
  `void updateTaxRules(next)` — the immediate persist.
- `TaxRules.handleDeleteRules` optimistically sets `rulesObj`, shows a toast with
  **Undo**, and on `onAutoClose` calls `void updateTaxRules(next, 'delete')`.
- Per page, `updateTaxRules` maps to:
  - EU: `applyRegionRules(regions, 'EU', list)` → `setRegions` → `handleSaveData`
    (`from === ''` → `saveSettings`; `from === 'delete'` → `updateSettings` +
    `invalidateTaxSettings`).
  - General country-wide: `applyRegionRules` → `setRegions` →
    `saveRegions(_, 'delete')` (always immediate).
  - State page: `updateRegionState(regions, code, stateId, { rules })` →
    `setRegions` → `saveRegions(_, 'delete')` (always immediate).
- Each page's Save button (`useSettingsPageActions` → `handleSaveData` /
  `handleSaveData(values)`) already rebuilds the full `tax_regions` payload from
  the form values and persists it.

## Goals / Non-Goals

**Goals:**

- Tax-rule add / edit / delete mutate the page form only and mark it dirty.
- Persistence happens solely through the page's existing Save button.
- Keep the delete toast + Undo as a local affordance.
- `TaxRules` has one source of truth for the list (the `rules` prop), not two.

**Non-Goals:**

- No change to the persisted rule shape, or to where a region's / a state's
  rules are stored.
- No change to the tax regions list, VAT collection, rate fields, or the
  add-states flow (`handleAddCities` keeps its own immediate-save-and-navigate).
- No change to the settings endpoint.

## Decisions

### `rules` becomes a field on all three region form schemas

`tax-region-eu-form`, `tax-region-general-form`, and `tax-region-state-form` each
gain `rules: z.array(TaxRuleSchema).default([])` in the shape and pass it through
in `.transform()`. This is what makes `isDirty` and `form.reset()` (Discard)
cover rules for free, matching how `countries` / `states` already work.

- `TaxRuleSchema` is imported from `schemas/catalog/tax.ts` (a `.passthrough()`
  object) — no new schema.
- `.default([])` on a brand-new field is consistent with the `countries` /
  `states` fields and does not run afoul of the project's "no gratuitous
  `.default()` on previously-required fields" rule.
- Each schema's payload test (`*-form.test.ts`) gains a `rules` assertion, per
  the project rule that a schema change carries its test.

Alternative — keep rules in the `regions` useState with a separate dirty flag —
rejected: Discard would not revert rules and `isDirty` would be split-brained.

### Pages seed `rules` on hydration and pass a `setValue` callback down

In each page's hydration `useEffect`, `form.reset({ ..., rules: <source>.rules ?? [] })`:

- EU: `eu?.rules ?? []`
- General: `region?.rules ?? []`
- State: `storedState.rules ?? []`

`<TaxRules>` is fed `rules={useWatch({ control, name: 'rules' })}` and
`updateTaxRules={(next) => form.setValue('rules', next, { shouldDirty: true })}`.
The `updateTaxRules` callback is wrapped in `useCallback` so `TaxRules`'s `memo`
keeps holding.

### Save path threads `rules` through with the existing region-tax helpers

- **EU**: `applyEuRegionUpdate` already accepts an `overrides?: Partial<TaxRegion>`
  argument. `buildUpdatedRegions(values)` passes `{ rules: values.rules }` as the
  override (or folds `rules` into the `values` handling). `handleSaveData`'s
  `from === 'delete'` branch — reachable only from `updateTaxRules(_, 'delete')`
  — is deleted along with the now-unused `updateSettings` /
  `useInvalidateTaxSettings` / `toastMutationError` imports if nothing else in
  the file uses them.
- **General country-wide**: `handleSaveData` wraps its result —
  `applyRegionRules(applyRegionTaxUpdate(regions, code, values), code, values.rules)`.
  `applyRegionTaxUpdate`'s signature and its "preserves … country-wide rules"
  behavior are left as-is (still correct for `handleAddCities`, which passes no
  rules); the outer `applyRegionRules` overrides with the form value on the Save
  path. `updateRegionRules` is deleted.
- **State page**: `TaxRegionStateFormPayload` gains `rules`, so
  `updateRegionState(regions, code, stateId, values)` already merges it via
  `{ ...state, ...patch }`. `updateStateRules` is deleted.

### `deriveEuRegion` / `euRegion` drop out of `edit-region-eu.tsx`

`euRegion` is used only for `euRegion?.rules` at line 205. With `rules` read from
`useWatch`, the `euRegion` `useMemo` and the `deriveEuRegion` import are removed
from the page. `deriveEuRegion` itself stays in `region-tax.ts` with its test —
it is now unused; flag it for a follow-up cleanup rather than removing exported
lib API as a side effect here.

### `TaxRules` drops `rulesObj`; `TaxRulesDialog` drops the dual setter

- `TaxRules`: remove the `rulesObj` useState and its mirroring `useEffect`;
  render and index off the `rules` prop. `handleDeleteRules` keeps the pre-delete
  snapshot and the toast + **Undo** (Undo → `updateTaxRules(snapshot)`), but
  drops the `onAutoClose` persist.
- `TaxRulesDialog`: `handleSubmit` computes the next list from `rules` + form
  values and calls a single `onSubmit(next)` prop (the page's `updateTaxRules`),
  then closes. Drop `rulesObj` / `setRulesObj` props and the
  `void updateTaxRules(...)` call. The `from` param on the callback type is
  removed (no caller passes it anymore).

## Risks / Trade-offs

- **`isDirty` can stay `true` after a full Undo** → same as
  `vat-collection-manual-save`: `setValue(..., { shouldDirty: true })` has
  already flagged the field and RHF will not always clear it when a later value
  matches the baseline. Acceptable — the merchant clicks Discard or Save. Not
  worth reset bookkeeping.

- **Merchant must now click Save to persist rule edits** → the settings shell
  already intercepts navigation while the form is dirty (`setUnsavedDataStatus`)
  and shows an unsaved-changes confirmation, so edits are not lost silently.

- **General country-wide rules while in per-state mode** → `<TaxRules>` is not
  rendered in per-state mode, so `rules` sits untouched in the form from
  hydration and is written back unchanged on Save. This preserves the existing
  "Toggling modes preserves the region-level rules" behavior.

- **`TaxRuleSchema` in a form schema** → it is `.passthrough()` with `z.unknown()`
  values; verify `getDefaults` returns `rules: []` and `npm test` payload tests
  round-trip a representative rule object unchanged.
