## 1. Coupon enum barrel export

- [x] 1.1 Add `CouponDiscountTargetSchema`, `CouponDiscountTypeSchema`, `CouponDiscountValueTypeSchema` re-exports to `resources/app/features/coupons/index.ts` (alongside the existing `CouponSchema` export)
- [x] 1.2 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 2. Catalog schema rewrite (`schemas/catalog/order.ts`)

- [x] 2.1 Add `OrderAddressSchema`; rewrite `OrderTaxLineSchema`, add `OrderCalculationTaxLineSchema`; remove `CalculatedTaxLineSchema`/`AggregatedTaxLineSchema`
- [x] 2.2 Add `OrderCouponSchema`, `OrderAppliedProductCouponSchema`, `OrderCalculationCouponSchema`, `OrderCalculationAppliedCouponSchema` (import the enum schemas from `@/features/coupons` per task 1.1)
- [x] 2.3 Add `OrderLineItemSchema` (+ `OrderLineItem` type) and `OrderCalculationItemSchema` (+ `OrderCalculationItem` type), matching `OrderResource::prepare_items()`/`OrderCalculationResource::prepare_items()` field-by-field (design.md §2)
- [x] 2.4 Rewrite `RefundSchema` (drop raw `invoiced_amount`, no base-currency twin)
- [x] 2.5 Rename `OrderItemSchema` → `OrderSchema` (+ `OrderItem` type → `Order`) and rewrite its fields to match `OrderResource::to_array()` exactly (design.md §2)
- [x] 2.6 Rewrite `OrderCalculationSchema` (+ `OrderCalculation` type) to match `OrderCalculationResource::to_array()` exactly — base-currency only, no `display_*` fields
- [x] 2.7 Update `OrderListItemSchema`'s `.pick(...)` source from `OrderItemSchema` to `OrderSchema` (rename only, fields unchanged)
- [x] 2.8 Rewrite `resources/app/features/orders/tests/schemas/catalog/order.test.ts` fixtures against the new shapes
- [x] 2.9 Verify: `npm run typecheck && npm test` (from `resources/app/`) — order.test.ts passes (38/38); full suite verified at the end (task 9.3)

## 3. Form schema update (`schemas/forms/order-form.ts`)

- [x] 3.1 Add `payment_provider`, `shipping_id`, `billing_id`, `customer_email`, `customer_phone`, `consents` to `OrderFormShape` (nullable, using `stringOrNull()`/`numberOrNull()` per design.md §"Hard constraints" in `openspec/project.md`)
- [x] 3.2 Add `payment_provider`, `shipping_id`, `billing_id`, `customer_email`, `consents` to `OrderFormSchema`'s `.transform()` output (matches `OrderCreateRequest::rules()` — no `customer_phone` there)
- [x] 3.3 Extend `OrderCalculationRequestSchema`'s `.transform()` to forward the full field set `OrderCalculationRequest::rules()` accepts (billing block, `shipping_company`, `payment_provider`, `customer_email`, `customer_phone`, `admin_notes`, `is_manual`) as raw pass-through — do not reuse `buildBillingFields` here (design.md §2, Create-only same-as-shipping logic)
- [x] 3.4 Update `resources/app/features/orders/tests/schemas/forms/order-form.test.ts` payload fixtures for both schemas — also rewrote the test that asserted the calculation schema *omits* billing/notes/manual fields, since it now forwards them
- [x] 3.5 Verify: `npm run typecheck && npm test` (from `resources/app/`) — order-form.test.ts passes (27/27)

## 4. `available_quantity` plumbing

