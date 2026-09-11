## Why

The tax rules editor offers two condition types — **Tax Profile** and **Destination** — from a module-level constant (`taxRuleConditionOptions`) that `ConditionRow` imports directly. On a single state's page the destination is already fixed to that one state, so offering a **Destination** condition there is meaningless. The condition set needs to vary by where the editor is mounted, which a hard import cannot express.

## What Changes

- Thread the available condition types into the tax rules editor as a prop: `TaxRules` → `TaxRulesDialog` → `ConditionRow`, replacing `ConditionRow`'s direct import of `taxRuleConditionOptions`.
- On the **per-state** page (`general-edit-region-state`), the first condition offers **Tax Profile only**, preselected and not changeable.
- On the **country-wide ("central tax")** region page and the **EU** region page, the first condition continues to offer both **Tax Profile** and **Destination**.
- Keep `taxRuleConditionOptions` (both options) as the default so only the per-state page passes an override.
- A second condition row stays **Tax Profile only** in every context (unchanged intent); when only one condition type is available for a row, its selector is shown preselected and non-interactive rather than as a one-item dropdown.
- **BREAKING** (merchant-facing): a per-state tax rule can no longer use a **Destination** condition, and the "add a second condition" affordance — which is only reachable after choosing **Destination** — is therefore unreachable on the per-state page.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `tax-settings`: adds a requirement fixing which tax-rule condition types the editor offers per context — Tax Profile only on a state's page, Tax Profile and Destination on a country-wide region page and the EU region page.

## Impact

- `resources/app/features/settings/tax/pages/tax-region/tax-rules/condition-row.tsx` — new `conditionOptions` prop, drop the direct import, render a single available type as a fixed (non-interactive) selector.
- `resources/app/features/settings/tax/pages/tax-region/tax-rules/tax-rules-dialog.tsx` — pass `conditionOptions` through.
- `resources/app/features/settings/tax/pages/tax-region/tax-rules/tax-rules.tsx` — accept and forward `conditionOptions` (default: `taxRuleConditionOptions`).
- `resources/app/features/settings/tax/pages/tax-region/general-edit-region-state.tsx` — pass the Tax-Profile-only option set.
- `resources/app/features/settings/tax/pages/tax-region/general-edit-region.tsx` and `edit-region-eu.tsx` — no change (rely on the default).
- `resources/app/features/settings/tax/lib/utils.ts` — `taxRuleConditionOptions` stays; may add a narrower single-option export.
- No API, schema, or persistence changes: the stored rule shape (`{type, operator, value}`) is untouched.
