## Context

See proposal.md — Why. `ConditionRow`
(`resources/app/features/settings/tax/pages/tax-region/tax-rules/condition-row.tsx`)
imports `taxRuleConditionOptions` from `lib/utils.ts` and picks the option set
inline: `index === 1 ? [Tax Profile only] : taxRuleConditionOptions`. `TaxRules`
is rendered in three places — `general-edit-region.tsx` (country-wide),
`edit-region-eu.tsx`, and `general-edit-region-state.tsx` — all with the same
props today. `TaxRules` is wrapped in `memo`, and `edit-region-eu.tsx` relies on
its props staying referentially stable.

## Goals / Non-Goals

**Goals:**

- Let each `TaxRules` mount decide the first condition's available types.
- Keep the two existing region pages working with no change at their call site.

**Non-Goals:**

- Changing the persisted rule shape or any API.
- Reworking the `row.type` vs `row.condition` inconsistency already in
  `ConditionRow` — left as-is.
- Making the second condition's type configurable.

## Decisions

### Pass `conditionOptions` down the three-component chain

`TaxRules` → `TaxRulesDialog` → `ConditionRow`, typed `SelectOption[]`, optional,
defaulting to `taxRuleConditionOptions`. Only `general-edit-region-state.tsx`
passes an override.

- **Alternative — context/hook:** a `TaxRulesContext` provider around each mount.
  Rejected: one prop, one level of real nesting (the dialog just forwards), no
  other consumers — a context is heavier than the problem.
- **Alternative — a `variant`/`scope` enum prop** (`'region' | 'state'`) that
  `ConditionRow` maps to an option set. Rejected: pushes the option-set decision
  back into `ConditionRow`, which is exactly the coupling being removed.

### Default lives at the `TaxRules` boundary

`TaxRules` applies `= taxRuleConditionOptions` when the prop is omitted and
always forwards a concrete array inward, so `TaxRulesDialog` and `ConditionRow`
take a required prop. Keeps the "what's the default" knowledge in one place.

### Single available type renders as a read-only control, not a dropdown

When the resolved option list for a row has length 1, `ConditionRow` renders the
condition selector as a disabled `Select` (Radix `Select` root accepts
`disabled`) showing that one label, with a `cssOverride` that neutralises the
`[data-disabled]` styling and hides the chevron so it reads as a plain fixed
field rather than a greyed-out control. This replaces today's one-item `<Select>`
for the second row and is the mechanism that makes the state page's first
condition "preselected and not changeable". A disabled `Select` never fires `onValueChange`,
so a small guarded `useEffect` clamps the row's stored `condition` to the locked
value whenever they diverge — a no-op for freshly added rows (already
`tax_profile`), and the fallback path for a pre-existing rule loaded with a
now-unavailable condition type.

### Narrow export for the state page

Add `taxProfileConditionOption` (or reuse an inline literal) in `lib/utils.ts`
for the single-option array the state page passes, so the `__()` label is
defined once alongside `taxRuleConditionOptions`.

## Risks / Trade-offs

- **A pre-existing per-state rule stored with a `destination_region` condition
  would no longer be editable as such** → In practice these are not expected
  (the state page's destination is redundant). The rule still loads; its first
  condition falls back to the forced `tax_profile`. Not adding migration code for
  a case that likely has no data; flag to the user if that assumption is wrong.
- **`memo` on `TaxRules` + a new prop** → `general-edit-region-state.tsx` must
  pass a module-level constant (or `useMemo`'d value), not an inline array
  literal, to keep the referential stability `edit-region-eu.tsx` depends on. A
  module-level constant is the simplest.
