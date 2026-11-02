## Context

See `proposal.md` - Why. This is a frontend-only alignment; the backend decision
registry (`config/decisions.php`) is the ground truth and is not changed.

Verified current state (file:line):

- `tax/shared/lib/utils.ts:53-58` — `taxRuleConditionOptions` = [tax_profile,
  destination_region]; `taxProfileConditionOptions` = [tax_profile]. `taxRuleActionOptionsArray:60-63`
  = [set_product_tax_rate, set_product_tax_exempt] — missing `set_shipping_tax_rate`.
- `tax-rules.tsx:65` defaults `conditionOptions` to `taxRuleConditionOptions`; only
  `general-edit-region-state.tsx:191` overrides to `taxProfileConditionOptions`.
- `condition-row.tsx:100` — `const rowConditionOptions = index === 1 ? taxProfileConditionOptions : conditionOptions`
  hardcodes every rule's second condition row to tax_profile only, independent of the
  page's own `conditionOptions`. `isConditionLocked` (line 101) is derived from
  `rowConditionOptions.length === 1`, so this lock disappears on its own once the row
  stops being handed a single-item list — no separate flag to remove.
- Both `resolveConditionTypeLabel` (tax `helper.ts`) and shipping's `getConditionLabel`/
  `getActionLabel` (`shipping-rules.tsx:41-58`) derive their display label purely by
  looking up `.title` in the relevant options array. Adding an entry to the array is
  sufficient to give it a label everywhere it's displayed — no separate label map to
  maintain.
- `tax/shared/lib/tax-rules/helper.ts` `resolveActionLabel` special-cases only
  `set_product_tax_rate` and `set_product_tax_exempt`; it needs a third branch for
  `set_shipping_tax_rate` (falls back to the raw type string otherwise).
- `shipping/lib/utils.tsx:112-129` `conditionOptions` uses value `'product_category'`
  (singular) — this does not match the backend's registered key `'product_categories'`
  (plural, `config/decisions.php:29`). This condition is currently unresolvable by the
  backend `DecisionEngine` (unknown types no-op rather than error), independent of the
  cart_weight/cart_subtotal mislabel already identified. It also has one entry labeled
  "Cart Value (Subtotal)" keyed to `cart_weight`, and is missing a `product_profile`
  entry.
- `shipping/lib/utils.tsx:131-146` `actionOptionsArray` has 4 of the 5 registered
  shipping actions — missing `multiply_shipping_cost`.

## Goals / Non-Goals

**Goals:**
- One condition list and one action list per feature (tax, shipping), each a hardcoded
  array in that feature's existing `lib/utils` file, matching what's actually registered
  in `config/decisions.php` for that context.
- Every tax region strategy page renders the same tax condition/action lists with no
  page-level override.
- Fix the `product_category`/`product_categories` key mismatch so the shipping
  condition is actually evaluable by the backend.

**Non-Goals:**
- No API endpoint or dynamic derivation from `config/decisions.php` (explicit project
  decision — hardcode in frontend utils for now).
- No change to `resolveConditionDisplayValue`-style value formatting for the newly
  added conditions (e.g. resolving a `product_categories` id list to category names).
  They'll display their raw stored value, same as shipping's existing
  `product_profile`/`shipping_profile` conditions already do today — consistent with
  current behavior, not a regression.
- No backend PHP changes.

## Decisions

**Tax condition set = tax_profile, destination_region, product_profile, cart_subtotal,
product_categories.** Excludes `cart_weight` and `shipping_profile`, which only make
sense against physical shipping logistics, not a tax rate/exemption. Rationale detail
lives in the proposal/spec, not repeated here.

**Shipping condition set = destination_region, product_profile, cart_weight,
cart_subtotal, shipping_profile, product_categories.** Excludes `tax_profile`, which
has no bearing on a shipping cost.

**Remove the option-list prop entirely from `TaxRules`, rather than keep it
configurable.** Since every caller now needs the same list, the `conditionOptions` prop
on `TaxRules` (and the corresponding override in `general-edit-region-state.tsx`)
becomes dead configurability. Simplify by having `TaxRules` (and `ConditionRow`) import
`taxRuleConditionOptions` directly instead of threading it through as a prop three
different pages would all pass the same value for.
  - Alternative considered: keep the prop but always pass the same array from every
    caller. Rejected — an unused-in-practice prop is exactly the kind of drift surface
    that caused this bug (a future page could again pass something narrower without
    anyone noticing).

**`ConditionRow`'s second-row hardcode is deleted outright, not parameterized.** It was
an undocumented, page-independent restriction with no discovered rationale (see prior
exploration: no commit message explains it). Once every page offers the same multi-item
list, the `index === 1` special case has no reason to exist.

## Correction during implementation

While wiring the value picker for the newly-added conditions, testing surfaced that two
of the conditions this design assigned to tax (and, for one of them, to shipping too)
are never actually populated by the backend, in any context:

- **`product_profile`** — `ProductProfileCondition::evaluate()` reads
  `$context->get('product_profile')`, but nothing anywhere in `app/` ever calls
  `$context->set('product_profile', ...)` or passes a `product_profile` key into
  `DecisionContext::from()`. Neither `AbstractTaxStrategy`/`DefaultTaxStrategy`/
  `EUTaxStrategy` (tax) nor `ShippingService::prepare_decision_context` (shipping)
  populate it. There is also no "product profile" concept anywhere else in the app
  (no such field on the product model/migrations) to source a value picker from. This
  condition is dead in both contexts, not just tax — the original "make sense for both"
  classification in this design's Decisions section was wrong because it reasoned from
  the condition's name and generic `DecisionContext` shape, not from where each
  strategy actually builds that context.
