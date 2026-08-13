## 1. `RuleItems` primitive

- [x] 1.1 Create `resources/app/components/shared/rule-items.tsx`. `RuleItems`:
  `forwardRef`, `cssOverride` prop, renders `StackedItems` (from
  `@/components/ui/stacked-items`) internally with no new container CSS.
- [x] 1.2 `RuleItem`: `forwardRef`, required `id: string` prop, `cssOverride`,
  renders `StackedItem` internally (forwarding `id`). **Correction:** does
  *not* auto-wrap children in `StackedItemContent` — `StackedItem` needs
  `StackedItemContent`/`StackedItemActions` as direct flex-row siblings (per
  the existing `StackedItem` call-site convention, e.g.
  `schema-profile.tsx`), so auto-wrapping everything including the actions
  slot into one column would break `ActionGroup`'s `margin-left: auto`
  right-alignment and the row layout. Added a new `RuleItemContent` (1.2b)
  thin wrapper over `StackedItemContent` instead, composed explicitly by
  the caller alongside `RuleItemActions`, matching `StackedItem`'s existing
  compound convention exactly.
- [x] 1.2b (added) `RuleItemContent`: `forwardRef` thin wrapper over
  `StackedItemContent`, own `cssOverride` adding `gap: theme.spacing[4]`
  between the badge and the conditions/action block.
- [x] 1.3 `RuleItemBadge`: `forwardRef`, renders a small pill (own
  `defineStyles`: padding, radius, `theme.colors.background.surfaceSecondary`)
  wrapping arbitrary `children`. **Correction:** does not hardcode a
  lightning icon — shipping (`LighteningIcon` from `@/icons`) and tax
  (`LightningBoltIcon` from `@radix-ui/react-icons`) use different icon
  components today, so baking one in would force one page to change icons
  unrequested. The icon is caller-composed content, same as the label text.
- [x] 1.4 `RuleItemConditions`: `forwardRef`, a column layout wrapper (own
  `defineStyles`, `gap: theme.spacing[2]`) for one or more `RuleItemCondition`
  children.
- [x] 1.5 `RuleItemCondition`: `forwardRef`, renders a single condition line
  (row layout, own `defineStyles`) wrapping arbitrary `children` — the
  caller renders its own label/value `Text` nodes (accent-colored value
  styling stays the caller's responsibility via `cssOverride`/children, not
  hardcoded in this component, since shipping and tax already format labels
  differently).
- [x] 1.6 `RuleItemAction`: `forwardRef`, renders the action line (same row
  layout as `RuleItemCondition`, own `defineStyles`), wrapping arbitrary
  `children`.
- [x] 1.7 `RuleItemActions`: `forwardRef` thin wrapper rendering
  `StackedItemActions` internally (naming symmetry only, no new behavior).
- [x] 1.8 Export `RuleItems`, `RuleItem`, `RuleItemContent`, `RuleItemBadge`,
  `RuleItemConditions`, `RuleItemCondition`, `RuleItemAction`,
  `RuleItemActions` as named exports plus their prop types, matching
  `stacked-items.tsx`'s export shape. No default export.
- [x] 1.9 Run `npm run typecheck && npm test` from `resources/app/`. Clean
  typecheck, 280/280 tests pass.

## 2. Migrate `shipping-rules.tsx`

- [x] 2.1 In `resources/app/pages/settings/shipping-settings/shipping-method/shipping-rules/shipping-rules.tsx`,
  replace the per-row `Card`/`CardContent`/`Flex`/`Text`/`ActionGroup` markup
  (lines ~157-234) with `RuleItems` wrapping a `.map()` over `rulesObj`
  producing `RuleItem id={String(index)}` rows: `RuleItemBadge` for the
  "Rule N" badge (keep the existing `LighteningIcon` and `sprintf(__('Rule
  %s', ...), index + 1)` text), `RuleItemConditions` > `RuleItemCondition`
  for the existing single `conditions[0]` line (using the existing
  `getConditionLabel`/`getOperatorLabel` helpers, unchanged), `RuleItemAction`
  for the existing action line (`getActionLabel`, unchanged), and
  `RuleItemActions` wrapping the existing edit/delete `Button`s.
- [x] 2.2 Remove `hoveredRuleIndex` state and its `onMouseEnter`/
  `onMouseLeave` handlers — `RuleItemActions` inherits hover/focus reveal
  from `StackedItem`. Removed the now-unused `shippingRulesCard`,
  `shippingRulesCardSingle`, `shippingRulesCardBorderRadius`,
  `rulesNumberBadge`, `cardActions`, `cardActionsActive` styles and the
  `mergeCss`/`css` imports. **Correction:** `cardStyles` is still imported —
  the outer `<Card cssOverride={cardStyles.formCard}>` page wrapper (unrelated
  to the row markup) still uses it. Kept `accentText`; not moved into
  `rule-items.tsx` since the primitive deliberately doesn't own value-color
  styling (see design.md's "no text formatting inside the primitive"
  decision). Everything unrelated to row markup (data fetching, delete/undo
  toast, `ShippingRuleFormCard` add/edit wiring) untouched.
