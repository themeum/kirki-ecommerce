All commands run from `resources/app/`. Depends on `restructure-app-features` being archived — every path below assumes `features/<f>/`.

**Standing rule for this change:** a task is done when the logic has moved *and* its tests pass. Extraction without its tests is not a completable unit — `tsc` cannot tell an inverted condition from a correct one.

## 1. Test infrastructure

- [ ] 1.1 Add `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` and `msw` as devDependencies.
- [ ] 1.2 Split `vitest.config.ts` into two projects: `unit` (`environment: 'node'`, `include: ['**/*.test.ts']`, existing `vitest.setup.ts`) and `dom` (`environment: 'jsdom'`, `include: ['**/*.test.tsx']`, new `vitest.setup.dom.ts`).
- [ ] 1.3 Write `vitest.setup.dom.ts` populating `window.wp.i18n` and `window.kirki_ecommerce`. The existing `globalThis.window ??= {}` guard is a no-op under jsdom, where `window` already exists — the properties must be set explicitly or every module reading them at import time throws.
- [ ] 1.4 Prove the DOM project actually runs: add a `.test.tsx` that deliberately fails, confirm `npm test` fails, then correct it. A `.test.tsx` outside `include` reports success having executed nothing — verify before trusting anything.
- [ ] 1.5 Set up MSW with a shared server harness and per-feature handler files.
- [ ] 1.6 Verify: `npm run typecheck && npm test`. All 59 existing tests must still pass under the `unit` project, unchanged.

## 2. Orders — establish the pattern

Smallest end-to-end demonstration: the pure layer already exists in `features/orders/lib/`, so this commit shows the target shape without also inventing it.

- [ ] 2.1 Extract `features/orders/hooks/use-order-details.ts` from `order-details.tsx` (327L): the order query, the two mutations, the form instance, the form-reset effect, both dialog states, and the five handlers. Return a named result. Preserve hook call order exactly as it is in the component today.
- [ ] 2.2 Reduce `order-details.tsx` to markup plus the hook call, keeping its loading and error branches as presentational branching.
- [ ] 2.3 Extract `handleAddItems` (the ~18-line set-diff merge of picked variants) and the `displayByVariantId` / `rows` derivation from `order-create.tsx` into `features/orders/lib/order-items.ts`. Write tests: merging new selections into existing items, re-selecting an already-picked variant, removing a selection, and an empty selection.
- [ ] 2.4 Extract `features/orders/hooks/use-order-create.ts`: the debounced watch, the calculation payload derivation, the calculation query and the form wiring. Add a `renderHook` test for the debounce→payload→query path — the wiring itself is the risk here.
- [ ] 2.5 Verify: `npm run typecheck && npm test`.

## 3. Products

- [ ] 3.1 Extract the 45-line `handleSave` from `product-form.tsx` into `features/products/lib/save-result.ts`: server-error field matching, unmatched-error collection, and which field receives focus. Write tests covering a clean save, a save with matched field errors, one with unmatched errors, and one with both.
- [ ] 3.2 Extract the `showSimpleVariantSections` rule (`!hasVariants || !attributeValues || attributeValues.length === 0`) into `lib/` with tests — it is a domain rule currently expressed as an inline boolean.
- [ ] 3.3 Extract `features/products/hooks/use-product-form.ts`: form instance, submit orchestration, saving state, and the unsaved-changes wiring. `use-unsaved-navigation-guard.ts` is already correct — consume it, do not refactor it.
- [ ] 3.4 Extract the variant group derivation from `variants/variation-table/single-group.tsx` (466L, 9 hooks) into `features/products/lib/`. Tests must cover the derivation, not the rendering.
- [ ] 3.5 Reduce `product-form.tsx` and `single-group.tsx` to markup plus hook calls. `edit-product.tsx` and `create-product.tsx` already have the target shape — leave them alone.
- [ ] 3.6 Verify: `npm run typecheck && npm test`.

## 4. Settings — shipping

- [ ] 4.1 Extract the shipping zone operations from `shipping-settings.tsx` (435L, 6 hooks) into `features/settings/shipping/lib/shipping-zone-operations.ts`: `toggleMethod`, `removeZone`, and the zone→method view-model mapper currently built in the component body. Tests: toggling a method in a zone with several methods, toggling one where `is_enabled` is absent (it defaults true today — assert current behavior), removing a zone, removing the last zone, and a zone with no methods.
- [ ] 4.2 Extract `features/settings/shipping/hooks/use-shipping-settings.ts`: the settings query, the update mutation, the form, the reset effect, the dirty-state effect, and the `setValue`-based pseudo-`setState`. Keep it publishing through `use-settings-page-actions.ts` exactly as before.
- [ ] 4.3 Extract the rule condition/action logic from `shipping-rule-form-card.tsx` (451L, 8 hooks) into `lib/`, with tests for each condition type and action type.
- [ ] 4.4 Extract the destination-selection logic from `select-destination-dialog.tsx` (300L, 7 hooks) into `lib/` with tests.
- [ ] 4.5 Verify: `npm run typecheck && npm test`.

