## Context

Two independent, drifted implementations render the same rule-card pattern:

- `shipping-rules.tsx`: rows in a `Flex direction="column" gap={4}`, each row
  a `Card` with `cardStyles.formCard`-derived styles, first/last-of-type
  radius overrides applied only when `rulesObj.length > 1`, action buttons
  shown via a JS-tracked `hoveredRuleIndex` state toggling an `ActionGroup`'s
  `display`. Badge is a `Card` styled with `cardStyles.darkCard`. Only
  `item.conditions[0]` is ever rendered (no loop over multiple conditions).
- `tax-rules.tsx`: rows as bare `Card cssOverride={cardStyles.formCard}`
  siblings inside a plain `<div>` (no gap at all between them), badge is
  `Badge`, action buttons revealed via a `:hover [data-card-action-group]`
  CSS selector (no JS state), and it does loop `item.conditions.map(...)`
  for "IF"/"AND IF" lines.

Neither reproduces the reference mockup provided with this request: one
bordered container, hairline dividers between rows, rounded outer corners
only, edit/delete icons that fade in on hover positioned at the row's
vertical center. That is exactly what
`resources/app/components/ui/stacked-items.tsx` (`StackedItems`/
`StackedItem`) already implements and already has a spec for
(`openspec/specs/stacked-items/`, from the archived
`2026-07-31`-era `stacked-items-primitive` change) — bordered group,
`:first-of-type`/`:last-of-type` radius, `:not(:last-of-type)` divider
border, and `[data-action-group="true"]` absolute-positioned, opacity-faded
action buttons revealed on `:hover`/`:focus-within`/`data-actions-open`.

See `proposal.md` - Why for the drift problem this replaces.

## Goals / Non-Goals

**Goals:**
- One `resources/app/components/shared/rule-items.tsx` compound family that
  both pages compose for the row markup, with the container/divider/radius/
  hover-reveal mechanics delegated to `StackedItems`/`StackedItem` (zero new
  CSS for those concerns).
- Match the reference mockup's visual: single bordered container, dividers,
  rounded outer corners, hover-reveal actions vertically centered on the
  right.
- Preserve each page's existing data/mutation/edit-wiring behavior exactly;
  only the read-only row markup and its immediate hover-state plumbing
  change.