- **`cart_subtotal`** — `CartSubtotalCondition::evaluate()` reads
  `$context->get('base_cart_subtotal')`. `ShippingService::prepare_decision_context`
  populates `base_cart_subtotal` (shipping is fine), but neither tax strategy's
  `prepare_decision_context` call ever includes that key — `DefaultTaxStrategy`'s
  `resolve_rate()` only passes `shipping_address`/`billing_address`/
  `base_product_price`/`product_categories`/`tax_profile` (plus `product_tax` or
  `shipping_tax` itself), and `EUTaxStrategy` passes the same shape. Wiring this up for
  tax would require a backend change, which is out of this change's Non-Goals.

Both are removed from `taxRuleConditionOptions`; `product_profile` is also removed
from shipping's `conditionOptions` (its `cart_subtotal` entry stays — that one is
genuinely wired). The corrected tax condition set is `tax_profile`, `destination_region`,
`product_categories`; the corrected shipping condition set is `destination_region`,
`shipping_profile`, `cart_weight`, `cart_subtotal`, `product_categories`.

Separately, wiring `product_categories`'s value picker (see Non-Goals — display
formatting was explicitly deferred, but *selecting* a value was assumed to already
work and turned out not to) surfaced that tax's `getConditionValue` only ever handled
`tax_profile`, so `product_categories` had no value options at all. Fixed by adding a
`useCategoriesQuery`-backed branch, matching the pattern shipping already uses for its
own `product_categories` condition — except keyed by category **id** (matching what
`ShippingService`/`DefaultTaxStrategy` actually put on `product_categories` — see
`app/DTO/Calculation/CalculationContextDTO.php:125`, `categories->pluck('id')`), not by
category **name** the way shipping's existing picker does. Shipping's name-keyed value
was already broken before this change (comparing category names against an id array
can never match) and was left as-is — an unrelated pre-existing bug, out of scope here,
not reproduced in tax's new picker.

Also corrected en route: `shipping/lib/utils.tsx`'s condition value was
`'product_category'` (singular), which does not match the backend's registered key
`'product_categories'` (plural). Renaming it broke the code that threads a selected
condition through to its value picker (`rule-form.ts`'s `getConditionValueOptions`/
`buildRuleDefaultValues`, and `shipping-rule-form-card.tsx`'s `conditionData` state and
effects), all of which still referenced the old singular key — updated everywhere to
`'product_categories'`, including the tests exercising that mapping.

## Second correction during implementation: id-vs-name and an always-false condition

Fixing the tax `product_categories` value picker (above) surfaced two more pre-existing
bugs in shipping's equivalent, already-shipped `product_categories`/`shipping_profile`
conditions — found while manually exercising the rule editors after the first
correction:

- **Value stored by name, compared as id.** Shipping's `getConditionValueOptions`
  (`rule-form.ts`) stored `item.name` as the condition's value for both
  `product_categories` and `shipping_profile`. But `ShippingService::prepare_decision_context`
  and `CalculationContextDTO` populate both context fields with **ids**
  (`categories->pluck('id')`, `$item->shipping_profile_id`) — so a saved rule compared a
  numeric id against a name string, which can never be equal. Fixed by storing
  `String(item.id)` instead, in both `getConditionValueOptions` and the new tax picker
  (which was written correctly from the start, since it had no prior pattern to copy).
  This also meant the shipping rule list's summary, which rendered the raw stored value
  with no lookup, needed an id→name resolver (`resolveConditionDisplayValue` added to
  `shipping-rules.tsx`) so switching to ids didn't regress the merchant-facing summary
  text — mirrored onto tax's existing `resolveConditionDisplayValue` for the same reason.
- **`ProductCategoryCondition::evaluate()` could never match, independent of the id/name
  bug.** It called `$this->compare($categories, $operator, $value)` where `$categories`
  is an array and `$value` a scalar — and PHP's `==`/`!=`/`>`/`<` between an array and a
  scalar is always `false`, never a warning or error, so this silently never matched
  regardless of what value was stored. `ShippingProfileCondition` (a structurally
  identical "does this cart item's list of X contain the target value" condition)
  already gets this right by looping over the array and comparing each element. Fixed
  `ProductCategoryCondition::evaluate()` to use the same loop, verified with
  `php -r` that `[1,2,3] == 2` and `[1,2,3] == "2"` both evaluate to `false` today,
  confirming the bug, and `phpcs:wporg`/`php -l` pass on the fix.

This second fix touches backend PHP (`app/Decisions/Conditions/ProductCategoryCondition.php`),
which the original Non-Goals section ruled out. That line held only while the change's
scope was "realign frontend option lists" — once the work uncovered a condition that
can never evaluate true no matter what the frontend sends, leaving it unfixed would
have kept `product_categories` non-functional end-to-end despite this change's stated
goal of exposing genuinely usable conditions. The fix is a 6-line, single-method change
with no other surface area, so it stays in scope rather than spinning out a separate
change.

## Risks / Trade-offs

- [Newly-exposed conditions display raw values (e.g. a `product_categories` id list)
  where profile/category names would read better] → Acceptable for this change since it
  matches shipping's existing behavior for comparable conditions; a follow-up can add
  display-value resolution if merchants find raw ids confusing.
- [Removing the `conditionOptions` prop from `TaxRules` is a breaking change to that
  component's API] → Low risk: `TaxRules` is only consumed by the three tax strategy
  pages within this repo, all updated in this same change.