- [x] 2.3 Run `npm run typecheck && npm test` from `resources/app/`. Clean
  typecheck, 280/280 tests pass.

## 3. Migrate `tax-rules.tsx`

- [x] 3.1 In `resources/app/pages/settings/tax-settings/tax-region/tax-rules/tax-rules.tsx`,
  replace the per-row `Card`/`CardContent`/`Flex`/`Badge`/`Text`/
  `ActionGroup` markup (lines ~86-169) with `RuleItems` wrapping a `.map()`
  over `rulesObj` producing `RuleItem id={String(index)}` rows:
  `RuleItemBadge` for the existing "Rule N" badge (keep
  `LightningBoltIcon`), `RuleItemConditions` looping `item.conditions.map()`
  into one `RuleItemCondition` per condition (keep the existing "IF"/
  "AND IF" `sprintf` logic and `getDestinationDisplayValue` call unchanged),
  `RuleItemAction` for the existing action line, and `RuleItemActions`
  wrapping the existing edit/delete `Button`s. Keep the conditional
  `TaxRulesDialog` render for `editingRuleIndex === index` exactly where it
  is today (inside the row, sibling to the row's visible content).
- [x] 3.2 Removed the `data-card-action-group`-based `cardActions`/
  `shippingRulesCard` hover styles — `RuleItemActions` inherits hover/focus
  reveal from `StackedItem`. Removed the now-unused `mergeCss`/`scoped`/
  `Badge` imports; `cardStyles` is kept (still used by the outer
  `<Card cssOverride={cardStyles.formCard}>` page wrapper). **Correction:**
  kept `conditionValue` local to this file rather than unifying with
  `shipping-rules.tsx`'s `accentText` — both are already identical
  one-liners (`color: theme.colors.text.special3`) and the primitive
  intentionally doesn't own value-color styling (see design.md), so a
  shared constant would be a speculative abstraction for two call sites,
  not requested. Everything unrelated to row markup (data fetching,
  delete/undo toast, `TaxRulesDialog` add/edit wiring) untouched.
- [x] 3.3 Run `npm run typecheck && npm test` from `resources/app/`. Clean
  typecheck, 280/280 tests pass.

## 4. Verification

- [x] 4.1 Opened the running app (existing dev server + Docker WP backend)
  against real data: Shipping Method Rules for "Express Delivery" (1 rule)
  and Tax Rules for the "Bangladesh" region (2 rules, one multi-condition).
  **Correction:** no seeded shipping method currently has 2+ rules, so the
  divider-between-rows case was verified on the Tax Rules page (same
  underlying `RuleItems`/`StackedItem` primitive) rather than on Shipping
  Method Rules specifically.
- [x] 4.2 Verified headlessly via computed styles (not a visual screenshot
  comparison): container has `border: 1px solid`, `overflow: hidden`,
  `border-radius: 6px`; with 2 rows, row 1 has top radius only and a solid
  divider `border-bottom`, row 2 has bottom radius only and a transparent
  `border-bottom`. Matches the reference mockup exactly. Also confirmed
  visually via screenshot on the Tax Rules page.
- [x] 4.3 Verified headlessly: each row's `ActionGroup` is `opacity: 0;
  pointer-events: none; position: absolute` at rest, and flips to
  `opacity: 1; pointer-events: auto` only while that specific row matches
  `:hover` — confirmed independently on both rows of the 2-rule Tax Rules
  case (hovering row 2 left row 1's actions hidden). Keyboard-focus reveal
  and no-layout-shift are inherited unmodified from `StackedItem`, already
  covered by its own spec/tests; not independently re-verified here.
- [ ] 4.4 Confirm shipping rules' inline `ShippingRuleFormCard` swap-in-place
  edit and tax rules' `TaxRulesDialog` modal edit both still work unchanged.
  **Not completed this session** — interrupted mid-check (had just clicked
  the edit icon on the Tax Rules page when archiving was requested).
  `restructure-app-features` moved both components (now
  `features/settings/shipping/pages/shipping-method/shipping-rules/shipping-rule-form-card.tsx`
  and `features/settings/tax/pages/tax-region/tax-rules/tax-rules-dialog.tsx`) without behavioral
  change — run this check against the restructured tree.
- [ ] 4.5 Confirm delete + undo-toast still works on both pages. **Not
  completed this session.** Same relocation note as 4.4 — unaffected, run against the
  restructured tree.
- [x] 4.6 Confirmed via `get_page_text` on the Bangladesh tax region: Rule 1
  renders one condition line, Rule 2 renders one condition line (region has
  no rule with 2+ conditions in seed data, so the "AND IF" line specifically
  wasn't exercised, though the `.map()` over `conditions` is unchanged from
  the pre-migration code). Shipping rules' single-condition rendering is
  unchanged code (`conditions[0]` only), not independently re-verified.
- [x] 4.7 Final `npm run typecheck && npm test` from `resources/app/`.
  Clean typecheck, 280/280 tests pass. (An unrelated pre-existing
  `tax-rate-list.tsx` typecheck error observed earlier in this session was
  resolved by an out-of-band edit to that file and no longer reproduces.)
