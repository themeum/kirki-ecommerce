## 1. Tax rule conditions and actions

- [x] 1.1 In `resources/app/features/settings/tax/shared/lib/utils.ts`, replaced
      `taxRuleConditionOptions` and removed `taxProfileConditionOptions`. Originally
      built as a 5-entry list (tax_profile, destination_region, product_profile,
      cart_subtotal, product_categories) per design.md, then corrected to 3 entries
      (tax_profile, destination_region, product_categories) once implementation
      surfaced that `product_profile` and `cart_subtotal` are never populated by the
      tax calculation context — see design.md "Correction during implementation".
- [x] 1.2 Add `set_shipping_tax_rate` to `taxRuleActionOptionsArray` in the same file.
- [x] 1.3 In `resources/app/features/settings/tax/shared/lib/tax-rules/helper.ts`, add a
      `set_shipping_tax_rate` branch to `resolveActionLabel`.
- [x] 1.4 Removed the `conditionOptions` prop from `TaxRules`, `TaxRuleFormCard`, and
      `ConditionRow` (threaded through all three, not just `TaxRules`); `ConditionRow`
      now imports `taxRuleConditionOptions` directly.
- [x] 1.5 In `condition-row.tsx`, removed the
      `index === 1 ? taxProfileConditionOptions : conditionOptions` special case so
      every row uses the same condition list.
- [x] 1.6 In `general-edit-region-state.tsx`, removed the explicit
      `conditionOptions={taxProfileConditionOptions}` prop (and its now-unused import)
      from the `<TaxRules>` usage.
- [x] 1.7 Verified `edit-region-eu.tsx` and the general country-level page need no prop
      changes — grepped the whole tax feature for `conditionOptions`/
      `taxProfileConditionOptions`, no references remain outside the removed ones.
- [x] 1.8 `npm run typecheck && npm test` — both pass (150 files, 1319 tests).

## 2. Shipping rule conditions and actions

- [x] 2.1 In `resources/app/features/settings/shipping/lib/utils.tsx`, fixed the
      `product_category` condition value to `product_categories`, matching the backend
      registry key.
- [x] 2.2 Relabeled the entry previously titled "Cart Value (Subtotal)" (keyed to
      `cart_weight`) to "Cart Weight", and added a new entry keyed `cart_subtotal`
      titled "Cart Subtotal".
- [x] 2.3 Originally added a `product_profile` entry to `conditionOptions`, then
      removed it — same dead-condition finding as tax's 1.1 correction: nothing in
      `ShippingService::prepare_decision_context` ever populates a `product_profile`
      value either.
- [x] 2.4 Added `multiply_shipping_cost` ("Multiply Price") to `actionOptionsArray`.
- [x] 2.5 `npm run typecheck && npm test` — both pass (150 files, 1319 tests).

## 3. Correction: dead conditions and a regression found while testing manually

- [x] 3.1 Removed `product_profile` from both `taxRuleConditionOptions` and shipping's
      `conditionOptions`, and removed `cart_subtotal` from `taxRuleConditionOptions` —
      see design.md "Correction during implementation" for the evidence (no code path
      anywhere populates `product_profile`; the tax calculation context never
      populates `base_cart_subtotal`).
- [x] 3.2 Wired the `product_categories` condition's value picker in
      `tax-rule-form-card.tsx` (`getConditionValue`), using `useCategoriesQuery` keyed
      by category id — this condition previously had no value-selection support in the
      tax rule editor at all.
- [x] 3.3 Fixed the `product_category` → `product_categories` regression that task 2.1
      introduced: `rule-form.ts` (`buildRuleDefaultValues` fallback,
      `getConditionValueOptions` switch) and `shipping-rule-form-card.tsx`
      (`conditionData` state key, its loading effect and switch) still referenced the
      old singular key, so the shipping product-category value picker would have
      silently stopped working. Updated both files and their tests
      (`rule-form.test.ts`, `shipping-rule-form.test.ts`) to the corrected key.
- [x] 3.4 `npm run typecheck && npm test` — both pass (150 files, 1319 tests).

## 4. Correction: id-vs-name values and an always-false backend condition

