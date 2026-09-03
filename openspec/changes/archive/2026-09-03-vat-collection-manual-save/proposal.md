## Why

On the EU tax region page, adding, editing, or deleting a VAT-collection country
persists to the server immediately — mid-form, before the merchant clicks Save.
Deletes are worse: they save silently when the "deleted" toast auto-closes and
never mark the form dirty, so a mistaken delete is committed with no Save/Discard
affordance to undo it. Every other control on the page (the OSS / Micro Business
process, the tax rules the merchant edits elsewhere) already defers to the
page's Save button. VAT collection should behave the same way.

## What Changes

- Adding or editing a VAT-collection country updates the form only and marks the
  tax settings form dirty; it no longer calls the settings API on its own.
- Deleting a VAT-collection country updates the form only and marks it dirty; the
  server is no longer written when the undo toast auto-closes.
- The "VAT collection deleted" toast and its **Undo** action are kept, now purely
  local — Undo restores the row in the form, and doing nothing leaves the row
  removed and the form dirty until the merchant saves or discards.
- Persisting VAT-collection edits happens only through the page's existing Save
  button, which already writes `countries` in its payload.
- Scope is the EU region's VAT collection list only
  (`VatCollection` + `edit-region-eu.tsx`). Tax rules, the tax regions list, and
  the general/per-state region flows are untouched.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tax-settings`: the EU region's VAT-collection edits (add, edit, delete a
  member country) are saved with the page rather than persisted on each change,
  and a pending delete is reported as an unsaved change.

## Impact

- `resources/app/features/settings/tax/pages/tax-region/vat-collection/vat-collection.tsx`
  — drop the auto-save calls; keep the local undo toast.
- `resources/app/features/settings/tax/pages/tax-region/edit-region-eu.tsx`
  — remove the now-unused `updateEUVatCollection` handler and its prop.
- No API, schema, or form-schema changes. No changes to the settings endpoint.
