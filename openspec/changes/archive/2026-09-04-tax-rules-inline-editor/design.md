## Context

See proposal.md — Why. The tax rules editor (`tax-rules-dialog.tsx`) is a
`Dialog` mounted from `tax-rules.tsx`. The shipping equivalent
(`shipping-rule-form-card.tsx`, mounted from `shipping-rules.tsx`) is already
an inline `Card`. Both editors already share the same list primitive
(`@/components/shared/rule-items`) and the same IF/THEN layout; the shipping
files are a direct structural reference for this change.

One difference matters: `ShippingRuleFormCard` **auto-saves** each rule
(`updateSettings` + toast + `onSaved()`). Tax rules deliberately do not —
all three callers wire `updateTaxRules` as
`form.setValue('rules', …, { shouldDirty: true })` and rely on the settings
page action bar (`useSettingsPageActions`). Commit `62a79ce2` removed the tax
rules auto-save on purpose.

## Goals / Non-Goals

**Goals:**
- Tax rules editor renders inline (add above the list, edit in place of the
  rule's summary row), matching the shipping pattern's structure.
- Keep the change to two files plus a rename.

**Non-Goals:**
- No per-rule auto-save. The save path is unchanged.
- No change to `condition-row.tsx`, `add-state-dialog.tsx`, the `memo()`
  wrapper, the form schema, or any caller.
- Not aligning prop names or file layout to shipping beyond what the inline
  conversion requires.

## Decisions

**Mirror `ShippingRuleFormCard`'s shell, not its save behavior.** Replace
`Dialog/DialogContent/DialogHeader/DialogBody/DialogFooter` with a dashed
`Card` + `CardContent` + a trailing `Flex justify="end"` button row. Keep the
component's existing `useForm` + `TaxRulesFormSchema` + reset-on-open effect,
`ConditionRow` list, and THEN action select as-is. `handleSubmit` still calls
`updateTaxRules(updatedRules)` then closes — no `updateSettings` call.
_Alternative:_ adopt shipping's self-saving card wholesale — rejected, it
reverses commit `62a79ce2` and would need per-caller rework.

**Keep the `from: 'add' | 'edit'` prop.** Shipping uses `mode`; renaming
would touch more lines for no behavioral gain. Surgical wins.

**Rename `tax-rules-dialog.tsx` → `tax-rule-form-card.tsx`.** The file is no
longer a dialog; singular matches `shipping-rule-form-card.tsx`. Only
`tax-rules.tsx` imports it (two mount sites) — both update.

**`tax-rules.tsx` list rendering mirrors `ShippingRules`.** Render the card
above `RuleItems` when adding; in the `rules.map`, render the card instead of
the `RuleItem` (ternary on `editingRuleIndex === index`) rather than mounting
it after the row. The `showModal`/`setShowModal` props collapse to
`open`-less mount/unmount + an `onClose` (or keep `setShowModal` named as-is
and always pass `true` — pick whichever keeps the diff smallest during
apply).

## Risks / Trade-offs

- **Nested dialog → dialog-from-inline-card.** `ConditionRow` opens
  `AddStatePopup` (a `Dialog`). Today that is a dialog inside a dialog; after
  this change it is a dialog opened from an inline card — strictly simpler,
  no mitigation needed.
- **`memo()` wrapper rationale (VAT dialog commit ordering) still holds** —
  the wrapper and its stable props are untouched, so the EU page behavior is
  unchanged. Confirm during apply that the inline card does not re-introduce
  an unstable prop.
- **No component tests exist** for these files; the schema payload test is
  unaffected. Verification leans on `npm run typecheck && npm test` plus the
  merchant checking the three region pages.