## 5. Settings — tax and the remaining sub-features

- [ ] 5.1 Extract the region/rate mapping from `general-edit-region.tsx` (302L, 9 hooks) and `edit-region-eu.tsx` (347L) into `features/settings/tax/lib/`, with tests. Note the recorded pre-existing issue: EU region rate entries are keyed by `country` while the UI reads them as `state`. Assert current behavior and record it — do not fix it here.
- [ ] 5.2 Extract `tax-region-dialog.tsx` (374L) logic into `lib/` + `hooks/`.
- [ ] 5.3 Fold the three direct `useQueryClient()` calls (`tax-profile.tsx`, `general-edit-region.tsx`, `edit-region-eu.tsx`) into the tax feature's hooks **only where the fold is provably behavior-preserving**. Where it is not, leave the call and record why — an unverifiable cache-invalidation change is not worth the tidiness.
- [ ] 5.4 Extract logic from `multi-currency/available-currency-list.tsx` (292L) and `add-currency-dialog.tsx` (246L, 6 hooks) into `lib/` + `hooks/`, with tests.
- [ ] 5.5 Extract `email-settings/edit-template.tsx` (293L) logic into `lib/` + `hooks/`, with tests.
- [ ] 5.6 Verify: `npm run typecheck && npm test`.

## 6. Bulk-edit

- [ ] 6.1 Extract the fill-down / drag-select engine from `bulk-edit-table/single-row.tsx` (725L — the largest file in the app) into `features/bulk-edit/lib/`: `applyValue`, the fill-down range computation, and the unit-info change handling, as pure functions over plain values.
- [ ] 6.2 Write tests for it: a single-cell edit, a fill-down across a contiguous range, a fill-down that crosses a row type boundary, an empty selection, and a reversed drag (end before start). This is the least-covered and highest-consequence logic in the app.
- [ ] 6.3 Extract `features/bulk-edit/hooks/use-bulk-edit-row.ts` for the stateful part, including the global `mouseup` listener effect. Add a `renderHook` test asserting the listener is removed on unmount — a leaked global listener is exactly the bug this shape invites.
- [ ] 6.4 Reduce `single-row.tsx` to markup plus the hook call.
- [ ] 6.5 Verify: `npm run typecheck && npm test`.

## 7. List and table pages

- [ ] 7.1 Extract the shared list-page wiring (`useListParams` → query → bulk-delete mutation → pagination and bulk-apply handlers) for `product-table`, `order-table`, `coupon-table`, `customer-table`, `brand-table`, `collection-table`, `category-table`, `tag-table` and `inventory-table`.
- [ ] 7.2 **Keep every `columns` array at module scope.** `product-table.tsx` documents why in a comment: the stable reference is what lets the memoized header sit out a search. A `columns` array that gains a hook call is a defect, not a refactor.
- [ ] 7.3 After three or four are done, decide whether the remainder share one `use-list-page` hook or keep parallel per-feature hooks — the design defers this deliberately until the real variation is visible. Record the decision in design.md as a "Correction during implementation" note if it differs from either expectation.
- [ ] 7.4 Verify: `npm run typecheck && npm test`.

## 8. Service-layer coverage

- [ ] 8.1 Add MSW handlers and tests for the response paths where WordPress REST payloads are known to drift: an endpoint returning a keyed object where a list is read (the `unwrapDataList` path), and one returning `[]` for an empty associative array where an object is expected.
- [ ] 8.2 Add a test for `/settings/payments`, the recorded pre-existing crash path — a gateway map arriving keyed by id.
- [ ] 8.3 Add tests asserting that a schema mismatch surfaces as a reported validation error rather than a property-access crash, covering both `parseData` (queries) and `parseResponse` (mutations).
- [ ] 8.4 Verify: `npm run typecheck && npm test`.

## 9. Final verification

- [ ] 9.1 Confirm no route component under `features/*/pages/` still contains data-shaping logic, multi-branch operation decisions, or multi-step server orchestration.
- [ ] 9.2 Confirm every function added under a `features/*/lib/` directory has tests, and that each test asserts resulting values rather than call counts.
- [ ] 9.3 Confirm `use-settings-page-actions.ts` is unchanged and all 11 settings sub-pages still publish through it.
- [ ] 9.4 Re-run the pending manual QA carried over from `stacked-items-primitive`, `rule-items-primitive` and `variant-matrix-regeneration` against this tree, and close those tasks.
- [ ] 9.5 Final verification: `npm run typecheck && npm test`, plus `npm run lint && npm run build`.
