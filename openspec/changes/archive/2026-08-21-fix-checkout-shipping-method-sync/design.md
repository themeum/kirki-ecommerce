## Context

See proposal.md - Why. The bug lives entirely in `resources/site/ts/components/checkout.ts`'s `checkout()` Alpine component. `init()` is called synchronously by Alpine while it walks the DOM tree processing `x-data` directives. `#shipping-form` and `#billing-form` are separate nested `x-data="form(...)"` components declared *inside* `checkout()`'s element (see `resources/site/ts/components/form.ts` and the `site.checkout.parts.shipping-form` / `billing-form` views).

Alpine's tree walk processes directives in DOM order, parent before descendants. `checkout()`'s `x-data` sits on the outer `.kecom-page-wrapper`, so its `init()` runs *before* Alpine has processed the nested `#shipping-form`/`#billing-form` elements. `window.Alpine.$data(el)` only returns a component's reactive data once Alpine has processed that element's `x-data` — so calling it for `#shipping-form` synchronously inside `checkout()`'s own `init()` is unsafe: the existing `updateCart()` method (used elsewhere only from event handlers that fire well after the whole tree is initialized) would read from a component that doesn't exist yet.

`resources/site/` has no unit test harness (no Vitest config, no `test` script — only `typecheck` and `lint`, per `resources/site/package.json`). Verification for this capability is manual/visual, which is out of scope for this session per the project's testing note (no browser tool) — the user will need to confirm in-browser.

## Goals / Non-Goals

**Goals:**
- Make the checkout page's displayed pricing (subtotal/shipping/tax/total) reflect the shipping method that appears selected, immediately on first render, without requiring an unrelated field edit.
- Keep the fix localized to the default-selection branch in `init()`.

**Non-Goals:**
- Changing how `available_shipping_methods` are computed or how the server picks eligible methods.
- Adding a general test harness for `resources/site/` Alpine components (out of scope for this fix).
- Changing behavior when the cart already has a `shipping_method`, or has no address/no available methods (existing behavior is already correct there).

## Decisions

**Defer the sync to the next microtask via Alpine's `$nextTick()`, not a direct call in `init()`.**

`init()` sets `this.selectedShippingMethod` from `availableShippingMethods[0].id` synchronously (unchanged — this part is safe, it only touches `checkout()`'s own state). The new sync call is wrapped in `(this as unknown as AlpineContext & { $nextTick: (fn: () => void) => void }).$nextTick(() => this.updateCart())`. `$nextTick` schedules its callback after Alpine finishes the current synchronous DOM walk (and initializes `#shipping-form`/`#billing-form` along the way), so by the time it fires, `window.Alpine.$data(shippingFormEl)` resolves to a fully-initialized component with `values` populated from the server-rendered address. This mirrors the existing pattern already used in `stateField()`'s `init()` (`resources/site/ts/components/checkout.ts:572` uses a double `$nextTick`), so it's an established idiom in this file rather than a new one.

Alternative considered: read the address directly out of `config.checkout_cart`/the initial cart instead of the live form, to avoid depending on Alpine's init order at all. Rejected — `checkout_cart` (built in `PageInlineScript.php`) does not include `shipping_address`; only the PHP-rendered `shipping-form` partial has it. Sourcing address data from two different places (config vs. form) for the same payload shape `updateCart()` already builds would duplicate logic for no benefit, whereas `$nextTick()` lets us reuse `updateCart()` unchanged.

Alternative considered: gate the default-selection sync behind an explicit check that address fields are non-empty before calling `updateCart()`. Not needed — `availableShippingMethods` is only ever non-empty when the server has already resolved shipping methods against a saved address, so the existing `if (this.cartData?.available_shipping_methods)` guard already implies an address is present.

## Risks / Trade-offs

- **[Risk]** `$nextTick()` callback ordering assumes Alpine has finished initializing sibling `x-data` components in the same tick. → **Mitigation**: this is the same assumption `stateField()` already relies on elsewhere in this file; if it were wrong, that existing code would already be broken. No new risk class introduced.
- **[Risk]** Firing an extra `updateCart()` PATCH on every checkout page load where no shipping method is saved yet (previously this branch made zero network calls). → **Mitigation**: this is the intended fix — the whole point is to persist the default selection. The call only fires once per page load in this specific case (cart has an address-derived `available_shipping_methods` list but no saved `shipping_method`), not on every render.
- **[Trade-off]** No automated test coverage for this change (no test harness exists for `resources/site/`). Verification is limited to `typecheck`/`lint` plus manual confirmation, which the user will need to do themselves.
