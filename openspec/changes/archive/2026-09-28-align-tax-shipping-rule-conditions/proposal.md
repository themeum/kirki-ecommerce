## Why

Tax rule condition options are inconsistent across the tax region strategies with no
documented reason: the general country page and the EU page silently share one default
condition list, the general state page explicitly overrides to a smaller list, and a
second, independent hardcoded restriction forces every rule's second condition row to
`tax_profile` regardless of what the page allows. Separately, the frontend's condition/
action option lists for both tax and shipping rules have drifted from the backend
decision registry (`config/decisions.php`): the tax action list is missing
`set_shipping_tax_rate`, and the shipping condition list has a `cart_subtotal` entry
mislabeled onto the `cart_weight` key and is missing `product_profile`. Left alone, this
class of drift will keep happening as new conditions/actions are added to the backend
registry without a clear, enforced mapping of which ones a given rule-authoring surface
should expose.

- Registering a condition type in `config/decisions.php` is not the same as it being
  usable: `product_profile` is registered but the tax and shipping calculation contexts
  never populate a value for it anywhere in `app/`, so a rule built against it could
  never match. Exposing it in either rule editor's condition list — even with a working
  value picker — would be a real correctness bug, not just a smaller inconsistency.

## What Changes

- Tax rules: expose one uniform condition list — `tax_profile`, `destination_region`,
  `product_categories` — and one uniform action list — `set_product_tax_rate`,
  `set_shipping_tax_rate`, `set_product_tax_exempt` — across all three tax region
  strategy pages (general country, general state, EU). Remove the general-state page's
  restricted condition list and its use of the narrower option set.
- Wire the `product_categories` condition's value picker for tax rules (it had no
  value-selection support at all before this change), sourced from the store's product
  categories and keyed by category id, matching what the tax calculation context
  actually compares against.
- Remove the hardcoded rule that forces a rule's second condition row to `tax_profile`
  only, so every condition row on a tax rule offers the same uniform list.
- Shipping rules: fix the `cart_subtotal` condition being mislabeled onto the
  `cart_weight` key, and fix the `product_categories` condition's value being keyed as
  `product_category` (singular) — a mismatch against the backend's registered key that
  made the condition unresolvable — producing a uniform 5-condition list
  (`destination_region`, `cart_weight`, `cart_subtotal`, `shipping_profile`,
  `product_categories`). `product_profile` is deliberately not added here either, for
  the same dead-condition reason above. The shipping action list gains the previously
  missing `multiply_shipping_cost`.
- No API changes: the frontend option lists stay hardcoded (not derived from an
  endpoint), per project decision — this change re-aligns them with what
  `config/decisions.php` registers **and** what the tax/shipping calculation contexts
  actually populate. One backend fix was in scope after all:
  `ProductCategoryCondition::evaluate()` compared the whole category-id array against
  a single scalar value, which is always `false` in PHP regardless of what the value
  is, so this condition could never match; fixed to loop over the array element-wise,
  the same pattern `ShippingProfileCondition` already uses.
- Shipping's `product_categories`/`shipping_profile` conditions stored the selected
  record's **name** as the condition value, but the backend compares against **ids** —
  fixed to store the id, and added id→name resolution to the shipping rule list's
  summary text so this didn't regress the merchant-facing display.

## Capabilities

### New Capabilities

- `tax-rule-conditions`: The set of decision conditions and actions available when
  authoring a tax rule, uniform across all tax region strategies (general country,
  general state, EU).
- `shipping-rule-conditions`: The set of decision conditions and actions available when
  authoring a shipping method rule.

### Modified Capabilities

(none — `tax-region-strategies` and `shipping-settings` govern structure and UI
behavior, not which specific conditions/actions populate a rule's option lists, so
neither's existing requirements change)

## Impact

- `resources/app/features/settings/tax/shared/lib/utils.ts` — condition/action option
  arrays for tax rules
- `resources/app/features/settings/tax/shared/lib/tax-rules/helper.ts` — action label
  for `set_shipping_tax_rate`
- `resources/app/features/settings/tax/shared/components/tax-rules/tax-rules.tsx`,
  `tax-rule-form-card.tsx`, `condition-row.tsx` — drop the `conditionOptions` prop
  threaded through all three (now imported directly), drop the hardcoded second-row
  restriction, wire the `product_categories` value picker
- `resources/app/features/settings/tax/strategies/general/pages/general-edit-region-state.tsx`
  — drop the restricted condition list override
- `resources/app/features/settings/shipping/lib/utils.tsx` — condition/action option
  arrays for shipping rules
- `resources/app/features/settings/shipping/lib/shipping-rules/rule-form.ts`,
  `shipping-rule-form-card.tsx` — fix the `product_category` → `product_categories` key
  mismatch this change surfaced, and store condition values by id instead of name
- `resources/app/features/settings/shipping/pages/shipping-method/shipping-rules/shipping-rules.tsx`
  — id→name resolution for the rule list's condition value summary
- `resources/app/features/settings/tax/shared/lib/tax-rules/helper.ts`,
  `tax-rules.tsx` — id→name resolution for `product_categories` in the tax rule list
- `app/Decisions/Conditions/ProductCategoryCondition.php` — evaluate against each
  category id individually instead of comparing the whole array to a scalar
- Corresponding test updates in `resources/app/features/settings/shipping/tests/`
- No changes to `config/decisions.php`
