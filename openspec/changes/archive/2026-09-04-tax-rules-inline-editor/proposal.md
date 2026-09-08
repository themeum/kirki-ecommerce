## Why

The tax rules editor opens in a modal dialog, while the equivalent shipping
rules editor composes inline on the method page. The modal overlays the rest
of the region page, hides the rule list being edited, and is the only rule
editor in settings that behaves this way. Aligning tax rules with the
shipping pattern makes the two consistent and keeps the rule list visible
while a rule is being composed or edited.

## What Changes

- The tax rules editor is composed inline within the tax rules section
  instead of in a modal overlay: adding a rule shows the editor above the
  rule list; editing a rule replaces that rule's summary row with the editor
  in place. Cancelling returns to the list with no change.
- No change to how tax-rule edits are saved: the editor still writes only to
  the page form and marks it dirty; the merchant saves via the settings page
  action bar. No per-rule auto-save.
- No change to the editor's fields, condition-type rules, validation, or the
  persisted rule shape.
- Implementation: `tax-rules-dialog.tsx` becomes an inline `Card`-based
  form component (renamed `tax-rule-form-card.tsx`), mirroring
  `shipping-rule-form-card.tsx`; `tax-rules.tsx` renders it inline the way
  `shipping-rules.tsx` does.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tax-region-rate-model`: adds a requirement that the tax rules editor is
  composed inline within the tax rules section — added above the list, edited
  in place of the rule's summary row, abandonable — rather than in a modal
  overlay. The existing "Tax-rule edits are staged and saved with the page"
  and "Tax-rule condition types depend on where the rules are edited"
  requirements are unchanged in substance; scenario wording that says the
  merchant "opens" the editor still holds.

## Impact

- `resources/app/features/settings/tax/shared/components/tax-rules/tax-rules-dialog.tsx`
  → renamed to `tax-rule-form-card.tsx`, Dialog shell replaced with a dashed
  `Card` + `CardContent` + trailing button row.
- `resources/app/features/settings/tax/shared/components/tax-rules/tax-rules.tsx`
  — list JSX renders the inline card for add/edit; one import updated.
- Unchanged: `condition-row.tsx`, `add-state-dialog.tsx`, the `memo()` wrapper
  on `TaxRules`, `tax-rules-form.ts` and its payload test, and all three
  callers (`general-edit-region.tsx`, `general-edit-region-state.tsx`,
  `edit-region-eu.tsx`) — each already wires `updateTaxRules` as
  `form.setValue('rules', …, { shouldDirty: true })`.
- Verification gate: `npm run typecheck && npm test` from `resources/app/`.
