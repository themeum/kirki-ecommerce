## Context

`resources/app/features/orders/schemas/catalog/order.ts` was never updated when `OrderResource.php`/`OrderCalculationResource.php` were restructured to exclusive/inclusive money-object pairs, per-item strikethrough pricing, and root-level `tax_lines`/`coupons` arrays (the `admin-order-pricing-breakdown`, `admin-order-calculation-breakdown`, `order-tax-lines`, and `order-coupon-attribution` capabilities already describe this backend shape and are already live). Every fact below was verified by reading the actual PHP source and every affected frontend file directly, not inferred. See proposal.md - Why.

## Goals / Non-Goals

**Goals:**
- Bring `order.ts` (and everything that imports its types) back in line with the real `OrderResource`/`OrderCalculationResource` output.
- Make the payment summary UI render the itemized coupon/tax-line data the backend already provides.
- Cap the order-create quantity stepper at stock and reconcile the form against calculation drift, per the two new capability specs.
- Reduce the order-create page's prop-drilling and its worst re-render hotspot.

**Non-Goals:**
- No backend PHP changes (verified none are needed).
- No change to the storefront cart/checkout flow, `cart-item-quantity-limits`, or any other existing capability's requirements.
- No migration of historical data — this is a pure code-shape change.

## Decisions

### 1. Naming: keep the existing local `OrderItem`, name the new catalog item type `OrderLineItem`

`resources/app/features/orders/types.ts` already exports `OrderItem = { index; quantity; display }`, consumed pervasively (`order-items.ts`, `use-order-create.ts`, `product-selection-card.tsx`, `order-item-row.tsx`). Renaming the catalog schema's whole-order type `OrderItemSchema` → `OrderSchema` (per the request) frees that name, but the *new* per-line-item schema needs its own name too. Alternative considered: reuse `OrderItem` for the new catalog line-item type and rename the pervasive local UI-row type instead — rejected because it has the larger blast radius for zero benefit (Surgical Changes). Decision: the catalog line-item schema is `OrderLineItemSchema`/`OrderLineItem`; the calculation's own item schema is `OrderCalculationItemSchema`/`OrderCalculationItem`; the local UI-row `OrderItem` in `types.ts` is untouched.

