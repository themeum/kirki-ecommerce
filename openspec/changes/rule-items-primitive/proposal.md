## Why

The "Rule N / IF ... Then ..." card list is hand-rolled twice — once in
`shipping-rules.tsx` (Shipping Method Rules) and once in `tax-rules.tsx` (Tax
Rules) — each with its own raw `Card`/`CardContent`/`Flex`/`Text`/`ActionGroup`
markup and its own `defineStyles`. The two copies have already drifted:
different badge components (a `darkCard`-styled `Card` vs `Badge`), different
hover-reveal CSS strategies (`data-actions-open`/opacity vs `visibility` +
`data-card-action-group`), different border-radius handling for the
first/last row, and one badge icon component vs another. Any future visual
change to this pattern (e.g. an accessibility fix to the hover reveal, like
the focus-outline clipping bug the `stacked-items-primitive` change fixed for
`StackedItems`) has to be found and applied twice.

- The target visual (per the reference mockup provided with this request) is
  a single bordered container with hairline dividers between rules and
  rounded outer corners only — the same seamless-list shape
  `resources/app/components/ui/stacked-items.tsx` already implements, not
  the spaced-apart individually-bordered cards either page currently
  renders (both pages' current CSS is inconsistent with each other and, on
  inspection, does not cleanly produce rounded/gapped cards either —
  `tax-rules.tsx`'s cards have no gap between them at all, and
  `shipping-rules.tsx`'s only rounds the first/last card despite a gap
  between them). Rather than hand-roll a third copy of container/divider/
  hover-reveal CSS, the new component composes `StackedItems`/`StackedItem`
  for that mechanic and adds only the rule-specific content pieces.

## What Changes

- Add `resources/app/components/shared/rule-items.tsx`: a new compound
  component family, `RuleItems`/`RuleItem`, built on top of
  `resources/app/components/ui/stacked-items.tsx`'s `StackedItems`/
  `StackedItem` (reused for the bordered container, row dividers, first/
  last-row corner radius, and hover/focus-reveal actions slot — no new
  container CSS). New pieces specific to a rule row: `RuleItemBadge` (the
  numbered "⚡ Rule N" pill), `RuleItemConditions`/`RuleItemCondition` (one
  or more "IF .../AND IF ..." lines), `RuleItemAction` (the "Then ...:
  value" line), and `RuleItemActions` (thin wrapper over
  `StackedItemActions` for the edit/delete buttons). Follows the same
  file-level architecture as `stacked-items.tsx` (`forwardRef`,
  `cssOverride`, co-located `defineStyles`, thin subcomponents composed as
  JSX children, named exports).
- The component owns only presentation (badge numbering label, condition/
  action row layout, hover/focus-reveal actions, corner radius). It does not
  take a rules array or a label-formatting prop — callers keep mapping their
  own rules array and building condition/action label text themselves (the
  two pages already format labels differently: `shipping-rules.tsx` looks up
  `conditionOptions`/`actionOptionsArray`, `tax-rules.tsx` uses raw
  `condition.type`/`operator` plus `getDestinationDisplayValue`). This
  matches the composition-over-configuration precedent set by
  `stacked-items-primitive` (see its proposal's "Why") and must not
  regress into a data-array-plus-handler-map shape.
- Migrate `resources/app/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rules.tsx`
  and `resources/app/pages/settings/tax-settings/tax-region/tax-rules/tax-rules.tsx`
  to compose `RuleItems`/`RuleItem` for the row markup, deleting each file's
  now-unused `Card`/badge/hover-reveal styles for this pattern. Each page's
  data fetching, delete/undo-toast logic, and rule-edit wiring (shipping's
  inline `ShippingRuleFormCard` swap-in-place vs tax's `TaxRulesDialog`
  modal) are unchanged — only the read-only row markup changes.

## Capabilities

### New Capabilities
- `rule-items`: the composable rule-list UI primitive — the numbered badge
  and condition/action line layout for a rule row, built on the existing
  `StackedItems`/`StackedItem` seamless-list container so the bordered
  group, row dividers, corner radius, and hover/focus-reveal actions match
  that primitive's already-specified behavior.

### Modified Capabilities
_None._ No existing `openspec/specs/` capability covers this row markup;
shipping-rules and tax-rules page behavior (data fetching, delete/undo,
edit wiring) is unchanged.

## Impact

- **New file**: `resources/app/components/shared/rule-items.tsx`.
- **Modified**: `resources/app/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rules.tsx`,
  `resources/app/pages/settings/tax-settings/tax-region/tax-rules/tax-rules.tsx`
  — row markup only, all data/handler logic untouched. Both pages drop their
  JS-tracked hover state (`hoveredRuleIndex` in shipping, the
  `data-card-action-group` CSS selector in tax) in favor of
  `StackedItem`'s existing hover/focus-reveal mechanism.
- **Unchanged**: `resources/app/components/ui/stacked-items.tsx` (unmodified,
  imported and composed by the new component), `shipping-rule-form-card.tsx`,
  `tax-rules-dialog.tsx`, both pages' data-fetching/mutation logic.
- No API, schema, or PHP changes.
