## Context

See proposal.md — Why. The EU region page (`edit-region-eu.tsx`) hosts one React
Hook Form (`TaxRegionEuFormSchema`, fields `type` and `countries`). `VatCollection`
receives the `countries` list (via `useWatch`), a `setVatCollectionList` setter,
and an `updateVatCollection` callback.

Current wiring:

- `setVatCollectionList` is a wrapper the page passes down; it already does
  `form.setValue('countries', next, { shouldDirty: true })`.
- `updateVatCollection` → `updateEUVatCollection` calls `saveSettings` (add/edit)
  or `updateSettings` directly (delete, via the toast's `onAutoClose`), then
  `form.reset(...)`. This is the per-change persistence being removed.
- The page's Save button (`useSettingsPageActions` → `handleSaveData`) already
  rebuilds the full payload from `form.getValues()` — including `countries` — and
  persists it.
- `deriveEuRegion(regions, process, vatCollectionList)` feeds the Tax Rules
  section below. It takes the live watched `countries` as a separate argument and
  overrides `region.countries` with it, so that section already reflects unsaved
  edits without the `regions` state being touched.

## Goals / Non-Goals

**Goals:**

- VAT-collection add / edit / delete mutate the form only and mark it dirty.
- Persistence happens solely through the page Save button.
- Keep the delete toast + Undo as a local affordance.

**Non-Goals:**

- No change to any other tax flow (tax rules, tax regions list, general /
  per-state regions) even though they share the same auto-save pattern.
- No change to the settings API, the form schema, or the Save path itself.

## Decisions

**Delete auto-save wiring is removed, not replaced.** `handleAddOrUpdateVAT`
drops its `void updateVatCollection(updatedList)` call; `handleDeleteItem` drops
the `onAutoClose` callback that persisted the removal. `updateEUVatCollection`
and the `updateVatCollection` prop are then unused and deleted. Alternative —
keep the callback but no-op it — leaves dead indirection; not worth it.

**The `regions` state in `edit-region-eu.tsx` is not updated on VAT edits.**
`updateEUVatCollection` also called `setRegions(...)`. After removal, `regions`
holds the last-loaded/last-saved region list, and `handleSaveData` /
`deriveEuRegion` both read `countries` from the form, not from `regions`. So the
rules dropdown and the Save payload stay correct. `regions` is still needed for
the region identity/`rules` merge in `applyEuRegionUpdate` and for `updateTaxRules`.

**Keep the toast + Undo, drop only the persistence.** `handleDeleteItem` still
snapshots the pre-delete list and shows the "VAT collection deleted" toast with
an Undo that calls `setVatCollectionList(initialList)`. Nothing hits the server
either way. This preserves the existing quick-recovery affordance; the global
Discard button remains the fallback.

## Risks / Trade-offs

- **`isDirty` may stay `true` after a full Undo.** Undo restores the previous
  array, but `form.setValue(..., { shouldDirty: true })` has already flagged the
  field, and RHF does not necessarily clear `isDirty` when a later value happens
  to match the reset baseline. → Acceptable: the merchant clicks Discard (or
  Save, which is a no-op change) to clear it. Not worth adding reset bookkeeping
  for an edge case.

- **Merchant now must click Save to persist VAT edits.** A merchant used to the
  old instant-save behavior could navigate away expecting it to be saved. → The
  settings shell already intercepts navigation while the form is dirty and shows
  an unsaved-changes confirmation, so the edit is not lost silently.
