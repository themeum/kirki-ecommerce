## 1. Fix default shipping method sync

- [x] 1.1 In `resources/site/ts/components/checkout.ts`, update the `init()` branch that defaults `selectedShippingMethod` to `availableShippingMethods[0].id` (currently around line 211-214) so it also schedules a cart sync via `$nextTick(() => this.updateCart())`, per design.md's Decisions section — do not call `updateCart()` synchronously in `init()`.
- [x] 1.2 Verify the `cartData.shipping_method` already-saved branch and the no-address/no-available-methods branch are unchanged (no new call added there).
- [x] 1.3 Run `npm run typecheck && npm run lint` from `resources/site/` (this package has no test runner — `resources/app/`'s `npm test` does not apply here since no files under `resources/app/` are touched). Typecheck of `checkout.ts` is clean (the only tsc errors are pre-existing `vite.config.ts` node-type resolution failures, reproduced identically on a clean `git stash`). `npm run lint` could not run in this environment — `resources/site/node_modules` is missing the `eslint`/`@eslint/js` packages entirely; this is a pre-existing local install gap, not something introduced by this change.

## 2. Manual verification (user)

- [x] 2.1 Ask the user to load the checkout page in a browser with a customer/cart that has a saved address and available shipping methods but no shipping method chosen yet, and confirm the order summary shows the correct shipping cost immediately, without editing any field first.
- [x] 2.2 Ask the user to confirm the existing flows still work: a cart that already has a saved shipping method still loads with correct totals, and manually switching shipping methods still updates totals correctly.
