## 1. Convert the editor to an inline card

- [x] 1.1 Rename `resources/app/features/settings/tax/shared/components/tax-rules/tax-rules-dialog.tsx` to `tax-rule-form-card.tsx` (keep `git mv` so history follows); update `displayName` and the default export name to `TaxRuleFormCard`.
- [x] 1.2 Replace the `Dialog` / `DialogContent` / `DialogCloseButton` / `DialogHeader` / `DialogBody` / `DialogFooter` shell with a dashed `Card` + `CardContent` (mirror `shipping-rule-form-card.tsx`'s `styles.dashedCard` + `mergeCss(cardStyles.formCard, …)`), an inline title row (`LightningBoltIcon` + "New Tax Rules" / "Edit Tax Rules" driven by `from`), and a trailing `Flex justify="end" gap={2}` Cancel / Add Rule (or Update) button row. Drop the now-unused dialog imports.
- [x] 1.3 Keep the component's `useForm` + `TaxRulesFormSchema`, the reset-on-open `useEffect`, the `ConditionRow` list, and the THEN action select unchanged. `handleSubmit` still calls `updateTaxRules(updatedRules)` then closes — no `updateSettings` / toast / auto-save.
- [x] 1.4 Collapse the `showModal` / `setShowModal` props to whatever keeps the diff smallest: either mount/unmount the card from the parent with a single `onClose` callback, or keep `setShowModal` as-is and stop rendering a `<Dialog open>`. Update the prop type accordingly.
- [x] 1.5 Run `npm run typecheck && npm test` from `resources/app/`.

## 2. Render the card inline from the rules section

- [x] 2.1 In `resources/app/features/settings/tax/shared/components/tax-rules/tax-rules.tsx`, update the import to `tax-rule-form-card`.
- [x] 2.2 When adding (`addRuleModal`), render `TaxRuleFormCard` inline above `RuleItems` (mirror `ShippingRules`' `showAddCard` block), not as a mounted dialog.
- [x] 2.3 In the `rules.map`, render `TaxRuleFormCard` in place of the `RuleItem` when `editingRuleIndex === index` (ternary, mirroring `ShippingRules`), instead of mounting it after the row.
- [x] 2.4 Leave `condition-row.tsx`, `add-state-dialog.tsx`, and the `memo(TaxRules)` wrapper untouched; confirm the inline card is not passed a newly-unstable prop that would defeat the memo.
- [x] 2.5 Run `npm run typecheck && npm test` from `resources/app/`.

## 3. Verify end to end

- [x] 3.1 Confirm no other file imports `tax-rules-dialog` (`grep -rn "tax-rules-dialog" resources/app`).
- [x] 3.2 Manually check all three sections in the admin — a general region's country-wide rules, a state's page, and the EU region: adding shows the editor inline above the list, editing replaces the rule's row in place, Cancel restores the list, and Save from the page action bar persists the staged rules. (Ask the user to do this — no browser verification in this project.)
- [x] 3.3 Run `npm run typecheck && npm test` from `resources/app/`.