**Non-Goals:**
- Changing `StackedItems`/`StackedItem` themselves — reused as-is, unmodified.
- Fixing the pre-existing behavior gap where `shipping-rules.tsx` only ever
  renders `conditions[0]` while `tax-rules.tsx` loops all conditions. The new
  primitive supports rendering multiple condition lines (tax's case); whether
  shipping-rules.tsx starts looping is a page-level data/behavior decision
  out of scope here — this change only carries forward each page's current
  number of rendered condition lines.
- A shared label-formatting helper between the two pages' `getConditionLabel`/
  `getOperatorLabel`/`getActionLabel` (shipping) and raw-value/
  `getDestinationDisplayValue` (tax) approaches — out of scope, and
  deliberately not centralized (see Decisions).

## Decisions

### `RuleItems`/`RuleItem` compose `StackedItems`/`StackedItem` rather than re-implementing container CSS

`RuleItems` renders `StackedItems` internally; `RuleItem` renders
`StackedItem` internally (forwarding the required `id` prop). Alternative
considered: a fully standalone container with its own border/divider/radius/
hover-reveal CSS, matching how `StackedItems` itself is standalone rather
than wrapping `Card`/`ItemGroup`. Rejected here — `StackedItems`'s reason for
owning its own CSS was that `Card`'s default `gap`/`paddingBlock` didn't fit
a tightly-packed row list at all; that objection doesn't apply to reusing
`StackedItems` itself, which is already exactly the tightly-packed bordered
list shape this component needs. Rebuilding it a third time is the literal
drift problem this change exists to close.

### Rule-specific content pieces, not `StackedItemMedia`/`Title`

A rule row's content (numbered badge, N condition lines, one action line)
doesn't fit `StackedItemMedia`/`StackedItemContent`/`StackedItemTitle`
(icon + single-line title). New subcomponents: `RuleItemBadge`,
`RuleItemConditions` (layout wrapper for condition lines),
`RuleItemCondition` (one condition line), `RuleItemAction` (the action line).
Each renders inside `StackedItemContent` for layout, but owns its own
`defineStyles` for spacing/typography specific to the rule-card shape (badge
pill padding/radius, condition/action line gap, accent-colored value text).
`RuleItemActions` is a thin re-export-style wrapper over `StackedItemActions`
(no new behavior, kept for naming symmetry with the rest of the family and
so callers only ever import from `rule-items.tsx`).

### No text formatting inside the primitive; children only

`RuleItemBadge`/`RuleItemCondition`/`RuleItemAction` accept arbitrary
`children` (already-formatted `Text`/string nodes), matching every existing
`Stacked*` subcomponent. Alternative considered: accept a typed `label`/
`value`/`operator` prop set and format internally. Rejected — `tax-rules.tsx`
and `shipping-rules.tsx` already build these labels through two different,
page-specific helper functions (`conditionOptions`/`actionOptionsArray`
lookups vs raw `condition.type`/`getDestinationDisplayValue`); baking one
formatting convention into the shared component would force one page to
adapt its data shape to the other, which is out of scope and not requested.
This also matches the `stacked-items-primitive` precedent directly (see its
proposal's "Why" on the data-array-plus-handler-map anti-pattern).

### No `useRuleItem()` hook

Unlike `StackedItem` (which exposes `useStackedItem()` for a nested kebab
`DropdownButton` to read/toggle its own row's open state), rule rows in both
current pages show edit/delete as directly-visible buttons on hover — no
per-row dropdown menu with persistent open state. `RuleItem` still forwards
`id` to the underlying `StackedItem` (required for the divider/radius CSS
selectors to key correctly and to keep the door open if a kebab menu is
ever needed), but no new hook is exported. Alternative considered: export a
`useRuleItem()` alias for API symmetry. Rejected as speculative — no current
caller needs it.

### Both pages drop their own hover-state plumbing

`shipping-rules.tsx`'s `hoveredRuleIndex` `useState` and `tax-rules.tsx`'s
`data-card-action-group` CSS selector are both removed; `RuleItemActions`
inherits `StackedItem`'s existing `:hover`/`:focus-within`/
`data-actions-open` reveal behavior for free. Neither page has a kebab menu
here, so `data-actions-open` never gets set explicitly by either call site —
it's inert plumbing inherited from `StackedItem`, not newly wired.

**Correction during implementation**: if `StackedItem`'s `size="sm"`
(min-height 42px, `theme.spacing[2]`/`[3]` padding) turns out to visually
clip or crowd a 2-3 line rule row once implemented in the browser, record
the actual adjustment here (e.g. a `cssOverride` on `RuleItem` loosening
padding) rather than silently diverging from this plan.

## Risks / Trade-offs

- **[Risk]** `StackedItem`'s hover-reveal CSS positions `[data-action-group="true"]`
  absolutely, vertically centered — tuned for `StackedItems`'s existing
  single-line rows. A 2-3 line rule row could make that centering look
  different than the reference mockup once rendered. → **Mitigation**:
  `tasks.md` includes a manual visual check against the mockup before
  considering the row markup done; adjust with a `cssOverride` on `RuleItem`
  if needed rather than forking `StackedItem`'s CSS.
- **[Risk]** Dropping `shipping-rules.tsx`'s `hoveredRuleIndex` state and
  `tax-rules.tsx`'s bespoke CSS selector in favor of `StackedItem`'s
  built-in reveal could change edge-case behavior (e.g. touch devices,
  keyboard-only navigation) on either page. → **Mitigation**: `StackedItem`'s
  reveal behavior is already shipped and specified
  (`openspec/specs/stacked-items/`) at 11 other call sites; this change
  inherits, not invents, that behavior.
- **[Risk]** Only carrying forward `shipping-rules.tsx`'s single-condition
  rendering (rather than fixing it to loop, like tax does) means the two
  pages remain visibly inconsistent for multi-condition shipping rules.
  → **Mitigation**: explicitly out of scope (see Non-Goals); flagged here so
  it isn't mistaken for an oversight.

## Migration Plan

Single-PR change, no feature flag — internal component addition plus a
two-page markup swap, no API/schema changes. Verified by
`npm run typecheck && npm test` plus a manual visual pass on both Shipping
Method Rules and Tax Rules against the reference mockup (per `tasks.md`).
Rollback is a plain git revert if a regression surfaces.
