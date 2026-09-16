## 1. Option set

- [x] 1.1 In `lib/utils.ts`, add a single-option export (e.g. `taxProfileConditionOption: SelectOption[]`) for the Tax-Profile-only set, sharing the same `__()` label as `taxRuleConditionOptions`. Keep `taxRuleConditionOptions` as-is. — exported `taxProfileConditionOptions` (array), sharing an internal `taxProfileConditionOption`.

## 2. Thread the prop through the editor

- [x] 2.1 `condition-row.tsx`: add a required `conditionOptions: SelectOption[]` prop; remove the `taxRuleConditionOptions` import.
- [x] 2.2 `condition-row.tsx`: resolve the row's option list from the prop — `index === 1` still forces Tax-Profile-only; otherwise use `conditionOptions`.
- [x] 2.3 `condition-row.tsx`: when the resolved list has length 1, render the condition `Select` as `disabled` showing that label, and ensure the row's `condition` is that value. — disabled `Select` bound to the locked value; a guarded effect clamps stale form state to it.
- [x] 2.4 `tax-rules-dialog.tsx`: add a required `conditionOptions` prop and forward it to every `ConditionRow`.
- [x] 2.5 `tax-rules.tsx`: add an optional `conditionOptions` prop defaulting to `taxRuleConditionOptions`; forward the resolved value to both `TaxRulesDialog` renders. Keep the `memo` wrapper.

## 3. Call sites

- [x] 3.1 `general-edit-region-state.tsx`: pass the Tax-Profile-only option set to `<TaxRules>` using a module-level constant (not an inline array literal, to preserve referential stability).
- [x] 3.2 Confirm `general-edit-region.tsx` and `edit-region-eu.tsx` are unchanged and get both options via the default.

## 4. Verify

- [x] 4.1 `npm run typecheck` passes.
- [x] 4.2 `npm test` in `resources/app/` passes (`tax-rules-form` schema test unaffected — stored shape unchanged). — 103 files / 782 tests pass; lint clean on changed files.
- [ ] 4.3 Manual check request to the user: state page shows Tax Profile fixed with no add-condition button; country-wide and EU pages still offer Tax Profile + Destination.