- [x] 4.1 Fixed `app/Decisions/Conditions/ProductCategoryCondition.php`: `evaluate()`
      compared the whole category-id array against a single scalar value via
      `Condition::compare()`, which is always `false` for an array-vs-scalar `==`/`!=`/
      `>`/`<` in PHP — this condition could never match, independent of the id/name
      issue below. Rewrote it to loop over each category id and compare individually,
      matching `ShippingProfileCondition`'s existing pattern. Verified with `php -l`
      and `composer phpcs:wporg`.
- [x] 4.2 Fixed `rule-form.ts`'s `getConditionValueOptions`: shipping's
      `product_categories`/`shipping_profile` conditions stored the selected record's
      **name** as the value, but the backend context populates and compares **ids**
      (`categories->pluck('id')`, `$item->shipping_profile_id`) — changed to store
      `String(item.id)`. Updated `rule-form.test.ts`'s two affected assertions.
- [x] 4.3 Added `resolveConditionDisplayValue` to `shipping-rules.tsx` (id→name lookup
      via `useCategoriesQuery`/`useShippingProfilesQuery`) so the rule list's summary
      still shows a readable name now that the stored value is an id, not a name.
- [x] 4.4 Extended tax's `resolveConditionDisplayValue` (`helper.ts`) with the same
      id→name resolution for `product_categories`, and wired `useCategoriesQuery` into
      `tax-rules.tsx` to supply it — kept tax and shipping consistent now that both
      store category ids.
- [x] 4.5 `npm run typecheck && npm test` — both pass (150 files, 1319 tests).

## 5. Cleanup: leftovers from the condition-list changes

- [x] 5.1 In `condition-row.tsx`, remove the now-dead single-option lock: the
      `rowConditionOptions` alias, `isConditionLocked`, `lockedConditionValue`, the
      `useEffect` that forces the locked value, the `disabled`/`isConditionLocked`
      branches on the type `<Select>`, and the `lockedConditionTrigger` style.
      `taxRuleConditionOptions` always has 3 entries now, so this path can never run.
      Drop any imports this leaves unused (`useEffect`, `mergeCss`).
- [x] 5.2 In `shipping-rule-form-card.tsx`, load `product_categories` value data in one
      place: move it into the `switch` in the existing condition-data effect (replacing
      the empty `case 'product_categories': break`), add `categoryData` to that effect's
      deps, and delete the separate category-only effect (plus `categoryLoaded` if it
      becomes unused).
- [x] 5.3 `npm run typecheck && npm test` — both pass (150 files, 1319 tests).

## 6. Production hardening: value inputs, validation, and silent zero values

- [x] 6.1 Shipping `multiply_shipping_cost` had no value input and the schema dropped its
      value (`COST_ACTIONS` only listed set/add), so the backend multiplied by
      `floatval(null)` = 0 — free shipping. Added it to the value-bearing actions
      (`VALUE_ACTIONS` in `shipping-rule-form.ts`), the form card's value field, and the
      rule list summary.
- [x] 6.2 Tax `set_shipping_tax_rate` had no rate input, so it always saved 0. Shown the
      rate field for both rate actions (`RATE_ACTIONS` in `tax-rules-form.ts`) and in the
      rule list summary.
- [x] 6.3 Shipping `cart_subtotal` had no way to enter a value or choose an operator.
      It now gets the same operator select and numeric input as `cart_weight`
      (`NUMERIC_CONDITIONS`). Backend: `CartSubtotalCondition` compared the minor-unit
      `base_cart_subtotal` against a major-unit rule value — it now converts the value
      with `Money::of()` first, matching `SetShippingCostAction`.
- [x] 6.4 Changing a condition's type kept its previous value (and, for shipping, its
      operator) — with both categories and profiles now stored as ids, a tax profile id
      would silently become a category id. Type changes now reset the value (and
      shipping's operator to `=`); action changes reset the action value.
- [x] 6.5 Added validation: value-bearing actions require a number, `cart_weight`/
      `cart_subtotal` require a number, every other condition requires a value.
- [x] 6.6 Shipping tax is resolved with only the destination address in its decision
      context, so a `set_shipping_tax_rate` rule with any non-destination condition can
      never fire. The tax rule form now rejects that combination with an inline error.
- [x] 6.7 Shipping's operator fallback was `'is'`, which `Condition::compare()` rejects
      with an exception at checkout. Fallback is now `'='`.
- [x] 6.8 `npm run typecheck`, `npm test` (150 files, 1331 tests), eslint on the tax and
      shipping features, `php -l` and `composer phpcs:wporg` — all pass.