- [x] 4.1 Add `availableQuantity: z.number()` to `ProductVariantSelectionSchema` in `resources/app/features/products/schemas/catalog/product-selection.ts` — **corrected during implementation**: also added `allowBackOrder`, `trackInventory`, `hasLimitPerOrder`, `maxPerOrder` (per explicit direction), since the stock ceiling alone was wrong for backorder-eligible/untracked variants; see design.md correction log
- [x] 4.2 Map `availableQuantity: variant.available_quantity` in `buildVariantSelections` (`.../select-products-dialog/build-selection.ts`) — plus the four new fields from 4.1
- [x] 4.3 Add optional `max` prop to `QuantityStepperProps`; disable '+' at `value >= max`; clamp the number input's `onChange` to `max`
- [x] 4.4 Pass `max={getMaxQuantity(display)}` from `order-item-row.tsx` (folded into task 6.3's context-consumption rewrite of that file) — `getMaxQuantity()` added to `lib/order-items.ts`, combining stock + per-order-limit ceilings
- [x] 4.5 Verify: `npm run typecheck && npm test` (from `resources/app/`); manually confirm no code change was needed in `order-create.tsx`'s `onAdd`/`handleAddItems` (design.md §4) — confirmed, `handleAddItems` unchanged

## 5. `OrderCreateContext` and `customer-card.tsx` fix

- [x] 5.1 Create `resources/app/features/orders/contexts/order-create-context.tsx` (`calculation`, `calculationItemById`, `rows`, `isCalculating`, `rejectedCouponCodes`), matching the `bulk-edit-options-context.tsx` convention
- [x] 5.2 Scope `customer-card.tsx`'s unscoped `useWatch({control})` (line 79) to the exact field list it reads (design.md §6); verify the installed react-hook-form version's return shape for array-`name` `useWatch` before wiring destructuring — confirmed RHF 7.81.0's array-`name` overload returns a positional tuple (`FieldPathValues`), not an object; destructured by position and rebuilt into an object. **Corrected during implementation**: also updated `toOrderAddresses()` to populate the new `shipping_id`/`billing_id` fields from the customer's default addresses (per explicit direction); see design.md correction log
- [x] 5.3 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 6. `use-order-create.ts` reconciliation

- [x] 6.1 Build `calculationItemById` (keyed by the calculation item's `id`, i.e. the submitted-array index) once in `useOrderCreate()`
- [x] 6.2 Implement the reconciliation effect: item-quantity sync, coupon-rejection sync (+ `rejectedCouponCodes` state), shipping-method sync, each per `order-create-calculation-reconciliation`'s spec scenarios
- [x] 6.3 Implement the `isReconcilingRef` guard gating `useOrderCalculationQuery`'s `enabled` (design.md §5)
- [x] 6.4 Wire `OrderCreateProvider` into `order-create.tsx`, fed from `useOrderCreate()`'s (now extended) return value
- [x] 6.5 Update `ProductSelectionCard` to read `rows` from context (drop the prop); update `OrderItemRow` to read `calculationItemById`/`calculation.is_tax_inclusive` from context (drop the `calculationItem` prop) and fix its stale `base_total_money_object` reference to `base_subtotal_exclusive_money_object`/`base_subtotal_inclusive_money_object` per `is_tax_inclusive`; pass `max={getMaxQuantity(display)}` to `QuantityStepper` here (task 4.4)
- [x] 6.6 Extend `resources/app/features/orders/tests/hooks/use-order-create.test.tsx` with cases for: a clamped quantity syncing, a rejected coupon code being removed and surfaced, a changed shipping method syncing, and no redundant calculation request firing from the sync itself
- [x] 6.7 Verify: `npm run typecheck && npm test` (from `resources/app/`) — use-order-create.test.tsx passes (6/6)

## 7. `payment-summary-card.tsx` redesign and call sites

- [x] 7.1 Delete `PaymentSummaryAmounts`; add `PaymentSummaryTotals`/`PaymentSummaryCoupon`/`PaymentSummaryTaxLine` (`Pick<>` off `OrderCalculation`) and the new `PaymentSummaryCardProps` (design.md §3)
- [x] 7.2 Rewrite the render structure: per-coupon rows, per-tax-line rows, the two totals rows, per screenshot 1
- [x] 7.3 Update `order-create.tsx`'s call site to the new props, sourced from `calculation`
- [x] 7.4 Update `order-details.tsx`'s call site to the new props, sourced from `order` (fixes its current incorrect `order.totals.coupons` read)
- [x] 7.5 Fix `items-table.tsx`: rename the `OrderItem` type import to `Order` (`Order['items']`), replace `item.base_price_money_object`/`item.base_total_money_object` with a quantity + subtotal display
- [x] 7.6 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 8. `discount-popover.tsx` rejection banner

- [x] 8.1 Read `rejectedCouponCodes` from `OrderCreateContext`; add local `dismissedCodes` state (reset alongside `draft`/`search` on reopen)
- [x] 8.2 Render one `Alert` (`type="fail"`) per visible rejected code, per screenshot 2's copy and layout — the dismiss button had to go inside the `text` prop (a `Flex` wrapping the message + button), since `Alert` doesn't render its own `children`, only `icon`/`text`
- [x] 8.3 ~~Rename the footer's "Apply" button to "Save"~~ — **skipped per explicit direction**: keep it as "Apply"
- [x] 8.4 Verify: `npm run typecheck && npm test` (from `resources/app/`)

## 9. Stale-reference sweep

- [x] 9.1 Grep the whole `orders` feature (and `order-table/columns.tsx`, `lib/order-badge.ts`, `lib/order-actions.ts`, `lib/order-address.ts`) for stale field names (`base_subtotal_money_object`, `.totals.coupons`, `shipping_tax_lines`, non-`_money_object` raw tax/refund amounts) and old `OrderItemSchema`/`OrderItem` (catalog) imports; fix every hit — no remaining hits outside test files (already fixed while rewriting each consumer in groups 2/7/9)
- [x] 9.2 Confirm `resources/app/features/orders/tests/lib/order-items.test.ts` needs no change (no signature change to `getOrderRows`/`mergeSelections`/`getDisplayByVariantId`) — update if it does: fixtures needed the 5 new `ProductVariantSelection` fields, and added coverage for the new `getMaxQuantity()` helper (5 tests)
- [x] 9.3 Verify: `npm run typecheck && npm test` (from `resources/app/`) with zero remaining errors across the whole `resources/app/` project, not just the `orders` feature — `npm run typecheck` clean, `npm test` 140/140 files, 1170/1170 tests passing, `eslint` clean on all touched files
