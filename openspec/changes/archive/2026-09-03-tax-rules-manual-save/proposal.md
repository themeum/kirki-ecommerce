## Why

In every tax rules section — a country-wide region's, a per-state page's, and
the EU region's — adding, editing, or deleting a rule persists to the settings
API immediately, mid-form, before the merchant clicks Save. Deletes are the
worst case: they save silently when the "Tax rule deleted" toast auto-closes and
never mark the form dirty, so a mistaken delete is committed with no
Save/Discard affordance. VAT collection on the same EU page was already moved to
manual save (`vat-collection-manual-save`); tax rules are the last control on
these pages that still auto-persists.

## What Changes

- Adding, editing, or deleting a tax rule updates the region form only and marks
  the tax settings form dirty; it no longer calls the settings API on its own.
- The "Tax rule deleted" toast and its **Undo** action are kept, now purely
  local — Undo restores the rule in the form, and doing nothing leaves the rule
  removed and the form dirty until the merchant saves or discards.
- `rules` becomes a field on the three region form schemas
  (`tax-region-eu-form`, `tax-region-general-form`, `tax-region-state-form`),
  seeded from the stored region/state on hydration and written back by the
  page's existing Save path.
- `TaxRules` drops its internal `rulesObj` mirror state and renders from the
  `rules` prop; `TaxRulesDialog` drops the `setRulesObj` + `updateTaxRules`
  side-persist and pushes the new list up through a single callback.
- Scope is the tax rules sections on the three region pages only. The tax
  regions list, VAT collection, rate fields, and the add-states flow are
  untouched.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tax-settings`: tax-rule edits (add, edit, delete) in a country-wide region,
  on a state's page, and in the EU region are saved with the page rather than
  persisted on each change, and a pending delete is reported as an unsaved
  change.

## Impact

- `resources/app/features/settings/tax/schemas/forms/tax-region-eu-form.ts`,
  `tax-region-general-form.ts`, `tax-region-state-form.ts` — add a `rules` field;
  update each schema's payload test.
- `resources/app/features/settings/tax/pages/tax-region/edit-region-eu.tsx`,
  `general-edit-region.tsx`, `general-edit-region-state.tsx` — seed `rules` on
  hydration, pass a `form.setValue` callback into `TaxRules`, thread `rules`
  through the Save path, remove the per-change persistence handlers.
- `resources/app/features/settings/tax/pages/tax-region/tax-rules/tax-rules.tsx`
  and `tax-rules-dialog.tsx` — remove the local mirror state and the auto-save
  wiring; keep the local undo toast.
- `resources/app/features/settings/tax/lib/region-tax.ts` — `applyRegionRules`
  reused on the Save path for the general/state pages; `applyEuRegionUpdate`
  carries `rules`. Update `region-tax.test.ts` where behavior shifts.
- No API, endpoint, or persisted-shape changes.