This does collide with one existing import: `items-table.tsx` does `import type { OrderItem } from '.../schemas/catalog/order'` (today's whole-order type, indexed `OrderItem['items']`) — becomes `import type { Order } from '...'; Order['items']`.

### 2. Catalog schema shapes — verified field-by-field against the PHP resources

Key facts that shape the schema, each confirmed by reading source directly (not inferred from naming):
- Tax `rate` and `discount_amount_percentage` are whole-number percentages (`AbstractTaxStrategy::calculate_tax_amount()` divides by 100; `discount-popover.tsx` already renders the sibling field `base_discount_amount` the same way). Render as `` `${rate}%` ``, not `${rate * 100}%`.
- `OrderCalculationController::prepare_items()` sets `$item_dto->id = $key` — the calculation item's `id` **is** the submitted `items[]` request-array index, not a database id. This is the documented reconciliation key, not a coincidence to rely on defensively.
- `refunds[]` on the new `OrderResource` emits only `invoiced_amount_money_object` — no raw amount, no base-currency twin.
- `OrderCalculationResource` drops `display_*` entirely (base-currency only, matching `admin-order-calculation-breakdown`'s "no display-currency figure" requirement) and `available_shipping_methods[]` loses `display_cost_money_object`.
- `shipping-popover.tsx` already only reads `base_cost_money_object` — needs no change.
- `OrderListResource.php` is a separate, flat, unrelated resource; `OrderListItemSchema`'s `.pick({id,uuid,order_number,customer_id})` from the renamed `OrderSchema` needs only the rename, since those four fields are stable across both resources.

New/rewritten schema exports in `order.ts`: `OrderAddressSchema` (narrower than `CustomerAddressSchema` — no `id`/`type`/`label`/`is_default_*`), `OrderTaxLineSchema`/`OrderCalculationTaxLineSchema` (drop raw amount fields, keep only `*_money_object`), `OrderCouponSchema`/`OrderAppliedProductCouponSchema`/`OrderCalculationCouponSchema`/`OrderCalculationAppliedCouponSchema` (reusing `CouponDiscountTypeSchema`/`CouponDiscountTargetSchema`/`CouponDiscountValueTypeSchema` from `@/features/coupons` rather than re-declaring the enums — requires adding those three to that feature's barrel, since it currently only re-exports `CouponSchema`), `OrderLineItemSchema`, `OrderCalculationItemSchema`, rewritten `RefundSchema`, rewritten `OrderSchema`, rewritten `OrderCalculationSchema`. Full field-by-field shapes (money-object keys, nullability) are captured directly in the exact PHP `to_array()` output and should be transcribed 1:1 during implementation rather than re-derived — every `*_money_object` field is `MoneyObjectSchema`, every field the PHP mapper can omit (`?? null`/ternary-to-null) is `.nullish()`, and array fields the mapper always returns (even empty) are `.default([])`.

This rewrite ripples into `services/order.ts` (imports `OrderItemSchema` and the `OrderItem` type — both need the rename) — not called out in the original request but a direct, mechanical consequence, not scope creep.

### 3. `payment-summary-card.tsx` props derived via `Pick`, not a hand-rolled type

`PaymentSummaryAmounts` (current lines 21-28) is deleted. New props (`totals`, `coupons`, `taxLines`, `isTaxInclusive`, `itemsCount`) are `Pick<>` types off `OrderCalculation`'s fields. This type is structurally satisfied by `Order` too, since both resources share identical `totals`/`coupons`/`tax_lines` field names by design — no adapter needed. `PaymentSummaryCard` is shared with the read-only `order-details.tsx` (confirmed: `order.totals.base_subtotal_money_object`, `order.totals.coupons` — the *current, stale* shape), so both call sites need their prop-building updated as a direct consequence of the schema rewrite; `items-table.tsx` similarly reads two fields (`base_price_money_object`, `base_total_money_object`) that don't exist on `OrderLineItemSchema` and needs a small redesign (quantity + subtotal, mirroring `order-item-row.tsx`'s pattern).

Render order (screenshot 1): subtotal (item count + amount) → one row per `coupons[]` entry (first row carries the "Edit Discounts" trigger, subsequent rows blank-labeled) → divider → "Total" (pre-shipping/tax order total) → shipping row → one row per `taxLines[]` entry under "Estimated Tax" → divider → "Order total" (grand total).

### 4. `available_quantity`: a mapper fix, not new plumbing in `order-create.tsx`

`VariantSchema.available_quantity` is already on the API response `ProductListItemWithVariantsSchema.variants` consumes; `buildVariantSelections` (`build-selection.ts`) just doesn't map it into `ProductVariantSelectionSchema`. `select-products-dialog/types.ts` re-exports the schema's inferred type directly (not a redeclaration), so adding `availableQuantity: z.number()` to `ProductVariantSelectionSchema` and mapping `variant.available_quantity` in `buildVariantSelections` is sufficient — it flows unchanged through `SelectProductsDialog`'s `onAdd` → `handleAddItems` → `selections` → `getDisplayByVariantId` → `getOrderRows` → `row.display.availableQuantity`. Alternative considered (and rejected): adding explicit plumbing inside `order-create.tsx`'s `onAdd` handler, as the original request phrased it — rejected because the data already flows through that handler unchanged; adding code there would be redundant plumbing the existing data path doesn't need.

`quantity-stepper.tsx` gains an optional `max` prop; the '+' button is `disabled={isDefined(max) && value >= max}`, and the input's `onChange` clamps with `Math.min(max ?? Infinity, ...)`. `order-item-row.tsx` passes `max={display.availableQuantity}`.

### 5. `use-order-create.ts` reconciliation: index-keyed matching, ref-guarded, not a hard requirement for correctness

Matching key for items: the calculation item's `id` (= submitted-array index, per decision 2) — build once as `calculationItemById = new Map(calculation.items.map(i => [i.id, i]))`, shared with `OrderCreateContext` so `product-selection-card.tsx`'s existing `calculationItems?.[row.index]` array-position lookup and the reconciliation effect use the same source of truth instead of two independent derivations.

Reconciliation effect, on `calculation` change: (1) any `pickedItems[index]` whose quantity differs from `calculationItemById.get(index)?.quantity` gets `updateItems`'d to match; (2) any code in `form.getValues('coupon_codes')` absent from `calculation.coupons` (by `code`) is removed via `setValue` and collected into `rejectedCouponCodes` state, exposed through context to `discount-popover.tsx`; (3) if `calculation.shipping_method` differs from the form's, `setValue` syncs it. All three use `{shouldValidate: false, shouldDirty: false}`.

Loop-avoidance: an `isReconcilingRef`, set after any correction and cleared after `CALCULATION_DEBOUNCE_DELAY + ~50ms`, gates `useOrderCalculationQuery`'s `enabled`. This is a UX optimization, not a correctness requirement — each correction moves the form *toward* what the backend already computed, so even an unguarded extra request would converge (the corrected payload now matches what produced `calculation`, so the response repeats with no new mismatch, no further `setValue`, no runaway loop). The guard exists purely to skip that one avoidable round-trip and the calculation-card flicker it would cause. This satisfies the "no redundant recalculation request" requirement in `order-create-calculation-reconciliation`'s spec without needing request-level deduplication — `useOrderCalculationQuery`'s query key already embeds the full payload, so even without the guard, a request for an unchanged payload is a cache hit, not a network call; the guard's only job is skipping the *changed*-but-now-matching payload's one request.

### 6. `OrderCreateContext` scoped to create-flow-only components

Context value: `{ calculation, calculationItemById, rows, isCalculating, rejectedCouponCodes }`, feature-scoped file (`features/orders/contexts/order-create-context.tsx`) matching the existing `bulk-edit-options-context.tsx` convention (plain `useX()` accessor, no throw guard — page-scoped, not global). Consumed by `ProductSelectionCard`, `OrderItemRow`, `DiscountPopover`. Explicitly *not* consumed by `PaymentSummaryCard`, since that component is also rendered on `order-details.tsx` with no such provider — wiring it to context would either silently degrade there (falling back to the context's default value, an implicit dependency on which page rendered it) or force a pointless empty provider on the details page. `PaymentSummaryCard` stays prop-based (decision 3).

`customer-card.tsx`'s unscoped `useWatch({control: form.control})` (confirmed: feeds `values.shipping_first_name/last_name/email/phone` plus `formatBillingAddress`/`formatShippingAddress`, which read every `shipping_*`/`billing_*` address field and `is_billing_same_as_shipping`) is fixed separately, by scoping the `name` array to exactly those fields — this is react-hook-form field-watch scoping, orthogonal to the new context, not folded into it.

### 7. `discount-popover.tsx`: banner only, not a rewrite

The existing applied-coupon list (title/code + `"{amount} off {scope}"` + remove ×) already matches screenshot 2. Only add: one `Alert` (existing component, `type="fail"`) per entry in `rejectedCouponCodes` (from context, filtered by local `dismissedCodes` state reset alongside `draft`/`search` on reopen), and rename the footer's "Apply" button to "Save" per the screenshot.

## Risks / Trade-offs

- [Rewriting `order.ts` is a hard breaking change to every internal consumer] → The rename itself (`OrderItemSchema`→`OrderSchema`) is a deliberate forcing function: `npm run typecheck` will surface every stale-shape consumer as a compile error, which is the safety net for catching consumers this design didn't enumerate (e.g. `order-table/columns.tsx`, `lib/order-badge.ts`, `lib/order-actions.ts` — not confirmed to need changes, but must be grepped and typechecked as part of implementation).
- [Test fixtures under `resources/app/features/orders/tests/` hand-construct the old payload shape] → These need a full rewrite, not a patch, since nearly every money-field name changed; budget this as its own task rather than an afterthought.
- [`OrderCalculationRequestSchema`'s billing-address fields, once extended to match `OrderCalculationRequest::rules()`, are sent raw (not defaulted from shipping when "same as shipping" is checked), since `OrderCalculationController::prepare_context_dto()` reads `billing_first_name` etc. verbatim with no same-as-shipping awareness] → Confirm during implementation this doesn't produce a blank/wrong billing address in the calculation context when the checkbox is on and billing fields are empty; if calculation behavior depends on it, the calculation transform may need the same `buildBillingFields`-style fallback the Create transform already uses.

## Correction during implementation

- **`toOrderAddresses()` needed to populate the new `shipping_id`/`billing_id` fields (per explicit direction), not just the address detail fields.** `OrderCreateAction::sync_address()` uses `shipping_id`/`billing_id` only to skip creating a duplicate customer-address record — it never skips validation or the full-detail fields based on their presence (`OrderCreateRequest::rules()` requires every shipping/billing detail field regardless). So `toOrderAddresses()` in `lib/customer-address.ts` now also sets `shipping_id: shipping?.id ?? null` and `billing_id` (the shipping address's id when `is_billing_same_as_shipping`, else the billing address's own id) alongside all the existing detail fields, which are unchanged.
- **Decision 4's max-quantity rule was incomplete.** `available_quantity` alone isn't sufficient to cap the quantity stepper: a variant can be backorder-eligible (`allow_back_order`) or not track inventory at all (`track_inventory: false`), in which case the stock figure shouldn't cap anything, and separately a variant can carry its own per-order cap (`has_limit_per_order`/`max_per_order`) independent of stock. `ProductVariantSelectionSchema` gained `allowBackOrder`, `trackInventory`, `hasLimitPerOrder`, `maxPerOrder` alongside `availableQuantity` (mapped in `buildVariantSelections`), and a new `getMaxQuantity(display)` helper in `lib/order-items.ts` resolves the effective ceiling: the stock limit applies only when `trackInventory && !allowBackOrder`; the per-order limit applies whenever `hasLimitPerOrder`; when both apply, the smaller wins. `order-item-row.tsx` passes `max={getMaxQuantity(display)}` (task 4.4) instead of `max={display.availableQuantity}`.
